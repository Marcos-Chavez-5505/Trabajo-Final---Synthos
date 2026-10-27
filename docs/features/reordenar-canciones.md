# FEATURE: Reordenar canciones

> Alcance: este documento cubre **una sola feature**.

| Campo       | Valor                             |
| ----------- | --------------------------------- |
| Feature     | Reordenar canciones (drag & drop) |
| Producto    | App de música social (Synthos)   |
| Estado      | Implementada                          |
| Prioridad   | P1 (importante, no bloquea)       |
| Responsable | TBD                               |

> **Nota para agentes:** los valores marcados **(propuesto)** son supuestos de partida, no decisiones confirmadas. Implementarlos como constantes con nombre en un único archivo de configuración para poder cambiarlos fácilmente. Preguntar antes de cambiar cualquier cosa que no figure aquí.

---

## 01. Propósito

Permitir al usuario cambiar el orden de las canciones de una lista moviéndolas de arriba a abajo, y que ese orden quede guardado en la base de datos y se mantenga entre sesiones y dispositivos.

Aplica a tres tipos de lista:

- **Playlists propias**
- **Playlists colaborativas**
- **Favoritos / Mi Colección**

---

## 02. Historia de usuario

Como usuario, quiero arrastrar una canción a otra posición de mi lista, para escucharlas en el orden que prefiero sin tener que quitarlas y volver a agregarlas.

---

## 03. Flujo de usuario

1. El usuario abre una de sus listas (playlist propia o colaborativa, o Favoritos / Mi Colección).
2. Arrastra una canción (desktop: mouse; mobile: toque sostenido y arrastre) y la suelta en otra posición.
3. La interfaz refleja el nuevo orden **de inmediato** (actualización optimista).
4. Tras una breve pausa sin más movimientos, el frontend envía el nuevo orden al backend.
5. Si el guardado falla, la lista vuelve al orden anterior y se muestra un aviso.

---

## 04. Entradas

| Entrada                      | Obligatoria     | Reglas                                                                                                                                    |
| ---------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Id de la lista               | Sí (playlists) | Debe existir y el usuario debe ser dueño o colaborador. Para Favoritos / Mi Colección no hay id de lista: se usa el usuario autenticado |
| Orden completo (`songIds`) | Sí             | Array de ids sin repetir                                                                                                                  |

No hay un máximo de canciones por lista (ver 07). Los permisos están definidos en la sección 09.

Validar todas las entradas en el servidor, no solo en el cliente.

---

## 05. Salidas

El backend responde con el resultado del guardado. El frontend ya tiene el orden en pantalla gracias a la actualización optimista.

```
PUT /api/playlists/:id/songs/order
{ "songIds": [12, 7, 33, 5] }
```

Favoritos / Mi Colección usa un **endpoint propio**, con el mismo cuerpo y la misma respuesta (propuesto):

```
PUT /api/favorites/order
{ "songIds": [12, 7, 33, 5] }
```

> **Pendiente:** confirmar la ruta contra el contrato actual de favoritos en `docs/ESPECIFICACIONES-BACKEND.md` §8.

Respuesta (propuesto):

```
200 { "songIds": [12, 7, 33, 5, 41], "merged": true }
```

- `songIds`: el orden final guardado.
- `merged`: `true` si el backend tuvo que conciliar diferencias con el estado actual de la lista (ver reglas). En ese caso el frontend recarga la lista para mostrar el orden real.

> **Pendiente:** documentar el contrato final en `docs/ESPECIFICACIONES-BACKEND.md` §9.

Reglas de **fusión** (el backend concilia en lugar de rechazar):

- Los ids enviados que ya no están en la lista (alguien quitó la canción) se **ignoran**.
- Las canciones que están en la lista pero no en lo enviado (alguien las agregó) se **agregan al final**, conservando su orden relativo actual.
- Los ids repetidos o con formato inválido se rechazan con `400`.
- Todo el proceso corre en una transacción que bloquea la lista, para que dos reordenamientos simultáneos se apliquen uno después del otro.
- Si dos personas reordenan a la vez, **gana el último en escribir**.

---

## 06. Características (qué hace)

- Reordena canciones con drag & drop en desktop y mobile (mismo codebase).
- Actualiza la UI al instante y guarda en segundo plano.
- Agrupa los movimientos rápidos en **una sola petición** (debounce).
- Envía siempre el **orden completo**: la operación es idempotente y se autocorrige.
- Concilia cambios concurrentes en playlists colaborativas (fusión) en lugar de rechazar el reordenamiento.
- Revierte al último orden guardado si falla el request.
- Guarda pendientes al ocultar la pestaña, desmontar la vista o pasar la app a segundo plano.
- Persiste el orden en la columna `position`: la de `playlist_song` (ya existe) para playlists, y una nueva en `favorite` para Favoritos / Mi Colección.

---

## 07. Limitaciones (qué no hace)

**Límites de producto**

- No reordena la cola de reproducción ni la cola de una sala (`rooms`).
- No agrega ni quita canciones: solo cambia su posición.
- **No afecta a las salas.** Reordenar una playlist que sirve de fuente a una sala (`colab`) no cambia lo que suena ni la cola de esa sala. La sala conserva su propio estado de reproducción.
- **No impone un máximo de canciones por lista.** Hoy no existe ese límite y esta feature no lo introduce. Como consecuencia, el tamaño de la petición crece con la lista: un id pesa unos pocos bytes, así que unas pocas miles de canciones siguen cabiendo en el límite por defecto del body JSON de Express (100 kb). Confirmar el límite configurado en el backend.

**Límites operativos (propuesto)**

| Límite                                | Valor                |
| -------------------------------------- | -------------------- |
| Espera (debounce) tras el último drop | 600 ms               |
| Peticiones simultáneas por lista      | 1                    |
| Reintentos automáticos al fallar      | 0 (revierte y avisa) |

---

## 08. Enfoque técnico

| Aspecto             | Enfoque                                                                                                                                                                                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Endpoint            | `PUT /api/playlists/:id/songs/order`                                                                                                                                                                                                                                    |
| Service             | `playlistsService.js` → `updateSongsOrder(playlistId, songIds)` usando el helper `put` de `api.js`                                                                                                                                                               |
| Lógica de cliente  | Hook `features/playlists/useReorderSongs.js` (debounce, una petición en vuelo, rollback, flush)                                                                                                                                                                        |
| Componente          | La lista solo dispara `onReorder(nextSongs)`; sin `fetch` dentro de `components/`                                                                                                                                                                                   |
| Modelo de datos     | Una sola tabla `playlist` con el enum `playlist_type` (`personal`, `colab`, `favorites`) y una sola tabla puente `playlist_song` (`id_playlist`, `id_song`, `position`), con PK compuesta `(id_playlist, id_song)` (`Backend/prisma/schema.prisma`) |
| Base de datos       | Una transacción que reescribe `position` de todas las filas de la lista                                                                                                                                                                                                |
| Escritura           | Con listas sin tope, evitar un `UPDATE` por fila desde Prisma: usar una única sentencia SQL en lote (`UPDATE ... FROM unnest(...)`) dentro de la transacción (propuesto)                                                                                            |
| Concurrencia        | La transacción bloquea la lista (`SELECT ... FOR UPDATE`) y aplica la fusión antes de escribir                                                                                                                                                                        |
| Respuesta           | Incluye `merged`; si es `true`, el frontend recarga la lista                                                                                                                                                                                                          |
| Favoritos: endpoint | `PUT /api/favorites/order`, aparte del de playlists                                                                                                                                                                                                                     |
| Favoritos: service  | Método `update` de favoritos en el service donde vivan hoy las llamadas de favoritos (confirmar si es `playlistsService.js`), p. ej. `updateFavoritesOrder(songIds)`                                                                                               |
| Hook                | `useReorderSongs` recibe la función de guardado como parámetro, así sirve para playlists y para favoritos                                                                                                                                                            |
| Contrato            | Documentado en `docs/ESPECIFICACIONES-BACKEND.md` §8 y §9.2 antes de implementar                                                                                                                                                                                      |

**Favoritos / Mi Colección (decisión: agregar `position` a la tabla `favorite`)**

La tabla `favorite` (PK `(id_user, id_song)`) sigue siendo la fuente de verdad. Es un cambio acotado:

- **Migración (propuesto):**
  1. Agregar `position` a `favorite` como columna nullable.
  2. Rellenarla por usuario ordenando por `marked_date` **descendente**, con `id_song` como desempate, y numerando 0..n-1. El favorito más reciente queda primero, coherente con que los nuevos van al principio.
  3. Marcar la columna `NOT NULL` y crear el índice `(id_user, position)`.
- **Lecturas:** toda lectura de favoritos ordena por `position, id_song`, incluido el reemplazo de `playlist.songs` que hace `getPlaylistById`.
- **Altas:** una canción recién marcada como favorita aparece **al principio**. `addFavorite` le asigna `MIN(position) - 1` del usuario (propuesto), en un solo `INSERT ... SELECT`, sin reescribir las demás filas. Las posiciones pueden quedar con huecos o ser negativas: solo importa el orden relativo. El siguiente reordenamiento las normaliza a 0..n-1.
- **Bajas:** quitar un favorito no necesita reordenar nada; el hueco que deja es válido.
- **Fusión:** a diferencia de las playlists (donde lo desconocido va al final), en favoritos las canciones que no vengan en lo enviado se colocan **al principio**, coherente con las altas (propuesto).
- **Fusión y bloqueo:** misma lógica que en playlists, sobre las filas de `favorite` del usuario (relevante si usa varios dispositivos). La lógica de fusión se comparte en un helper entre ambas tablas.
- Las filas de `playlist_song` de las playlists `favorites` siguen sin usarse. No se tocan en esta feature.

**Estado actual de los datos (verificado en la base real)**

- `position` **no es único** por playlist y ya hay **9 filas con posición repetida**, todas en las playlists fuente de salas (`colab`, ids 2–6), probablemente por `seedRooms.js` ejecutado dos veces. Hoy `ORDER BY position` tiene orden indeterminado entre empates.
- Reescribir `position` como 0..n-1 al reordenar **normaliza** esos duplicados en cada lista que se reordene. Las listas que nunca se reordenen conservan los duplicados.
- No hay índice sobre `position`. **Decisión:** agregar un índice **no único** `(id_playlist, position)` para el `ORDER BY`, y uno equivalente `(id_user, position)` en `favorite`. No se agrega restricción `UNIQUE`.
- **Orden determinista:** toda lectura ordena con desempate, `ORDER BY position, id_song`, para que los empates existentes (y los que pueda crear otro código) no den resultados distintos entre consultas.
- Mejora futura (fuera de alcance): una restricción `UNIQUE (id_playlist, position)` exigiría que fuera `DEFERRABLE INITIALLY DEFERRED`, SQL crudo en la migración (Prisma no declara restricciones diferibles), renumerar antes los duplicados y auditar todo el código que escribe `position`.
- Los demás índices ausentes (`id_song`, `id_creator`, `id_user` de miembros) son deuda ajena a esta feature y no se tocan aquí.

Reglas:

- Toda llamada a red pasa por `services/`.
- El debounce y demás valores van como constantes en un único archivo de configuración.
- Al salir de la pestaña: `visibilitychange` (web) y `appStateChange` de `@capacitor/app` (APK).

---

## 09. Seguridad y privacidad

- Requerir autenticación en el endpoint.
- Verificar el permiso antes de escribir:
  - **Playlist propia:** solo su dueño.
  - **Playlist colaborativa:** el dueño y **todos los colaboradores**.
  - **Favoritos / Mi Colección:** solo el usuario autenticado, sobre su propia lista.
- Validar en el servidor que los ids pertenecen a la lista.

---

## 10. Manejo de errores

| Caso                                                   | Comportamiento                                                                                        |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| Entrada inválida (ids repetidos o formato incorrecto) | `400`; el frontend revierte y avisa                                                                 |
| Alguien agregó o quitó canciones mientras tanto      | No es error: el backend fusiona, responde `200` con `merged: true` y el frontend recarga la lista |
| Sin permiso                                            | `403`; el frontend revierte y avisa                                                                 |
| Error de red o del servidor                            | El frontend revierte al último orden guardado y avisa                                                |

Todo error mostrado al usuario debe decir qué pasó y qué puede hacer a continuación.

---

## 11. Criterios de aceptación

- [ ] Al soltar una canción, el nuevo orden se ve al instante.
- [ ] Varios movimientos seguidos generan una sola petición.
- [ ] Tras recargar la página o abrir otro dispositivo, el orden se mantiene.
- [ ] Si el request falla, la lista vuelve al orden anterior y se avisa.
- [ ] Cerrar la pestaña o enviar la app a segundo plano no pierde el último movimiento.
- [ ] Funciona con mouse (desktop) y toque (mobile).
- [ ] El servidor rechaza ids repetidos o con formato inválido, y las peticiones de quien no tiene permiso.
- [ ] Si otro colaborador agregó una canción mientras tanto, esa canción queda al final (al principio en Favoritos) y el reordenamiento no se rechaza.
- [ ] Si otro colaborador quitó una canción mientras tanto, el reordenamiento se aplica sin ella.
- [ ] Tras reordenar Favoritos / Mi Colección, el orden se mantiene al recargar, porque todas las lecturas de favoritos ordenan por `position`.
- [ ] Una canción recién marcada como favorita aparece al principio de Favoritos / Mi Colección y no altera el orden relativo de las demás.
- [ ] La migración de `favorite.position` conserva todas las filas y las deja con posiciones sin repetir por usuario.
- [ ] Reordenar la playlist fuente de una sala no altera la reproducción ni la cola de esa sala (la sala congela su propio orden en memoria, ver 08).
- [ ] Las lecturas ordenan por `position, id_song`: una lista con posiciones repetidas se muestra siempre en el mismo orden.
- [ ] Dos reordenamientos simultáneos se aplican de forma secuencial, sin dejar `position` duplicados. En Favoritos, los huecos y los valores negativos son válidos.
- [ ] `lint` y `build` de `frontend` en verde.

---

## 12. Métricas

Solo uso básico en esta versión:

- Cantidad de reordenamientos guardados con éxito **por usuario**.
- Cantidad de reordenamientos guardados con éxito **por tipo de lista** (`personal`, `colab`, `favorites`).

No se miden errores ni conflictos de fusión (`merged`) en esta versión. Al registrar, guardar solo el id de usuario, el tipo de lista y la fecha, nunca el contenido de la lista.

> **Pendiente:** definir dónde se registran, porque `AGENTS.md` no documenta una herramienta de analítica. Propuesto: contar en el backend al responder `200` en cada endpoint de orden.

> **Resuelto (2026-10-27):** no hay analítica ni logger estructurado en el repo, así que se registra en
> el backend, en la tabla `reorder_event` (`id_user`, `list_type`, `created_at`), en una migración
> separada de la de `favorite.position`. El evento se inserta **solo después** de que el endpoint de
> orden responde `200`; si la inserción falla se loguea y la respuesta no cambia. La FK a `user` es
> `ON DELETE CASCADE`.

---

## 13. Fuera de alcance (en esta versión)

- Reordenar la cola de reproducción o la cola de una sala
- Reordenar varias canciones a la vez (selección múltiple)
- Unificar favoritos con `playlist_song` (se mantiene la tabla `favorite` como fuente de verdad)
- Limpiar las filas obsoletas de `playlist_song` en playlists de tipo `favorites`
- Restricción `UNIQUE` sobre `(id_playlist, position)` (ver nota en 08)
- Edición simultánea en tiempo real (ver cambios de otros colaboradores sin recargar)

---

## 14. Preguntas abiertas y verificaciones pendientes

No quedan decisiones de diseño abiertas. Verificaciones hechas antes de implementar (2026-10-27):

- **Límite del body JSON:** `express.json()` no define `limit` (`Backend/src/app.js`), así que rige el
  default de Express: **100 KB**. No se cambia. Una lista enorme puede superarlo y hoy el handler lo
  convierte en `500` en vez de `413`; es deuda adyacente, no bloqueante.
- **Favoritos:** la tabla `favorite` es la fuente de verdad y no tiene `position` todavía; se agrega en
  esta feature. Las llamadas de favoritos viven en `shared/src/services/playlistsService.js`, junto a
  las de playlists, así que el hook y los métodos nuevos van ahí.
- **Salas:** hoy **sí** leen la playlist fuente en vivo, tanto el detalle (`ROOM_INCLUDE`) como
  `next`/skip (`getPlaylistSongsOfRoom`). Por eso esta feature congela **solo el orden**, no la cola:
  las altas siguen entrando (al final) y las bajas se omiten.
- **Contrato:** documentado en `docs/ESPECIFICACIONES-BACKEND.md` §8 (favoritos) y §9.2 (playlists),
  incluido el retiro incompatible de `reorder` de `PUT /api/playlists/:id`.
- **Métricas:** se registran en el backend al responder `200` cada endpoint de orden, en la tabla
  `reorder_event` (usuario, tipo de lista y fecha; nunca el contenido de la lista).
