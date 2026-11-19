# Plan de acción: reemplazar `withRoomMock` por datos reales en `RoomCard`

## 0. Reglas de trabajo (obligatorias)

### Git
- **No crear commits, ramas ni hacer push** en ningún momento del plan. Solo al final, **después de la autorización explícita del responsable**.
- Todo el trabajo queda en el **working tree local de dev**: archivos nuevos **sin trackear** y archivos existentes **modificados sin stagear**.
- Prohibido durante el plan: `git add` (incluidos `git add .` y `git add -A`), `git commit`, `git branch`, `git checkout -b`, `git switch -c`, `git push`, `git stash`, `git reset`, `git clean`, `git checkout -- <archivo>`.
- Comandos permitidos: solo lectura (`git status`, `git diff`, `git log`).
- Al terminar cada fase, el agente entrega un resumen de archivos creados/modificados (`git status`) y **espera confirmación** antes de seguir con la siguiente.
- Al final del plan, el agente presenta el resumen total y **pide autorización** para crear rama, commits y PR. Hasta recibirla, no hace nada de eso.

### Convenciones del repo
- Nada de `fetch` en componentes: toda llamada a red va en `shared/src/services/`, con nombres `verbo + Recurso` (`docs/agents/convenciones-nombres-api.md`).
- `shared/` no importa de `frontend/` ni de `mobile/`, sin DOM, sin CSS, sin router.
- No crear variantes ad-hoc de tarjetas: se reutiliza `RoomCard`.
- Verificación mínima al cerrar: `npm run lint -w frontend`, `npm run build -w frontend`, `npm run lint -w shared` y `npm run check:icons -w shared`.
- **Tests**: esta entrega no incluye tests automatizados; la validación fue manual y con las comprobaciones de lint/build/iconos.

---

## 1. Objetivo

Que `GET /api/rooms` devuelva datos reales de `genres`, `members`, `hostAvatarUrl` e `isLive`, y eliminar el mock temporal.

El mock vive en `shared/src/features/rooms/roomMock.js` (exporta `withRoomMock`). La descripción del PR original lo ubicaba en `Frontend/src/lib/roomMock.js`: **el agente debe localizar con `grep -rn "withRoomMock\|roomMock"` todas las referencias reales** (el PR indica una llamada en `RoomCard.jsx`, y el comentario del propio mock dice "en el modelo"; pueden ser varias) y no asumir rutas.

### Contrato objetivo (ítem del listado de salas)

```json
{
  "id": "...",
  "membersCount": 4,
  "hostAvatarUrl": "https://...",
  "members": [{ "id": "...", "username": "...", "avatarUrl": "..." }],
  "genres": ["Rock", "Pop", "Jazz"],
  "isLive": true
}
```

- `members`: solo invitados **presentes en vivo**, **sin la anfitriona**, máximo 9, ordenados por antigüedad de ingreso a la sala.
- `genres`: máximo 3 strings, puede ser `[]`.
- `isLive`: siempre booleano, nunca `undefined`.
- `hostAvatarUrl`: string o `null`/ausente (la tarjeta usa el avatar de respaldo).
- Si el backend ya envía un campo, el frontend lo respeta (comportamiento actual del mock, que desaparece).

---

## 2. Decisiones tomadas

| # | Decisión |
|---|---|
| 1 | **Miembros por presencia en vivo.** Las salas son persistentes; se añade expulsión por inactividad tras estar OFFLINE un tiempo. |
| 2 | **Géneros desde la cola actual de la sala**; si está vacía, desde la playlist asociada. |
| 3 | **Umbral de reproducción: fuera de alcance.** No se crea `PlayHistory` ni estadísticas por usuario. Valor por defecto futuro: 30 s o 50 % de la canción, lo que ocurra primero. |
| 4 | **Géneros públicos, solo visibles en tarjetas de sala.** La lógica debe ser reutilizable (perfil de usuario queda fuera de alcance). |
| 5 | **Tiempo real incluido en versión mínima**: canal lobby + evento `room:card-updated` con debounce. Alternativa válida si el tiempo aprieta: polling del listado cada 20–30 s. |

### Reglas de presencia y expulsión

- **Presente** = el usuario tiene al menos un socket conectado a la sala. Se **deduplica por `userId`** (dos pestañas cuentan una vez).
- **Gracia de reconexión**: al desconectarse el último socket de un usuario, se espera **60 s** antes de sacarlo de la presencia.
- **Anfitriona desconectada**: la sala pasa a pausada (`isLive = false`) tras **2 min** sin su socket.
- **Expulsión por inactividad**: si la sala lleva `isLive = false` más de **N minutos (por defecto 30)**, un job revisa y expulsa a los miembros **no conectados**. Los conectados se quedan.
- **La expulsión por inactividad nunca se aplica a la anfitriona**, esté conectada o no y sin importar cuánto tiempo lleve la sala OFF. La consulta del job excluye explícitamente la fila con `role = 'host'`.
- **Si la anfitriona no vuelve, la sala persiste sin expulsarla**: las salas son persistentes por diseño. Solo se van los invitados no presentes.
- **Capacidad ("Llena") y `membersCount`**: se calculan sobre la **membresía persistida** (`/join` y `/leave`), porque protege el cupo. La expulsión limpia esa membresía. La lista de avatares muestra solo a los **presentes**. Pueden diferir temporalmente (alguien unido y desconectado ocupa cupo hasta la expulsión); es intencional y debe documentarse.
- Todos los tiempos (60 s, 2 min, 30 min, intervalo del job, debounce) van como **variables de entorno con valor por defecto**, documentadas en `.env.example`.

### Reglas de géneros

- Fuente: cola actual; si está vacía, playlist asociada.
- Cada canción suma +1 a cada uno de sus géneros. Se toman los 3 con más apariciones; **desempate alfabético** (determinista).
- Se calcula **al cambiar la cola**, se guarda en el estado de la sala y el listado solo lo lee. Si el estado se pierde al reiniciar, se recalcula desde la playlist.
- Sin datos: `[]`. La tarjeta **oculta la línea de géneros**, sin fallback ficticio.
- Idioma de nombres: elegir uno en la base o mapear en el frontend con `mapGenreLabel` (ej. "Electronic" → "Electrónica").

---

## 3. Fases

### Fase 0: verificación (sin escribir código)

El agente **no debe asumir**; debe verificar y reportar:

1. `schema.prisma`: modelo de membresía de sala (`RoomMember` o similar), relación `songGenres`, relación sala ↔ playlist, campo `hostId`, `avatarUrl` en el usuario.
2. Dónde vive la **cola de la sala** (memoria vs. base de datos) y cómo se modifica.
3. Dónde vive el **store en memoria** de estado de sala (`isPlaying`, votos) y cómo lo accede `socketService`.
4. Cómo `rooms.service`/controller arma hoy el listado y `membersCount`.
5. Todas las referencias a `withRoomMock` / `roomMock` (grep) y cómo consume `RoomCard` los campos `genres`, `members`, `isLive`, `hostAvatarUrl`.
6. Cómo `useRoomsList` (en `shared`) carga y mantiene el listado.

**Entregable**: informe corto con hallazgos y cualquier discrepancia con este plan. Esperar confirmación.

### Fase 1: presencia, `members`, `hostAvatarUrl`

- Registro en memoria de sockets por sala: `Map<roomId, Map<userId, Set<socketId>>>`, con dedupe por `userId`.
- Gracia de 60 s antes de retirar a un usuario de la presencia tras su última desconexión; cancelar el temporizador si reconecta.
- Orden por antigüedad de ingreso (guardar `joinedAt` de presencia o usar el de la membresía).
- Listado de salas: construir `members` (presentes, sin `hostId`, `take` 9, `{ id, username, avatarUrl }`) e incluir `hostAvatarUrl` desde el anfitrión.
- Evitar N+1: una sola consulta a la base para los usuarios de todas las salas del listado, cruzada con el registro de presencia en memoria.
- Validar que `membersCount` sea coherente con la membresía persistida.

### Fase 2: `isLive` y expulsión por inactividad

- Exponer `isRoomPlaying(roomId)` en el store en memoria: `true` solo si hay estado con `isPlaying === true` y la anfitriona está conectada o dentro de su gracia.
- Merge de `isLive` en el listado (no se persiste en base). Sala sin estado → `false`.
- Anfitriona desconectada > 2 min → pausar la sala.
- Registrar `offlineSince` por sala al pasar a `isLive = false`; limpiarlo al volver a LIVE.
- Job periódico: salas con `offlineSince` mayor a N minutos → expulsar miembros no conectados (limpiar membresía persistida) y emitir el evento de la Fase 4.
- La consulta del job **excluye explícitamente a la anfitriona** (`role = 'host'`): nunca se la expulsa, esté conectada o no y aunque la sala lleve mucho tiempo OFF. La sala no se cierra; solo se va la membresía de invitados no presentes.
- Casos borde considerados: reinicio del servidor (estado en memoria se pierde → `false`, documentarlo), anfitriona que reconecta dentro de la gracia, miembros conectados que no se expulsan, sala OFF más de N minutos con la anfitriona desconectada → se expulsa a invitados no presentes y la anfitriona conserva su `room_member`.
- Recordatorio: requiere backend Node persistente (no serverless).

### Fase 3: `genres`

- Función **pura y reutilizable** `computeTopGenres(songs, limit = 3)`: recibe canciones con `songGenres`, devuelve `string[]` por frecuencia, desempate alfabético. Ubicarla en un módulo neutro, sin dependencia de sala, Prisma ni sockets, para poder alimentarla luego con el historial de un usuario.
- Servicio de sala: recalcular y guardar `genres` en el estado de la sala **al cambiar la cola**; fallback a la playlist asociada cuando la cola está vacía; recálculo desde la playlist tras reinicio.
- Reutilizar `SONG_INCLUDE`/`songGenres` de `playlist.service.js`.
- `mapGenreLabel` según la decisión de idioma (en `shared/src/utils/` o en la capa de presentación del frontend).
- El listado solo lee el valor ya calculado.

### Fase 4: tiempo real (versión mínima)

- Canal **lobby**: los clientes en `/salas` se suscriben al conectarse y se desuscriben al salir.
- Evento único `room:card-updated { roomId, isLive, membersCount, members, genres }`, emitido al lobby con **debounce de 1–2 s por sala** en el servidor.
- Disparadores: cambio de `isPlaying`, entrada/salida de presencia, join/leave persistido, expulsión por inactividad, cambio de cola.
- `socketService` (en `shared`): funciones para suscribirse/desuscribirse al lobby y escuchar el evento.
- `useRoomsList`: aplicar el evento al listado en memoria (reemplazar solo la sala afectada) y limpiar listeners al desmontar.
- Plan B documentado: polling del listado cada 20–30 s si se decide no hacer el evento en esta iteración.

### Fase 5: limpieza y documentación

- Borrar todas las llamadas e imports de `withRoomMock` y eliminar `shared/src/features/rooms/roomMock.js` (y cualquier export desde `index.js`).
- Verificar que `RoomCard` maneja: `genres = []` (oculta la línea), `members = []`, `hostAvatarUrl` ausente (avatar de respaldo), `isLive` booleano.
- `grep -rn "roomMock\|withRoomMock"` debe dar **cero resultados**.
- Actualizar `docs/ESPECIFICACIONES-BACKEND.md` con el contrato nuevo, ejemplos con curl, el evento `room:card-updated`, las variables de entorno nuevas y las reglas de presencia/expulsión.

---

## 5. Entrega

Sugerencia de PRs **(solo cuando el responsable autorice el uso de git)**:

1. Fases 1 y 2 (presencia, `members`, `hostAvatarUrl`, `isLive`, expulsión).
2. Fase 3 (`genres` y `computeTopGenres`).
3. Fases 4 y 5 (tiempo real, retiro del mock, documentación).

Hasta entonces, todo permanece sin commits en dev local.

## 6. Fuera de alcance

`PlayHistory`, `POST /api/songs/:id/play`, estadísticas de género por usuario, géneros en el perfil y el umbral de reproducción. Queda preparado con `computeTopGenres`.

---

## 7. Decisiones de Fase 0

Decisiones del responsable tras la verificación del código real, con las correcciones
sobre el plan original.

### Correcciones al plan

- **`hostId` no es una columna**: se deriva de `room_member.role = 'host'`. El avatar
  del anfitrión es `User.pictureUrl` y se mapea a `avatarUrl` en `roomsService`.
- **La presencia ya existe** (`Backend/src/realtime/presence.js`, dedupe por `userId`):
  se extiende, no se reescribe. Se mantiene la firma de `roomOnlineUsers` para no romper
  `room:online`.
- **`SONG_INCLUDE` de `playlist.service.js` no sirve para géneros**: usa
  `songGenres: true` (solo ids). Se usa `songGenres: { include: { genre: true } }`.
- **"Al cambiar la cola"** no es un endpoint de sala: `queueOrder` solo reordena. Los
  géneros dependen del conjunto de canciones de `idPlaylistSource`. Se invalida la caché
  en memoria de las salas asociadas al cambiar la playlist (`POST /:id/songs`,
  `DELETE /:id/songs/:songId`) y se recalcula perezosamente en la siguiente lectura, en
  **una sola consulta agregada** (sin N+1).
- **La tarjeta web duplica la lógica** de `getRoomCardModel` (no lo usa). No se unifica:
  queda anotado como deuda técnica.
- **Criterio de grep final**: cero referencias a `roomMock` / `withRoomMock` en `*.js` y
  `*.jsx`, excluyendo `docs/`.

### Decisiones de implementación

| Tema | Decisión |
|---|---|
| Géneros | `mapGenreLabel` en `shared/src/utils/` con diccionario chico y fallback al string original. |
| Expulsión por inactividad | Borra **solo** `room_member`; nunca inserta en `RoomKicked` (si no, el expulsado queda vetado para siempre). |
| Orden de `members` | `room_member.joinDate`; no se inventa un `joinedAt` de presencia. |
| Canal lobby | Suscripción explícita `join-lobby` / `leave-lobby`, solo sockets autenticados. |
| Datos públicos | `members` expone únicamente `{ id, username, avatarUrl }`. Hay middleware de auth opcional y es barato: devolver `members` solo a requests autenticados. Si no existiera, no se crea en esta iteración y queda como riesgo documentado. |
| Job de expulsión | `setInterval` en el proceso, con `unref()`, limpieza al apagar e intervalo por variable de entorno. |
| Tarjeta web | Se quita el mock de `RoomCard.jsx` y de `roomCardModel.js`; la duplicación queda como deuda técnica. |

---

## 8. Decisiones de Fase 2

### `isLive` es estado en memoria, no una columna

`isLive` se deriva de dos fuentes que viven solo en el proceso:

- `realtime/roomState.js`: `playback.status === "playing"`.
- `realtime/presence.js`: la anfitriona tiene al menos un socket (o está dentro de su
  gracia de 60 s).

**Al reiniciar el servidor el estado se pierde**: todas las salas quedan en `false`
hasta que la anfitriona vuelva a dar play con su socket conectado. No hay
reconstrucción desde la base porque el estado de reproducción tampoco se persiste.
Por eso esta funcionalidad **exige un backend Node persistente** (no serverless): si el
proceso se recicla en cada request, `isLive` nunca podría sostenerse.

### Temporizadores

| Variable | Default | Qué hace |
|---|---|---|
| `ROOM_PRESENCE_GRACE_MS` | `60000` | Gracia de reconexión de presencia (Fase 1). |
| `ROOM_HOST_OFFLINE_PAUSE_MS` | `120000` | Sin sockets de la anfitriona → la sala se pausa. Es independiente de la gracia: arranca cuando se va su **último** socket y se cancela si reconecta. |
| `ROOM_INACTIVE_EXPEL_MS` | `1800000` | Tiempo que la sala puede estar OFF antes de expulsar invitados no presentes. |
| `ROOM_INACTIVITY_JOB_INTERVAL_MS` | `60000` | Cada cuánto corre el job de expulsión. |

La pausa por anfitriona ausente reutiliza el mismo cálculo de posición del controller
(`roomState.pausedPatch`: `positionMs + (now - updatedAt)`) y emite el evento
`room:playback` existente a `room:<id>`.

### Expulsión

- El job recorre las salas **no cerradas**, actualiza `offlineSince` (perezoso: si la sala
  no está LIVE y no tiene marca, se asigna `now`) y expulsa a los invitados ausentes
  cuando la marca supera `ROOM_INACTIVE_EXPEL_MS`.
- **La anfitriona nunca se expulsa**: la selección filtra `role = 'host'` antes de
  cualquier borrado. La sala tampoco se cierra.
- La expulsión reutiliza `roomService.leaveRoom(userId, roomId)` para los invitados,
  que es la salida normal (borra solo `room_member`). No inserta en `RoomKicked`: un
  expulsado por inactividad puede volver a entrar con el código.
- Tras expulsar se emite `room:members` a `room:<id>`, igual que el resto de las salidas.

### Gancho de presencia

`presence.onPresenceChange(listener)` notifica `{ roomId, userId, present, reason }` en
cuatro transiciones: entrada (`joined`), reconexión dentro de la gracia (`reconnected`),
último socket desconectado (`disconnected`, el usuario sigue en gracia) y vencimiento de
la gracia (`grace-expired`). `room:online` conserva su comportamiento (solo se emite
cuando cambia el listado visible). El gancho lo consume `realtime/roomLive.js` y queda
disponible para el canal lobby de la Fase 4.

---

## 9. Decisiones de Fase 3

### Fuente y conteo

- **Fuente**: el conjunto de canciones de `Room.idPlaylistSource`. `queueOrder` solo
  reordena en memoria, no cambia el conjunto, así que no participa.
- **Conteo**: +1 por cada género de cada canción. Playlist vacía o canciones sin
  géneros → `genres: []`.
- **Ranking**: top 3 por conteo descendente; desempate **único** por nombre ascendente
  (comparación por code unit, sin depender del locale). Se normalizan espacios internos
  y se descartan nombres vacíos o conteos no positivos.
- **Funciones**: `topGenresFromCounts(counts, limit)` recibe `Map` u objeto
  `nombre → conteo` y rankea; `computeTopGenres(songs, limit)` cuenta y delega.
  Viven en `Backend/src/utils/genres.js`, puras y sin Prisma/sockets/salas.

### Por qué no se importa `shared/` desde el backend

`shared/` es ESM (`"type": "module"`) y su `index.js` exporta JSX y contextos de React;
`Backend/` es CommonJS. Un `require("@synthos/shared")` falla por ESM y un import
dinámico del index arrastraría React. Por eso el ranking puro vive en el backend y el
etiquetado de presentación (`mapGenreLabel` / `mapGenreLabels`) vive en
`shared/src/utils/genreLabels.js`, que es lo que consumen web y mobile.

### Listado y consulta

- `listRooms` y `listMyRooms` agregan `genres` a cada fila con **una sola consulta
  agregada** para las salas sin caché válida:
  `room → playlist_song → song_genre → genre`,
  agrupada por `(room.id, genre.name)`. Nada de N+1.
- El backend devuelve los nombres crudos; `roomsService.toRoom` aplica
  `mapGenreLabels` (traducción, dedupe después de mapear, tope 3). Web y mobile
  reciben el mismo array sin tocar las tarjetas.

### Caché

- `Map<roomId, { playlistId, genres, expiresAt }>` en memoria.
- Se invalida al cambiar las canciones de la playlist asociada:
  `POST /api/playlists/:id/songs` y `DELETE /api/playlists/:id/songs/:songId`.
  La invalidación recorre la caché y borra **todas** las salas alimentadas por esa
  playlist. `PUT /api/playlists/:id/songs/order` **no** invalida (solo reordena).
- TTL de red de seguridad: `ROOM_GENRES_CACHE_TTL_MS` (default `300000` ms), verificado
  en cada lectura.
- La caché **no** se invalida si se borra una canción del catálogo (`song`) o se edita el
  nombre de un género: esos cambios no pasan por los endpoints de la playlist. Se
  corrigen solos cuando vence el TTL.
- `onGenresChanged(listener)` es el gancho que consume `roomCards` en la Fase 4 para
  emitir `room:card-updated` al lobby.

---

## 10. Decisiones de Fase 4

### Lobby

- Canal de Socket.IO `lobby`, con handlers `join-lobby` / `leave-lobby`. El handshake ya
  exige JWT y el handler vuelve a chequear `socket.user.sub` por defensa.
- No se guarda una lista propia de miembros: Socket.IO saca al socket de sus salas en
  `disconnect`, así que no queda estado huérfano. Al reconectar, el cliente re-emite
  `join-lobby` igual que los `join-room` pendientes.

### Evento y debounce

- `room:card-updated { roomId, isLive, membersCount, members, genres }`, solo al lobby.
- Debounce **trailing por sala** (`ROOM_CARD_DEBOUNCE_MS`, default `1500`): cada disparo
  reinicia el timer de esa sala. Una ráfaga termina en un único emit.
- El payload se calcula al emitir, no al disparar, con `getRoomCardById` →
  `enrichRoomRows`, la misma función que arma una fila del listado (`is_live`, `members`
  con presencia y tope 9 sin anfitriona, `genres`, `members_count`). No hay una segunda
  forma de la tarjeta ni consultas por evento.
- Si el payload serializado es igual al último emitido para esa sala, no se emite.

### Salas cerradas o eliminadas

- El listado incluye solo salas `activa` y públicas; una sala cerrada desaparece.
- Decisión: evento propio `room:card-removed { roomId }` al lobby. Se eligió sobre
  agregar un campo al `room:card-updated` para no romper la forma fija del evento y
  porque el cliente solo necesita sacar la tarjeta. Se emite una vez por sala.
- **Criterio de baja**: cuando la sala no aparece en la consulta de la tarjeta, se
  consulta el motivo con una query mínima por id (`is_private`, `status`), sin armar la
  tarjeta completa:
  - **pública y cerrada** → se emite `room:card-removed`, con `removed` como dedupe (una
    sola vez por sala) y borrando `lastPayload` al emitir;
  - **privada o inexistente** → no se emite nada: nunca estuvo en el listado, así que el
    lobby no tiene tarjeta que sacar. Esa era la única fuente de bajas espurias y queda
    descartada, no es deuda.
- No se usa `lastPayload` como marca de visibilidad: solo se llena cuando ya se emitió
  un `room:card-updated`, y una sala pública que se cierra sin cambios previos quedaría
  con la tarjeta colgada en las pantallas abiertas de `/salas`.
- No existe endpoint de borrado de sala: el caso real es el cierre (`status = cerrada`)
  al irse la anfitriona o al cerrarla a mano. El `room:card-removed` cubre ambos.

### Disparadores conectados

| Cambio | Dónde |
|---|---|
| Presencia (entra/sale/vencen gracia) | `presence.onPresenceChange` → `roomCards` |
| Géneros (invalidación por playlist) | `roomGenres.onGenresChanged` → `roomCards` |
| `isLive` (play, pausa, stop, skip, pausa por anfitriona ausente) | `roomLive.onLiveChanged` (se dispara desde `syncOfflineSince`) |
| Join manual | `room.controller.joinRoom` |
| Leave manual (invitado o anfitriona que cierra) | `room.controller.leaveRoom` |
| Expulsión manual | `room.controller.kickMember` |
| Cierre de sala | `room.controller.closeRoom` |
| Expulsión por inactividad (`membersCount`) | `roomInactivityJob` tras borrar invitados |

No conectados (fuera del alcance de esta versión): creación de salas (las salas nuevas
no aparecen en vivo), calificaciones (`room:rating` ya tiene su evento), reordenar la
playlist (no cambia el conjunto de canciones) y borrar/editar canciones o géneros del
catálogo (se corrige por TTL de géneros).

### Cliente

- `socketService`: `joinLobby` / `leaveLobby` (simétricos a `joinRoomChannel`), re-emisión
  de `join-lobby` en `connect`, `subscribeToRoomCards({ onUpdated, onRemoved })` con una
  sola cancelación y `subscribeToSocketConnect` para detectar reconexiones.
- `useRoomsList`: al montar y con socket disponible se une al lobby. `room:card-updated`
  actualiza **solo** la tarjeta existente (ignora ids desconocidos) usando
  `toRoomCardFields`, el mismo mapper de `toRoom`, así que los géneros se traducen una
  sola vez. `room:card-removed` la saca. Al desmontar cancela listeners y sale del lobby.
  Al reconectar vuelve a pedir el listado (puede haber perdido eventos).
- Si no hay sesión/socket, el hook funciona exactamente como antes (solo REST).
- Las salas nuevas no se agregan en vivo: queda como mejora futura (habría que decidir
  si respetan el filtro/orden actual del listado).


