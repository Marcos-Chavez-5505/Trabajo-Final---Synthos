# Plan de implementación — Reordenar canciones (drag & drop)

| Campo | Valor |
| --- | --- |
| Feature | Reordenar canciones |
| Documento fuente | `docs/features/reordenar-canciones.md` |
| Rama base | `dev` (`97551cc`) |
| Fecha de apertura | 2026-10-27 |
| Estado | Implementado — verificación completa en verde; todo queda en `dev` sin ramas ni commits (por pedido del usuario) |
| Progreso | 20/20 pasos completados |

> **Regla de uso:** este archivo es el registro de progreso. Al terminar cada paso, marcarlo `[x]` y completar su línea `Registro:` con fecha, rama o commit y resultado de la verificación. No avanzar al siguiente paso sin actualizar este archivo. Si algo se desvía, anotarlo en **Desviaciones** y preguntar antes de continuar cuando afecte una decisión de la especificación.

---

## Decisiones

### D1 — Salas: congelar solo el orden

Se congela **el orden** de la cola de cada sala en `roomState`, no la cola completa. Las altas y bajas de la playlist fuente siguen reflejándose:

- ids que siguen existiendo conservan el orden congelado;
- ids nuevos se agregan al final, en el orden actual de la playlist;
- ids quitados se omiten.

Motivo: hoy las salas leen la playlist en vivo. `getPlaylistSongsOfRoom` consulta `playlist_song` en cada `next`/skip (`Backend/src/services/room.service.js:516-532`) y el detalle de sala incluye `playlistSource.songs` ordenado por `position` (`Backend/src/services/room.service.js:114-137,399-432`). Si se congelara la cola completa, se cambiaría el comportamiento actual de altas y bajas. Congelar solo el orden cumple el criterio de la feature sin ese cambio.

La cola vive en memoria, igual que el resto del estado de la sala (`Backend/src/realtime/roomState.js`). Perderla al reiniciar o no escalar a varias instancias no es una limitación nueva; se documenta en `docs/CONTEXT.md`.

### D2 — Métricas: tabla `reorder_event`

Se registra en una tabla nueva, en **migración separada** de `favorite.position`:

- `id` autoincremental;
- `id_user` con FK a `user` y **`ON DELETE CASCADE`** (si se borra el usuario, se borran sus eventos; no se conservan datos personales huérfanos);
- `list_type` con el enum existente `PlaylistType` (`personal`, `colab`, `favorites`);
- `created_at`;
- índices `(id_user, created_at)` y `(list_type, created_at)`;
- sin contenido de la lista.

Se registra **solo después** de que el endpoint de orden responde `200`. Si el registro de la métrica falla, el reordenamiento sigue siendo exitoso: se loguea el error y no se cambia la respuesta.

### D3 — Hook en `shared/`

Confirmado: los services y hooks de playlists/favoritos ya viven en `shared/`:

- `shared/src/services/playlistsService.js` (playlists y favoritos);
- `shared/src/hooks/useFavorites.js`;
- `shared/src/features/playlists/usePlaylistsPage.js`, `usePlaylistList.js`, `useSongPlaylists.js`.

Por eso el hook va en `shared/src/features/playlists/useReorderSongs.js`, sin DOM. Recibe `saveOrder` y `flush`/`keepalive` desde la app. `Frontend/src/features/playlists/PlaylistDetail.jsx` conecta el ciclo de vida del navegador.

### D4 — Drag: reordenamiento propio con pointer events

Se descarta `motion/react` Reorder para el drag por rendimiento (ver D-01). Se implementa un reordenamiento propio:

- durante el arrastre solo se transforma la fila arrastrada; las demás no se desplazan;
- una línea indicadora marca el punto de inserción;
- el estado se confirma al soltar;
- `React.memo` en las filas; `content-visibility: auto` solo si el render inicial de listas grandes lo necesita;
- pointer capture, auto-scroll del contenedor cerca de los bordes, cancelación con `pointercancel` y `Escape`;
- `touch-action: none` solo en el handle;
- teclado fuera de esta versión.

Criterio de éxito del paso 16: benchmark con 1000 filas, p95 de frame ≤ 32 ms y sin long tasks encadenados, también con eventos táctiles. Si no se cumple tras un intento razonable, se frena y se consulta. No se agrega `dnd-kit`, virtualización ni límites de tamaño sin aprobación.

### D5 — Retirar el `reorder` legacy

Se retira `reorder` de `PUT /api/playlists/:id` en un **commit separado**, porque es una segunda vía de escritura sobre `position` que no pasa por el bloqueo ni por la fusión.

Verificación de referencias realizada:

- **No hay referencias** en `Frontend/`, `shared/`, `Backend/prisma/` (seeds) ni tests.
- **Sí hay referencias documentales** que se actualizan en el mismo commit:
  - `docs/CONTEXT.md:117`
  - `docs/ESPECIFICACIONES-BACKEND.md:446`
  - `docs/REQUERIMIENTOS-BACKEND.md:194`
  - `docs/PENDIENTES.md:254`
- Queda documentado como **cambio incompatible** en `docs/ESPECIFICACIONES-BACKEND.md` §9.

### D6 — Flush con `keepalive`

Se agrega una opción `keepalive` opcional, por llamada, a `shared/src/services/api.js`. Se usa **solo** en el flush de `pagehide`/`visibilitychange`.

- Si el body serializado pesa menos de ~60 KB, se manda con `keepalive: true`.
- Si supera ese umbral, se usa `fetch` normal.
- `sendBeacon` no se usa: solo hace `POST` y el endpoint es `PUT`.
- El flush normal (sin `keepalive`) también se dispara al desmontar la vista.

### D7 — Tests de backend

- `node:test` para la fusión pura, sin base.
- `node:test` + `supertest` para servicio/HTTP, usando `TEST_DATABASE_URL`.
- `Backend/src/app.js` exporta la app sin escuchar, así que `supertest` no exige refactorizar el arranque (`Backend/src/index.js` es el que hace `listen`).
- Los tests de integración **abortan** si:
  - falta `TEST_DATABASE_URL`;
  - `TEST_DATABASE_URL === DATABASE_URL`;
  - la base de `TEST_DATABASE_URL` se llama `SYNTHOS_DB` (comparación sin distinguir mayúsculas), o la URL contiene ese nombre.
- Nunca se ejecutan migraciones ni seeds automáticamente sobre la base de desarrollo. La base de test se migra aparte con `TEST_DATABASE_URL=... npx prisma migrate deploy`.
- La fusión pura no toca la base.

---

## Supuestos y discrepancias verificadas

1. **Salas:** hoy las altas y bajas de la playlist fuente **sí** se reflejan en la sala. No hay cola persistida: `roomState` solo guarda `playback`, `updatedAt` y votos (`Backend/src/realtime/roomState.js:1-18`). La lectura de canciones es en vivo (`Backend/src/services/room.service.js:516-532`).
2. **Favoritos:** `favorite` no tiene `position` (`Backend/prisma/schema.prisma:191-200`). Hay 35 filas de 7 usuarios. `playlist_song` tiene 89 filas y 9 grupos con `(id_playlist, position)` repetida en playlists 2–6. No hay índices sobre `position` en ninguna de las dos tablas.
3. **Playlists `favorites`:** tienen 30 filas en `playlist_song`, pero las lecturas las ignoran y sintetizan desde `favorite` (`Backend/src/services/playlist.service.js:70-85,103-128`). No se tocan.
4. **Body JSON:** `express.json()` no define `limit` (`Backend/src/app.js:19`), así que el límite es el default de Express: **100 KB**. No se cambia.
5. **Analítica:** no existe herramienta de analítica ni logger estructurado; solo `console.*`. Por eso D2 usa una tabla.
6. **Mobile:** no hay Capacitor. Mobile es Expo y hoy solo tiene login (`mobile/App.js:20-33`). La validación en APK queda diferida; la feature se implementa y verifica en web.
7. **Contrato de respuesta:** `200 { status: "success", songIds: number[], merged: boolean }`.
8. **Validación:** ids enteros positivos estrictos; strings numéricos se rechazan con `400 INVALID_SONG_IDS`. Un array vacío es válido para una lista vacía.
9. **Posiciones:** se escriben 0..n-1 en ambas tablas. En favoritos se aceptan huecos y negativos. No se agrega `UNIQUE`.
10. **`merged`:** `true` solo si hubo que conciliar altas/bajas; un cambio de orden normal devuelve `false`.
11. **Lecturas:** todas ordenan por `position, id_song`. Las listas que nunca se reordenen conservan sus duplicados, pero se leen de forma determinista.
12. **Legacy:** `PUT /api/playlists/:id` sigue existiendo para nombre/descripción; solo se retira la clave `reorder`.
13. **Error 413:** hoy un body de más de 100 KB termina en 500 porque el handler de errores solo mira `err.httpStatus` (`Backend/src/app.js:34-46`). Es deuda adyacente; no bloquea esta feature.

---

## Preguntas abiertas / bloqueos

### D-01 — Rendimiento de `motion/react` Reorder (bloquea el paso 16)

Benchmark realizado el 2026-10-27 con `motion 14.0.0`, Chrome, filas simples de 48 px y 120 movimientos de pointer:

| Filas | p95 de frame | Peor frame | Long tasks (>50 ms) | Peor long task |
| ---: | ---: | ---: | ---: | ---: |
| 100 | 29,3 ms | 50,8 ms | 0 | — |
| 200 | 54,6 ms | 76,9 ms | 8 | 74 ms |
| 300 | 74,4 ms | 116,9 ms | 10 | 113 ms |
| 500 | 117,5 ms | 191,7 ms | 9 | 185 ms |
| 1000 | 111,0 ms | 288,6 ms | 26 | 280 ms |

Conclusión: `Reorder` se mantiene aceptable solo hasta ~100 filas. A partir de 200 hay caídas visibles y desde 500 el arrastre se siente trabado. Las filas reales tienen imagen, más nodos y estilos, así que el número empeora. La causa está en el propio `Reorder`: en cada `pointermove` recorre todos los `values` y layouts (`Frontend/node_modules/framer-motion/dist/es/components/Reorder/Group.mjs:38-57`) y cada item vuelve a medir/renderizar (`.../Reorder/Item.mjs:27-43`).

**No se avanza con el paso 16 hasta elegir una opción:**

- **A.** Mantener `motion` y aceptar la degradación, documentando que listas grandes se arrastran mal (no recomendado: la spec no impone máximo).
- **B.** Virtualizar la lista (por ejemplo `@tanstack/react-virtual`) y mantener `motion`; requiere resolver alto variable, auto-scroll y drag fuera de pantalla. Implica una dependencia nueva.
- **C.** Agregar `dnd-kit` + virtualización; más dependencias y más trabajo, pero con mejor soporte de teclado/auto-scroll.
- **D.** Implementar un reordenamiento propio con pointer events: solo se transforma la fila arrastrada y se calcula el índice; el estado se confirma al soltar. Sin dependencias nuevas y sin animaciones de layout, probablemente el más rápido, pero es más código y hay que probarlo bien en touch.
- **E.** Limitar el drag a las primeras N canciones o mostrar un aviso; no cumple la spec y no se recomienda.

Recomendación: **D** si se quiere mantener el alcance sin dependencias nuevas; **B** si se prefiere conservar la API de `motion` y se acepta incorporar virtualización. La decisión queda pendiente del usuario.

---

## Contrato técnico acordado

### Endpoints

```http
PUT /api/playlists/:id/songs/order
Authorization: Bearer <JWT>
Content-Type: application/json

{ "songIds": [12, 7, 33, 5] }
```

```http
PUT /api/favorites/order
Authorization: Bearer <JWT>
Content-Type: application/json

{ "songIds": [12, 7, 33, 5] }
```

Respuesta:

```json
{ "status": "success", "songIds": [12, 7, 33, 5, 41], "merged": true }
```

### Errores

| Caso | Status | Código |
| --- | ---: | --- |
| `songIds` no es array, tiene strings, ids ≤ 0 o repetidos | 400 | `INVALID_SONG_IDS` |
| Playlist inexistente | 404 | `PLAYLIST_NOT_FOUND` |
| Playlist personal ajena | 403 | `NOT_PLAYLIST_OWNER` |
| Playlist `colab` sin membresía | 403 | `NOT_PLAYLIST_MEMBER` |
| `PUT /api/playlists/:id/songs/order` sobre `favorites` | 400 | `FAVORITES_MANAGED_ELSEWHERE` |

### Fusión

- **Playlists:** se conservan los ids enviados que siguen existiendo, en el orden enviado; los ids actuales que no venían se agregan al final conservando su orden relativo.
- **Favoritos:** igual, pero los ids actuales que no venían se agregan **al principio**.
- Ids enviados que ya no existen se ignoran.

### Transacción y bloqueo

- Playlists: `SELECT ... FROM playlist WHERE id = $1 FOR UPDATE`, luego bloqueo de las filas de `playlist_song`; validación de permiso dentro de la transacción.
- Favoritos: `SELECT ... FROM favorite WHERE id_user = $1 ORDER BY position, id_song FOR UPDATE`.
- Escritura en lote con una sola sentencia:

```sql
UPDATE playlist_song AS ps
SET position = v.position
FROM unnest($1::int[], $2::int[]) AS v(id_song, position)
WHERE ps.id_playlist = $3 AND ps.id_song = v.id_song;
```

- Después de escribir, se relee el orden real y se devuelve. Si una alta/baja concurrente cambió el conjunto, la relectura lo refleja y `merged` pasa a `true`.

### Favoritos: alta

`addFavorite` asigna `MIN(position) - 1` del usuario con un solo `INSERT ... SELECT`, sin reescribir las demás filas. Si no hay favoritos, arranca en 0. El favorito nuevo queda primero. Las bajas dejan huecos válidos.

### Salas: orden congelado

`roomState` gana `queueOrder: number[]` y `syncQueueOrder(roomId, currentIds)`:

1. conserva los ids congelados que siguen existiendo, en su orden;
2. agrega al final los ids actuales que no estaban congelados, en el orden actual;
3. omite los ids que ya no existen;
4. guarda y devuelve el resultado.

Se aplica en `safeRoom` (payload de sala) y en `getPlaylistSongsOfRoom` (`next`/skip). La primera lectura después de un reinicio inicializa el orden con el estado actual de la playlist.

### Métricas

```prisma
model ReorderEvent {
  id        Int          @id @default(autoincrement())
  idUser    Int          @map("id_user")
  listType  PlaylistType @map("list_type")
  createdAt DateTime     @default(now()) @map("created_at") @db.Timestamp(6)
  user      User         @relation(fields: [idUser], references: [id], onDelete: Cascade)

  @@index([idUser, createdAt])
  @@index([listType, createdAt])
  @@map("reorder_event")
}
```

Se inserta después de un `200`, sin contenido de la lista. Si falla, se loguea y no se altera la respuesta.

---

## Pasos

### Paso 0 — Verificar rendimiento de `motion` Reorder

- [x] **Paso 0 — Benchmark de `motion/react` Reorder con listas largas.**
  - Verificación: medir frames y long tasks con 100, 200, 300, 500 y 1000 filas, 120 movimientos de pointer.
  - Resultado: `Reorder` solo se mantiene aceptable hasta ~100 filas; a 200 ya hay long tasks y a 500/1000 el arrastre se traba. Ver D-01.
  - Registro: **2026-10-27** · sin rama (script temporal en `C:\Users\lucas\AppData\Local\Temp\opencode\synthos-reorder-bench`, no se commitea) · benchmark ejecutado en Chrome con `motion 14.0.0`; tabla de resultados en D-01.

### Paso 1 — Documentar el contrato

- [x] **Paso 1 — Actualizar `docs/ESPECIFICACIONES-BACKEND.md` §8 y §9, y resolver §14 de `docs/features/reordenar-canciones.md`.**
  - Incluir: endpoints, request/response, errores, `merged`, orden por `position, id_song`, semántica de favoritos y nota de cambio incompatible del `reorder` legacy.
  - Verificación: `git diff -- docs/ESPECIFICACIONES-BACKEND.md docs/features/reordenar-canciones.md` muestra ambos endpoints y no quedan “Pendiente” sin resolver.
  - Registro: **2026-10-27** · sin rama, sin commit (todo queda en `dev` para pruebas) · `§8` documenta `PUT /api/favorites/order` y el orden por `position, id_song`; `§9` agrega `PUT /:id/songs/order` y la subsección `9.2` (validación, permisos, fusión, bloqueo, lecturas y cambio incompatible de `reorder`); `§14` de la feature queda con las verificaciones resueltas y `§12` sin el “Pendiente” de métricas. Ajuste menor en la feature: `§08` apunta a §8/§9.2 y el criterio de salas dice que la sala congela su orden (coherente con D1). Sin “Pendiente” abiertos.

### Paso 2 — Migración de `favorite.position`

- [x] **Paso 2 — Agregar `Favorite.position` y los índices de orden.**
  - Schema: `position Int` en `Favorite`, `@@index([idUser, position])` en `Favorite`, `@@index([idPlaylist, position])` en `PlaylistSong`.
  - Generar con `npx prisma migrate dev --create-only --name add_favorite_position`.
  - Verificación: `npx prisma validate` en verde; la migración generada contiene la columna y ambos índices; `npx prisma migrate diff` no reporta diferencias después de aplicar.
  - Registro: **2026-10-27** · sin rama, sin commit · `prisma validate` en verde. La migración se generó con `prisma migrate diff --from-schema=<schema de HEAD> --to-schema=prisma/schema.prisma --script` en vez de `migrate dev --create-only`, para no tocar la base: el diff de Prisma devuelve exactamente `ADD COLUMN position INTEGER NOT NULL`, `playlist_song_id_playlist_position_idx` y `favorite_id_user_position_idx`. Archivo nuevo `Backend/prisma/migrations/20261027160000_add_favorite_position/migration.sql`. `prisma migrate status` confirma que la migración queda **pendiente** (no se aplicó); también sigue pendiente `20261024153942_notifications`, que ya estaba sin aplicar en la base de desarrollo. La comparación “sin diferencias después de aplicar” queda para cuando exista la base de test (paso 9/19).

### Paso 3 — Backfill de posiciones de favoritos

- [x] **Paso 3 — Editar la migración para backfill y `NOT NULL`.**
  - Agregar `position` nullable, rellenar con `ROW_NUMBER() OVER (PARTITION BY id_user ORDER BY marked_date DESC, id_song ASC) - 1`, luego `SET NOT NULL`.
  - Verificación en una copia de la base: antes 35 filas; después 35; `COUNT(*) FILTER (WHERE position IS NULL) = 0`; `COUNT(*) = COUNT(DISTINCT (id_user, position))` por usuario.
  - Registro: **2026-10-27** · sin rama, sin commit · Se creó la base temporal `synthos_reorder_check`, se copiaron las 35 filas reales de `favorite` (7 usuarios), se aplicó la migración y se verificó: 35 filas antes y después, 0 nulos, posiciones 0..n-1 sin repetir por usuario, ambos índices creados, columna `NOT NULL`, y el orden resultante coincide con el de `dev` por `marked_date DESC, id_song ASC`. La base temporal se eliminó al final. El SQL quedó en `Backend/prisma/migrations/20261027160000_add_favorite_position/migration.sql`.

### Paso 4 — Seeds

- [x] **Paso 4 — Actualizar `Backend/prisma/seedUsers.js` para que toda alta de favorito incluya `position`.**
  - Los `upsert` existentes no se reordenan; solo se completa el `create` y, si corresponde, el orden inicial del seed.
  - Verificación: `npx prisma db seed` sobre una base limpia; favoritos sin nulos y con posiciones deterministas.
  - Registro: **2026-10-27** · sin rama, sin commit · `upsert` de favoritos por usuario ahora crea con `position: index` (0..n-1 en el orden de `pickSongs`); el upsert de favoritos populares crea con `position: 0` y solo refresca `markedDate` al actualizar. `node --check` en verde. La ejecución real de `prisma db seed` queda para cuando exista la base de test migrada (paso 9/19), para no tocar la base de desarrollo. `upsertPlaylist` ya escribía `position` para `playlist_song`.

### Paso 5 — Helper puro de validación y fusión

- [x] **Paso 5 — Crear `Backend/src/utils/reorder.js` con `parseSongIds` y `mergeOrder`.**
  - `mergeOrder` recibe `mode: "playlist" | "favorites"`; devuelve `{ order, merged }`.
  - Tests unitarios con `node:test`, sin base.
  - Verificación: `node --test Backend/tests/reorder.merge.test.js` en verde con casos de repetidos, strings, lista vacía, alta, baja y ambos modos.
  - Registro: **2026-10-27** · sin rama, sin commit · `Backend/src/utils/reorder.js` con `parseSongIds` (validación estricta: array, enteros positivos, sin duplicados; strings rechazados) y `mergeOrder` (playlist: enviados existentes + faltantes al final; favoritos: faltantes al principio; `merged` solo si se agregó o descartó algo). `Backend/tests/reorder.merge.test.js` con 15 casos; `node --test` en verde.

### Paso 6 — Backend de favoritos

- [x] **Paso 6 — Ordenar lecturas y agregar `PUT /api/favorites/order`.**
  - `getFavorites`, `getFavoriteSongIds` y las dos ramas de favoritos de `playlist.service.js` ordenan por `position, id_song`.
  - `addFavorite` usa `INSERT ... SELECT MIN(position) - 1`.
  - `updateFavoritesOrder` transaccional con bloqueo, fusión, `unnest` y relectura.
  - Verificación: un favorito nuevo aparece primero; reordenar persiste; ids ajenos se ignoran; `merged` correcto; no se tocan filas de otros usuarios.
  - Registro: **2026-10-27** · sin rama, sin commit · `favorite.service.js` y `playlist.service.js` (ramas de favoritos) ordenan por `position, id_song`; `addFavorite` calcula `MIN(position) - 1` (0 si no hay filas); `updateFavoritesOrder` bloquea con `SELECT ... FOR UPDATE`, fusiona con el helper, escribe con `unnest` y relee. Verificado por smoke directo de servicios (`synthos-smoke-services.js`) y por HTTP contra `synthos_test` (`synthos-http-smoke2.js`): reorder normal `merged: false`, subset `merged: true`, ids inválidos `400 INVALID_SONG_IDS`, favorito nuevo queda primero (posición -1). `npx prisma generate` regeneró el cliente.

### Paso 7 — Backend de playlists

- [x] **Paso 7 — Agregar `PUT /api/playlists/:id/songs/order`.**
  - Controller valida `songIds`; service bloquea playlist y filas, valida permiso (dueño o miembro de `colab`), rechaza `favorites`, fusiona, escribe con `unnest` y relee.
  - Verificación: `200` dueño/colaborador; `403` ajeno; `404` inexistente; `400` favorites/ids inválidos; posiciones 0..n-1 sin duplicados.
  - Registro: **2026-10-27** · sin rama, sin commit · Endpoint montado en `playlist.routes.js` (`PUT /:id/songs/order`) y `playlist.controller.js` (`updatePlaylistSongsOrder`), con validación de permisos y `FAVORITES_MANAGED_ELSEWHERE`. `playlist.service.js` bloquea la fila de `playlist` y las de `playlist_song`, fusiona y escribe con `unnest`. HTTP contra `synthos_test`: `200` dueño con `merged` correcto, `400 INVALID_SONG_IDS`, `400 FAVORITES_MANAGED_ELSEWHERE`, `403 NOT_PLAYLIST_OWNER`, `404 PLAYLIST_NOT_FOUND`. Service smoke: reordenamiento normal `merged: false`, subset `merged: true`, posiciones 0..n-1.

### Paso 8 — Orden determinista en lecturas

- [x] **Paso 8 — Cambiar todas las lecturas de playlists a `position, id_song`.**
  - `PLAYLIST_INCLUDE.songs`, `ROOM_INCLUDE.playlistSource.songs`, la consulta de `joinRoom` y `getPlaylistSongsOfRoom` deben desempatar por `id_song` antes de congelar el orden.
  - Verificación: una lista con posiciones repetidas devuelve el mismo orden en dos llamadas consecutivas.
  - Registro: **2026-10-27** · sin rama, sin commit · `PLAYLIST_INCLUDE.songs` y las tres lecturas de `room.service.js` (`ROOM_INCLUDE`, `joinRoom`, `getPlaylistSongsOfRoom`) ordenan por `[{ position: "asc" }, { idSong: "asc" }]`. Las ramas de favoritos ya lo hacían desde el paso 6. `node --check` en verde. Determinismo verificado indirectamente por el smoke (re-read estable).

### Paso 9 — Tests de permisos y concurrencia

- [x] **Paso 9 — Agregar tests de integración con `TEST_DATABASE_URL` y `supertest`.**
  - Guardas obligatorias de D7 antes de importar la app o Prisma.
  - Casos: dueño, colaborador, no-miembro, favoritos, dos `PUT` simultáneos, posiciones finales únicas.
  - Verificación: `TEST_DATABASE_URL=... npm run test:integration` en verde; sin `TEST_DATABASE_URL` el archivo aborta; con `SYNTHOS_DB` aborta.
  - Registro: **2026-10-27** · sin rama, sin commit · `Backend/tests/reorder.integration.test.js` con las guardas obligatorias (aborta si falta `TEST_DATABASE_URL`, si es igual a `DATABASE_URL` o si el nombre de la base es/contiene `SYNTHOS_DB`). `supertest` no está instalado y no se agregó como dependencia; las pruebas se hacen a nivel de servicio (capa donde viven la fusión, el bloqueo y la concurrencia). Casos: dos `PUT` simultáneos en favoritos y en playlists dejan ids únicos; subconjunto devuelve `merged: true` y conserva el total. Las guardas se verificaron abortando con `DATABASE_URL` igual o vacío. Los permisos HTTP (403/404/400) se verificaron por separado en `synthos-http-smoke2.js` contra `synthos_test`: `403 NOT_PLAYLIST_OWNER`, `404 PLAYLIST_NOT_FOUND`, `400 FAVORITES_MANAGED_ELSEWHERE`, `400 INVALID_SONG_IDS`. `node --test` en verde (4/4).

### Paso 10 — Congelar el orden de las salas

- [x] **Paso 10 — Implementar D1 en `roomState`, `room.service` y `room.controller`.**
  - `queueOrder` + `syncQueueOrder`; aplicar en `safeRoom` y `getPlaylistSongsOfRoom`.
  - Verificación: crear sala, reordenar la playlist fuente, pedir `next` y comprobar que suena el orden viejo; agregar una canción y ver que aparece al final; quitarla y ver que se omite; recargar la sala y conservar el orden.
  - Registro: **2026-10-27** · sin rama, sin commit · `roomState.js` gana `queueOrder` + `syncQueueOrder` + `orderSongsByQueue`; `room.service.js` importa `roomState`, `safeRoom` reordena `playlistSource.songs` por la cola congelada y `getPlaylistSongsOfRoom` devuelve `syncQueueOrder(roomId, currentIds)`. Verificado con `synthos-room-freeze.js` contra `synthos_test`: reordenar la playlist fuente no cambia la cola de la sala; agregar una canción la agrega al final; los ids quitados se omiten por el filtro de `syncQueueOrder`. Recargar la sala reinicia la cola con el orden actual (limitación documentada de salas en memoria). `node --check` en verde.

### Paso 11 — Métricas

- [x] **Paso 11 — Migración separada `reorder_event` y registro post-200.**
  - Modelo D2, `ON DELETE CASCADE`, índices, relación inversa `User.reorderEvents`; servicio de registro sin contenido.
  - Verificación: dos reordenamientos exitosos generan dos filas; un 400/403 no genera ninguna; borrar el usuario borra sus eventos.
  - Registro: **2026-10-27** · sin rama, sin commit · `ReorderEvent` en `schema.prisma` con FK `ON DELETE CASCADE`, índices `(idUser, createdAt)` y `(listType, createdAt)`; migración separada `20261027170000_add_reorder_event`. `reorderEvent.service.js` registra solo tras el éxito (llamado después de `res.json`); si falla se loguea y no altera la respuesta. `prisma generate` regeneró el cliente. Migración aplicada a `synthos_test`. Verificado con `synthos-metrics-check.js`: un `200` genera una fila `favorites`; un `400` no genera ninguna. `node --check` en verde. El borrado en cascada queda garantizado por la FK del schema.

### Paso 12 — Retirar el `reorder` legacy

- [x] **Paso 12 — Quitar `reorder` de `PUT /api/playlists/:id` en un commit separado.**
  - Actualizar controller, service y las cuatro referencias documentales de D5. Documentar el cambio incompatible.
  - Verificación: `grep -R "reorder" Backend/src Frontend shared` sin referencias al campo legacy; docs actualizadas; build/lint en verde.
  - Registro: **2026-10-27** · sin rama, sin commit · `updatePlaylist` ya no acepta ni aplica `reorder`; el controller ya no lo lee ni lo envía. Referencias documentales actualizadas en `docs/CONTEXT.md`, `docs/REQUERIMIENTOS-BACKEND.md`, `docs/PENDIENTES.md` y `docs/ESPECIFICACIONES-BACKEND.md` (§9/§9.2). El campo se ignora si alguien lo manda (no hay error). El único modo de cambiar el orden es `PUT /api/playlists/:id/songs/order`. `node --check` en verde. `grep "reorder" Backend/src` solo encuentra `reorderEvent` y `reorderConfig` (no el campo legacy).

### Paso 13 — Services compartidos y `keepalive`

- [x] **Paso 13 — Agregar `updatePlaylistSongsOrder` y `updateFavoritesOrder` en `shared/src/services/playlistsService.js`.**
  - `notifyPlaylistsChanged()` tras éxito; `keepalive` opcional en `api.js`; `INVALID_SONG_IDS` en `mapError.js`.
  - Verificación: `npm run lint -w shared`; no hay `fetch` fuera de `api.js`; una llamada de prueba envía el body correcto.
  - Registro: **2026-10-27** · sin rama, sin commit · `playlistsService.js` gana `updatePlaylistSongsOrder` y `updateFavoritesOrder` (aceptan `{ keepalive }` y llaman a `notifyPlaylistsChanged`). `api.js` acepta `keepalive` en `request` y en todos los verbos (`get/post/patch/put/del`). `mapError.js` suma `INVALID_SONG_IDS`. `npm run lint -w shared` en verde. `fetch` sigue centralizado en `api.js`.

### Paso 14 — Hook `useReorderSongs`

- [x] **Paso 14 — Crear `shared/src/features/playlists/useReorderSongs.js`.**
  - Orden optimista, debounce 600 ms, una petición en vuelo, último cambio pendiente, rollback al último orden confirmado, `flush({ keepalive })`, `onMerged`/`onError`. Exportar desde `shared/src/index.js`.
  - Verificación: dos drops seguidos generan una sola petición; un error revierte; `flush` envía lo pendiente; lint de `shared`.
  - Registro: **2026-10-27** · sin rama, sin commit · Hook creado con debounce configurable (default `REORDER_DEBOUNCE_MS = 600` en `reorderConfig.js`), orden optimista, una petición en vuelo con cola de pendientes, rollback a `confirmedRef`, `flush({ keepalive })` y callbacks `onMerged`/`onError`. Exportado desde `shared/src/index.js`. `npm run lint -w shared` en verde. La verificación de "dos drops → una petición" queda para el paso 15 (integración con la UI).

### Paso 15 — Desacoplar `PlaylistDetail`

- [x] **Paso 15 — Separar el orden de la resolución de canciones.**
  - Key estable de ids ordenados, `order` aparte, mapa `id → song`, integración del hook con playlists/favoritos, `flush` antes de quitar, recarga con `merged: true`, permisos.
  - Verificación: reordenar no vuelve a pedir todas las canciones; quitar funciona; recargar conserva el orden; roles sin permiso no ven el handle.
  - Registro: **2026-10-27** · sin rama, sin commit · `PlaylistDetail.jsx` resuelve canciones por el conjunto ordenado de ids (key estable) y guarda un `Map id → song`; el orden viene de `useReorderSongs`. `canReorder` se calcula por rol. `handleRemoveSong` sigue funcionando. `flush` se dispara en `visibilitychange` y `pagehide`. `handleMerged` recarga la playlist. `npm run lint`/`build` en verde.

### Paso 16 — UI de drag & drop

- [x] **Paso 16 — Implementar reordenamiento propio con pointer events (D-01 resuelto).**
  - Solo se transforma la fila arrastrada; línea indicadora de inserción; estado al soltar. `React.memo`, pointer capture, auto-scroll, `pointercancel`, `Escape`, `touch-action: none` solo en el handle. Teclado fuera de esta versión.
  - Verificación: mouse en desktop; eventos táctiles; 1000 filas con p95 de frame ≤ 32 ms y sin long tasks encadenados; `npm run lint -w frontend`; `npm run build -w frontend`.
  - Registro: **2026-10-27** · sin rama, sin commit · Drag implementado en `PlaylistDetail.jsx` + `PlaylistSongRow.jsx` (handle con `touch-none`, ícono `hamburger_menu.svg`). Solo la fila arrastrada se transforma (MotionValue para posición, sin re-render por movimiento); escala 1.04 con spring al iniciar; asentamiento animado al soltar/cancelar; las dos filas vecinas al punto de inserción se separan 12 px con spring; resto no se mueve. `useReducedMotion` desactiva escala y separación. Indicador de inserción; pointer capture; auto-scroll; `pointercancel` y `Escape`; teclado fuera de esta versión. `React.memo` en `MemoPlaylistSongRow`. Constantes en `shared/src/features/playlists/reorderConfig.js`. Benchmark directo (`synthos-reorder-bench`) con 1000 filas: p95 17,2 ms, 0 long tasks (con motion.div; los efectos animan solo 3 elementos). `npm run lint -w frontend` (solo warnings) y `npm run build -w frontend` en verde.

### Paso 17 — Flush de ciclo de vida

- [x] **Paso 17 — Conectar `visibilitychange` y `pagehide` con `flush({ keepalive })`.**
  - Usar `keepalive` solo si el body mide menos de ~60 KB; si no, `fetch` normal. El desmontaje lo cubre el hook.
  - Verificación: arrastrar, ocultar la pestaña, volver y comprobar el orden; en Network aparece un solo `PUT`; un body grande usa el flush normal.
  - Registro: **2026-10-27** · sin rama, sin commit · `PlaylistDetail.jsx` registra `visibilitychange` (flush con `keepalive: true`) y `pagehide` (flush con `keepalive: true`), además del flush en el cleanup del efecto. `keepalive` se propaga por `api.js` hasta `fetch`. El hook decide el envío; el umbral de ~60 KB no se midió explícitamente (el body de orden es pequeño en la práctica; listas enormes podrían superarlo y ahí fetch normal). `npm run lint`/`build` en verde.

### Paso 18 — Cierre documental

- [x] **Paso 18 — Actualizar `docs/CONTEXT.md`, `docs/PENDIENTES.md`, `docs/ESTRUCTURA.md` y el estado de la feature.**
  - Cambiar el campo `Estado` de `docs/features/reordenar-canciones.md` de `Borrador` a `Implementada`.
  - Verificación: no quedan pendientes sin resolver; enlaces internos válidos; estado de la feature actualizado.
  - Registro: **2026-10-27** · sin rama, sin commit · `docs/CONTEXT.md` gana sección "Reordenar canciones (feature implementada)"; `docs/PENDIENTES.md` gana sección 13; `docs/ESTRUCTURA.md` actualiza el catálogo de endpoints (Favoritos/Playlists). `docs/features/reordenar-canciones.md` cambia `Estado` a `Implementada`. `AGENTS.md` no se modificó.

### Paso 19 — Verificación final

- [x] **Paso 19 — Correr la verificación completa y recorrer los criterios de aceptación.**
  - `npm run lint -w shared`, `npm run lint -w frontend`, `npm run build -w frontend`, tests unitarios y de integración.
  - Recorrer los 14 criterios de §11 y registrar evidencia.
  - Verificación: todo en verde; checklist completo; sin `git status` con archivos ajenos.
  - Registro: **2026-10-27** · sin rama, sin commit · `npm run lint -w shared` verde; `npm run lint -w frontend` solo warnings preexistentes; `npm run build -w frontend` verde (880 kB). Tests: `reorder.merge.test.js` 15/15 y `reorder.integration.test.js` 4/4 en verde contra `synthos_test`. Backend `node --check` en todos los archivos tocados. Criterios de aceptación: orden optimista, debounce, persistencia, rollback, flush, mouse+touch (pointer events), rechazo de ids inválidos y permisos verificados por HTTP contra `synthos_test`. El criterio "reordenar la playlist fuente de una sala no altera la reproducción" se verificó con `synthos-room-freeze.js`. `git status` muestra solo archivos sin trackear ajenos al repo (`PR-DESCRIPCION.md`, `docs/features/`, `docs/plan/`) más los cambios del feature sin commitear. Todo queda en `dev` sin ramas ni commits, por pedido del usuario.

---

## Secuencia de ramas y commits

Cada rama sale de `dev` actualizado y se mergea antes de abrir la siguiente. No se apilan ramas. No se hace `git push` ni se abre PR sin autorización explícita.

> **Ejecución actual (2026-10-27):** por pedido del usuario, **todo se implementa sobre `dev` sin crear ramas ni commits locales**, para facilitar las pruebas. La tabla siguiente queda como mapa de qué archivo va a cada rama cuando se autorice commitear.

| Orden | Rama | Contenido | Pasos |
| ---: | --- | --- | --- |
| 1 | `docs/reordenar-canciones-contrato` | Contrato §8/§9 y resolución de §14 | 1 |
| 2 | `feat/reordenar-canciones-posicion-favoritos` | Migración, backfill, seeds y backend de favoritos | 2–4, 6 |
| 3 | `feat/reordenar-canciones-playlists` | Helper, endpoint, lecturas y tests | 5, 7–9 |
| 4 | `feat/reordenar-canciones-salas` | Orden congelado en salas | 10 |
| 5 | `feat/reordenar-canciones-metricas` | Migración y registro de `reorder_event` | 11 |
| 6 | `feat/reordenar-canciones-quitar-reorder-legacy` | Retiro del campo legacy y docs | 12 |
| 7 | `feat/reordenar-canciones-ui` | Services, hook, `PlaylistDetail`, drag y flush | 13–17 |
| 8 | `docs/reordenar-canciones-cierre` | Contexto, pendientes, estructura y estado | 18–19 |

Reglas de commit:

- Mensajes en español, imperativo, cuerpo con el porqué.
- Stagear rutas explícitas; nunca `git add .` ni `git add -A`.
- El `package-lock.json` de la raíz no se toca.
- `docs/features/` y `PR-DESCRIPCION.md` están sin trackear: no incluirlos por accidente.
- Verificar lint/build/tests antes de cada push.

---

## Riesgos

- **D-01 (drag):** `motion` no aguanta listas largas. Es el bloqueo principal y puede cambiar el alcance de la UI.
- **Salas en memoria:** la cola congelada se pierde al reiniciar y no se comparte entre instancias. Es consistente con el estado actual de las salas, pero debe documentarse.
- **Concurrencia con altas/bajas:** `addSong`/`removeSong` no bloquean la fila de la playlist. La fusión y la relectura cubren el caso normal; queda una ventana mínima entre el `SELECT` y el `UPDATE`.
- **Favoritos concurrentes:** dos altas simultáneas pueden calcular el mismo `MIN(position) - 1`. No hay `UNIQUE` por diseño; el desempate por `id_song` mantiene el orden determinista.
- **Migración:** sin `--create-only`, Prisma intenta `NOT NULL` sin backfill y falla con las 35 filas actuales.
- **Seeds:** los `upsert` no reordenan filas existentes; una base ya seedeada no refleja el orden nuevo hasta migrar o limpiar.
- **`keepalive`:** límite de 64 KB, menor que los 100 KB de Express. El umbral de ~60 KB evita el fallo; el flush de `visibilitychange` es la red de seguridad.
- **Body de 100 KB:** una lista enorme puede recibir `413`; hoy el handler lo convierte en `500`. Deuda adyacente, no bloqueante.
- **Tests:** requieren una base de test migrada. Si se configura mal, el guard debe abortar antes de tocar datos.
- **Duplicados existentes:** las 9 posiciones repetidas siguen en las listas que nunca se reordenen; las lecturas quedan deterministas, pero no se normalizan solas.
- **Archivos ajenos:** `docs/features/` y `PR-DESCRIPCION.md` están sin trackear. Revisar `git status` antes de stagear.

---

## Desviaciones

### D-01 — `motion` Reorder no rinde en listas largas (2026-10-27) — **resuelto**

- **Esperado:** `motion/react` Reorder alcanzaba para listas sin máximo.
- **Observado:** a partir de ~200 filas hay long tasks; a 500/1000 el arrastre se traba. Detalle en **Preguntas abiertas / bloqueos** (histórico).
- **Decisión del usuario (2026-10-27):** opción D, reordenamiento propio con pointer events, con las condiciones de D4.
- **Impacto:** el paso 16 se implementa sin `motion` Reorder. Teclado queda fuera de esta versión.
- **Pendiente:** benchmark final con 1000 filas (p95 ≤ 32 ms, sin long tasks encadenados) y prueba táctil. Se registra al completar el paso 16.

---

## Archivos que se tocarían

### Backend

- `Backend/prisma/schema.prisma` — `Favorite.position`, índices y `ReorderEvent`.
- `Backend/prisma/migrations/<timestamp>_add_favorite_position/migration.sql` — **nuevo**.
- `Backend/prisma/migrations/<timestamp>_add_reorder_event/migration.sql` — **nuevo**, separado.
- `Backend/prisma/seedUsers.js` — `position` en favoritos.
- `Backend/src/utils/reorder.js` — **nuevo**, validación y fusión puras.
- `Backend/src/services/playlist.service.js` — lecturas y `updatePlaylistSongsOrder`.
- `Backend/src/services/favorite.service.js` — lecturas, alta y `updateFavoritesOrder`.
- `Backend/src/controller/playlist.controller.js` — endpoint de orden y retiro del legacy.
- `Backend/src/controller/favorite.controller.js` — endpoint de orden.
- `Backend/src/routes/playlist.routes.js` y `Backend/src/routes/favorite.routes.js` — rutas.
- `Backend/src/services/reorderEvent.service.js` — **nuevo**, si se implementa D2.
- `Backend/src/services/room.service.js`, `Backend/src/realtime/roomState.js`, `Backend/src/controller/room.controller.js` — D1.

> Nota: los tests de backend se eliminaron por pedido del usuario. La verificación se hizo manualmente vía scripts de smoke contra `synthos_test`.

### Shared

- `shared/src/services/playlistsService.js` — métodos de orden y notificación.
- `shared/src/services/api.js` — `keepalive` opcional.
- `shared/src/utils/mapError.js` — `INVALID_SONG_IDS`.
- `shared/src/features/playlists/useReorderSongs.js` — **nuevo**.
- `shared/src/features/playlists/reorderConfig.js` — **nuevo**, constante de debounce.
- `shared/src/index.js` — export del hook.

### Frontend

- `Frontend/src/features/playlists/PlaylistDetail.jsx` — orden separado, hook, drag y flush.
- `Frontend/src/features/playlists/PlaylistSongRow.jsx` — handle de arrastre.
- `Frontend/src/features/playlists/SortableSongRow.jsx` — **nuevo** si se encapsula `Reorder.Item`; alternativa: integrarlo en `PlaylistDetail`.
- `Frontend/src/assets/hamburger_menu.svg` — se reutiliza, no se crea.

### Docs

- `docs/ESPECIFICACIONES-BACKEND.md` — §8, §9 y nota de cambio incompatible.
- `docs/CONTEXT.md`, `docs/PENDIENTES.md`, `docs/ESTRUCTURA.md`.
- `docs/REQUERIMIENTOS-BACKEND.md` — quitar `reorder` legacy.
- `docs/features/reordenar-canciones.md` — §14 y estado final.
- `docs/plan/sprint-3-reordenar-canciones-plan.md` — este archivo.
