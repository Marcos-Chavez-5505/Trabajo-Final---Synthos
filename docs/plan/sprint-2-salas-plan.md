# Plan de salas de escucha colaborativa (TS-11, TS-14, TS-15, TS-16, TS-17, TS-18)

> Plan derivado del análisis de `docs/plan/sprint-2-plan.md` (TS-11, TS-14, TS-15, TS-16, TS-17 y TS-18) contra
> el código real de `Backend/` y `Frontend/` al 2026-10-16. Cada tarea es autocontenida: no asumas contexto
> fuera de lo declarado acá.
>
> Leer primero `/AGENTS.md` (convenciones). El contrato canónico de cada endpoint queda en
> `docs/plan/sprint-2-plan.md` (B11–B21) y, una vez implementado, en `docs/ESPECIFICACIONES-BACKEND.md` §10.
>
> **Estado de este documento: plan, no ejecución.** Las decisiones D15–D23 están tomadas y anotadas; **nada de
> lo que describe se ejecutó todavía**. Queda pendiente de autorización para arrancar por fases.

---

## 0. Resumen ejecutivo

El bloque de salas es el más caro del proyecto y hoy está en su punto más bajo: el backend tiene **un solo
endpoint** (`GET /api/rooms`, público, sin auth) y el frontend tiene **una sola pantalla** (`/salas`, contra
`mocks/rooms.js`). El esquema, en cambio, ya tiene todo lo necesario salvo dos índices y un `CHECK`.

Lo que hay que hacer, en orden de riesgo creciente:

1. **Listado y búsqueda** contra el endpoint real (cierra el ítem más chico que viene abierto y apaga el
   último mock del repo).
2. **Ciclo de vida de la sala**: crear, unirse con código, salir, ver el detalle.
3. **Sincronización**: WebSocket con Socket.IO, control de reproducción del anfitrión, expulsión y cierre.
4. **Votación de skip** y **calificación del anfitrión** (TS-11).

Todo son endpoints REST salvo la sincronización en vivo, que necesita un servidor Node persistente
(ver **D8′**).

---

## 1. Diagnóstico: qué existe hoy (verificado en el código)

### 1.1 Backend — `room` es el esqueleto más delgado del proyecto

| Realidad | Ubicación |
| --- | --- |
| `room.routes.js` tiene **6 líneas y un solo endpoint** `GET /`, sin ningún middleware de auth | `Backend/src/routes/room.routes.js:1-6` |
| `room.service.js` son **54 líneas**: dos funciones casi idénticas (`listRoomsSortedByName` / `...ByRating`) con `room.*` + `JOIN` a `room_member` + `LEFT JOIN` a la vista `host_avg_rating` | `Backend/src/services/room.service.js:3-54` |
| El controller valida **solo `sort`** y devuelve un **array crudo** (sin envolvente) | `Backend/src/controller/room.controller.js:1-16` |
| **No existe `socket.io`** ni en `package.json` ni en `node_modules`; `index.js` hace `app.listen()` pelado, sin servidor HTTP upgradeable | `Backend/src/index.js:6-8`, `Backend/package.json` |
| El esquema **ya tiene todo**: `Room.code` unique, `passwordHash`, `maxCapacity`, `status: activa\|cerrada`, `expiresAt`, `RoomMember{host,member}`, `HostRating PK [idRoom,idRater,idHost]` | `Backend/prisma/schema.prisma:231-274` |
| `seedRooms.js` crea 5 salas con `maxCapacity` 8–30 y `host_rating` con valores 5/4/3/2 | `Backend/prisma/seedRooms.js:53-104` |
| `validateSortType` acepta `"alphabetical" \| "name" \| "rating"` (`name` y `alphabetical` son sinónimos) | `Backend/src/utils/validation.js:32-48` |

### 1.2 Frontend — el listado existe, todo lo demás no

| Realidad | Ubicación |
| --- | --- |
| `features/rooms/` tiene **1 archivo**: `Rooms.jsx` (181 líneas). El `RoomSortMenu` está definido inline adentro | `Frontend/src/features/rooms/Rooms.jsx` |
| `roomsService.js` expone **solo `listRooms`**, con `USE_MOCK = true`; `toRoom()` ya acepta el shape del SQL crudo | `Frontend/src/services/roomsService.js:17,46-57,113-133` |
| `mocks/rooms.js` tiene 5 salas, **ninguna privada** | `Frontend/src/mocks/rooms.js` |
| Rutas: solo `/salas`. El grupo **"Mis Salas"** del Sidebar está vacío | `AppRoutes.jsx:95`, `Sidebar.jsx:168-170` |
| `mapError.js` no tiene **ningún** código de sala → los 401/403/404/409 caerían al `message` crudo del servidor | `Frontend/src/utils/mapError.js:12-82` |
| `api.js` guarda el token en **variable de módulo sin getter** → el handshake del socket no lo puede leer | `Frontend/src/services/api.js:30,36` |
| El proxy de Vite **no tiene `ws: true`** | `Frontend/vite.config.js` |
| No hay ícono de "salir de sala" ni de "votar/saltar" en `src/assets/` (hay `next_track.svg`, que cubre el skip) | `Frontend/src/assets/` |

### 1.3 Bugs reales que hay que corregir de paso

1. **Fuga de `password_hash`**: `room.service.js:5` y `:24` proyectan `room.*` en un endpoint **público y sin
   auth**, así que hoy `GET /api/rooms` devuelve el hash bcrypt de la contraseña de cada sala privada (y de las
   públicas, que es `null`). Hay que seleccionar columnas explícitas.
2. **No filtra por `status`**: `room.service.js:17` y `:36` filtran solo `is_private = false`, así que las salas
   `cerrada` también aparecen en el listado.
3. **`INNER JOIN` a `room_member` con `role='host'`** (`room.service.js:11-12`, `:30-31`): nada en el esquema
   impide dos anfitriones en la misma sala, y ese JOIN **duplicaría la fila** de la sala. Resolver con un
   subquery escalar.
4. **`avg_rating` es `numeric` de Postgres** y llega como **string**. El propio seed lo castea a mano
   (`seedRooms.js:290`), lo que confirma que el valor crudo no es número.
5. **No hay paginación** en el listado y `room` **no tiene ningún índice** (`schema.prisma:231-248`): sin
   `@@index` en `name`, `is_private` ni `status`.
6. **`src/db/schema.sql:208` tiene `CHECK (rating BETWEEN 1 AND 5)`** que nunca llegó a una migración de Prisma.

---

## 2. Decisiones tomadas

| # | Decisión | Alcance | Estado |
| --- | --- | --- | --- |
| **D8′** | **Socket.IO**, con el backend en un **servidor Node persistente (local)**. El estado de reproducción y los votos viven **en memoria del proceso**, una sola instancia; se pierden al reiniciar. Si alguna vez se despliega fuera (Vercel serverless **no** acepta WebSockets entrantes), hay que migrar a polling o a un servicio externo. | B11 | tomada (2026-10-16) |
| **D15** | Cerrar una sala = **`DELETE /api/rooms/:id`** (anfitrión). Reconcilia `sprint-2-plan.md` B19 contra `REQUERIMIENTOS-BACKEND.md` §7, que quedan desalineados hasta que se actualice el segundo. | B19 | tomada (2026-10-16) |
| **D16** | El anfitrión **puede salir de su sala y eso la cierra**. No hay transferencia de rol. | B14 | tomada (2026-10-16) |
| **D17** | El voto de skip se aprueba con **más de la mitad de los miembros que no son anfitrión** (`required = floor(noHost/2) + 1`). El anfitrión no vota, solo ve el contador. | B20 | tomada (2026-10-16) |
| **D18** | `next` en la última canción **vuelve a la primera** de la playlist fuente. | B17 | tomada (2026-10-16) |
| **D19** | **Cualquier playlist puede ser fuente de sala**: personal o colaborativa. El backend **no valida `type`**, y **cualquier miembro de una colaborativa puede abrir una sala** con esa playlist. Elimina de raíz el efecto secundario que `sprint-2-plan.md` temía en TS-14 (invitar convertía la fuente en inelegible para salas nuevas). | B12, F11 | tomada (2026-10-16) |
| **D20** | La sala **queda con las canciones que tenía**: si la playlist fuente se vacía o cambia, la sala no se invalida ni se cierra. Si la playlist se **borra**, el `onDelete: Restrict` ya existente devuelve `409`. | B15 | tomada (2026-10-16) |
| **D21** | TS-11 entra al bloque, con **botón único tipo like, valor `1`**. | B10, F rateHost | tomada (2026-10-16) |
| **D22** | **"Mis Salas"** en el Sidebar: las salas donde el usuario es miembro, con las que administra marcadas. | endpoint nuevo | tomada (2026-10-16) |
| **D23** | **El seed de salas se normaliza a `rating = 1`.** Consecuencia directa de D21: con la app generando siempre `1`, el promedio de cualquier anfitrión calificado queda en `1.00`, así que **"ordenar por calificación" pasa a ser binario** (calificada antes que no calificada, desempate alfabético). El `seedRooms.js` hoy siembra 5/4/3/2, o sea datos que la app ya no genera y que harían que las salas del seed ganaran siempre; bajarlo a `1` hace que el seed represente lo que la app produce y el orden sea coherente. **Anotada, pendiente de ejecución.** | `prisma/seedRooms.js` | **anotada, NO ejecutada** |
| **D24** | **Los controles de lista quedan a la vista pero inertes dentro de una sala.** Anterior, siguiente, aleatorio y repetición se muestran `disabled` en `PlayerControls` (PlayerBar), `TransportControls`/`ActionControls` (reproductor expandido) y `MiniPlayerBar`; no se esconden, para que la barra no cambie de forma. El bloqueo va en **dos capas**: el `disabled` de la UI y la negación en el origen (`PlayerContext`). `next`/`previous`/`toggleShuffle`/`cycleRepeat` salen sin hacer nada en `roomMode`, así que **sacarles el atributo por devtools no habilita la acción** — solo cambia el aspecto. Del lado del servidor ya estaba cubierto: `POST /rooms/:id/playback` responde `403` a todo el que no sea anfitrión (verificado: `play`, `pause`, `next`, `stop`). | F12, F15 | tomada (2026-10-19) |
| **D25** | **El play/pause local solo puede *arrancar* audio mientras la sala está `playing`.** Pausar siempre se permite (solo silencia a quien lo pulsa); reproducir, no, porque con la sala en `pausa` arrancaría el audio de una sola persona y la dejaría desfasada sin que nada lo corrija (el corrector de deriva solo actúa con el servidor en `playing`). Aplica **igual al anfitrión y a los miembros**: el anfitrión maneja la sala desde los controles de la pantalla de la sala, que sí hablan con la API. Lo empuja `useRoomPlayback` con `setPlayBlocked(playback.status !== 'playing')` y lo consume `togglePlay` (también cubre la barra espaciadora). Cuando el servidor queda en `paused`/`stopped` el hook además pausa el audio local, incluido el caso `songId: null` (detener no tenía cómo callar la canción ya cargada). | F12, F15 | tomada (2026-10-19) |

> **Consecuencia asumida de D23 + D21:** la escala 1–5 se conserva en el esquema (`SmallInt`) y la vista
> `host_avg_rating` sigue calculando `AVG`, pero en la práctica el único valor que produce la app es `1`. El
> criterio "Mejor calificado" de TS-17 pasa a significar "con calificación antes que sin calificación", y eso hay
> que dejarlo escrito en el rótulo o en el tooltip del selector.

### 2.1 La rama huérfana `feat/ts14-crear-sala`

La rama `feat/ts14-crear-sala` (`77fe367`, sin mergear, 835 líneas) tiene TS-14 completo **en la capa mock**:

- `features/rooms/CreateRoom.jsx` (235 líneas) y `features/rooms/RoomView.jsx` (231 líneas) nuevos,
  `createRoom`/`joinRoom`/`getRoomById` contra `localStorage` (`synthos_mock_rooms`), rutas `/salas/crear` y
  `/salas/:id`, y 46 líneas más en `PENDIENTES.md`.
- Rebasa con **conflicto probable** en `Rooms.jsx`, `roomsService.js` y `RoomCard.jsx` (es anterior a PR #65,
  el orden por rating).
- Su `joinRoom` entra **por id**; el contrato real entra **por código**.
- Filtra playlists sin excluir colaborativas ni favoritos (obsoleto bajo **D19**).
- Su `RoomView` es read-only: no sirve para TS-15.

**Decisión: rehacer sobre `dev` y rescatar solo la UI del formulario** (`CreateRoom.jsx`). El `RoomView` de la
rama se descarta porque hay que escribirlo completo para TS-15 de todos modos. La rama puede borrarse cuando
el bloque esté entregado, **con autorización explícita**.

---

## 3. Orden de fases

De menor a mayor riesgo. Primero lo que es SQL puro y ya se puede ver en pantalla con datos reales; lo que
necesita WebSocket va al final, con el CRUD ya probado.

```
Fase 1  listado y búsqueda      →  cierra el último mock del repo
Fase 2  ciclo de vida           →  crear / unirse / salir / detalle
Fase 3  sincronización          →  Socket.IO + control del anfitrión
Fase 4  skip + calificación     →  TS-18 + TS-11
```

**Cada fase se parte en dos ramas: backend y frontend** (regla 12.1 de `AGENTS.md` y el orden "backend
primero, frontend después" del plan de sprint). Total: **8 ramas**, todas saliendo de `dev`.

| Orden | Rama | Contenido | Depende de |
| --- | --- | --- | --- |
| 1 | `feat/salas-listado-backend` | B21 | — |
| 2 | `feat/salas-listado-frontend` | F14 + F8 (apagar `USE_MOCK`) + `mapError` + `RoomCard` | rama 1 |
| 3 | `feat/salas-crud-backend` | B12, B13, B14, B15, `GET /rooms/mine` | rama 1 |
| 4 | `feat/salas-crud-frontend` | F11 + `CreateRoom` + `JoinRoomDialog` + `RoomView` básico + rutas + "Mis Salas" | rama 3 |
| 5 | `feat/salas-realtime-backend` | B11 + B16, B17, B18, B19 | rama 3 |
| 6 | `feat/salas-realtime-frontend` | `socketService` + "modo sala" del `PlayerContext` + `RoomView` completo | rama 5 |
| 7 | `feat/salas-skip-backend` | B20 + B10 (+ **D23**: seed a `rating = 1`) | rama 5 |
| 8 | `feat/salas-skip-frontend` | F13 + `rateHost` + promedio en el perfil del anfitrión | rama 7 |

Además, al cerrar el bloque, una novena rama de documentación: `docs/salas-contrato-al-dia` (§7).

---

## 4. Fase 1 — Listado y búsqueda (B21 + F14 + F8)

Cierra el ítem más chico que viene abierto desde el sprint anterior (**apagar `USE_MOCK`**) y arregla la fuga de
`password_hash`. Resuelve **D7**.

### 4.1 Backend · `feat/salas-listado-backend`

**Reescribir `services/room.service.js` con una sola query parametrizada** en vez de dos casi idénticas:

- **Proyección explícita de columnas**, nunca `room.*`: `id, code, name, description, id_playlist_source,
  is_private, max_capacity, status, creation_date` + `host_id, host_username, avg_rating, members_count`.
  Esto elimina la fuga de `password_hash` y de `expires_at`.
- **Conteo de miembros en un subquery agrupado aparte**, no en el mismo `JOIN`: si no, el `COUNT` se multiplica
  por el fan-out del rating.
- **Anfitrión con subquery escalar** sobre `room_member WHERE role='host'` en vez de `INNER JOIN`, para que una
  sala con dos anfitriones no duplique la fila.
- Filtros: `is_private = false` **AND `status = 'activa'`**, más `ILIKE` sobre `room.name` **OR
  `host_user.username`** cuando viene `query` (vacío devuelve todas).
- `ORDER BY`: `order` validado por whitelist a `ASC`/`DESC` e **interpolado en crudo** (un parámetro no puede ir
  en `ORDER BY`); `query` sí va **parametrizado** con `${query}` del tagged template de Prisma. Nunca interpolar
  texto de usuario sin validar.
- Desempate alfabético siempre al final, también en el orden por rating.
- **Mantener `alphabetical` como alias de `name`** para no romper el contrato vigente; el frontend pasa a `name`.
- **Sin paginación**: el enunciado no la pide.
- `utils/validation.js`: extender `validateSortType` con `order` (`asc`/`desc`, code `INVALID_ORDER`).

**Criterios de aceptación (backend)**

- [ ] Coincide por nombre de sala **y** por `username` del anfitrión; query vacío devuelve todas las públicas
      activas.
- [ ] Privadas y cerradas **nunca** aparecen.
- [ ] La respuesta **no incluye `password_hash`** ni `expires_at`.
- [ ] Trae `host_id`, `host_username`, `avg_rating` y `members_count`.
- [ ] `sort` u `order` inválidos devuelven `400`; sin coincidencias, `200` con lista vacía.
- [ ] El orden del servidor se respeta (el cliente **no** reordena).

### 4.2 Frontend · `feat/salas-listado-frontend`

- **`services/roomsService.js`**: **apagar `USE_MOCK`** y borrar la rama del mock (con ella `mocks/rooms.js`,
  que queda sin importadores, y el store `synthos_mock_rooms`). `searchRooms({ query, sort, order, signal })`
  reemplaza a `listRooms`. **Dejar de re-ordenar en el cliente**: el `sortRooms()` actual duplica el `ORDER BY` del
  servidor. `toRoom` suma `hostId`, `membersCount` y `viewerIsMember`; `avg_rating` se sigue casteando con
  `Number()` (llega como string).
- **`components/cards/RoomCard.jsx`**: agregar slot `action` (mismo patrón que `UserRow` ← `SearchPersonRow` de
  TS-10b), `membersCount/maxCapacity` ("3/10"), y **botón "Unirme"** deshabilitado cuando la sala está llena.
  Unificar el rótulo de rating a **`"Sin calificaciones"`** para `hostRating === null` (hoy dice "Sin
  calificar", y TS-16 pedía "Sin calificaciones").
- **`features/rooms/Rooms.jsx`**: input de búsqueda con `useDebounce`, selector de criterio, botón asc/desc, todo
  en la URL (`?q=&sort=&order=`, con los defaults sin escribir), botón "Crear sala", estado vacío informativo
  ("No encontramos salas con ese criterio"), loading y error propios de llamada real.
- **`utils/mapError.js`**: bloque de salas (`ROOM_NOT_FOUND`, `ROOM_FULL`, `ROOM_PASSWORD_INCORRECT`,
  `ROOM_CLOSED`, `INVALID_ORDER`, `INVALID_SORT`, `ROOM_CODE_INVALID`, `PLAYLIST_EMPTY`, …).
- **`src/assets/`**: agregar el ícono de "salir de sala" al set propio (regla 10). `next_track.svg` cubre el skip.

**Criterios de aceptación (frontend)**

- [ ] La búsqueda y el orden se mantienen al volver a la pantalla (viven en la URL).
- [ ] Sala llena (10/10) tiene "Unirme" deshabilitado.
- [ ] Sin resultados muestra el mensaje informativo.
- [ ] `USE_MOCK` apagado y `mocks/rooms.js` borrado: no queda ningún mock en el repo.

---

## 5. Fase 2 — Ciclo de vida de la sala (B12–B15 + F11 + "Mis Salas")

### 5.1 Backend · `feat/salas-crud-backend`

`routes/room.routes.js` pasa a `router.use(authenticate)`, con `optionalAuthenticate` **solo** en `GET /` (para
que un listado anónimo no se rompa, aunque la app exige sesión en `/salas`).

| Endpoint | Reglas clave |
| --- | --- |
| `POST /api/rooms` | Valida que la playlist exista (404) y que el usuario la haya creado **o sea miembro** (403) — **sin validar `type`** (**D19**). Exige **≥1 canción** (400). `maxCapacity = 10` **fijo en el server** (el cliente no lo manda). `status = 'activa'`. `code` de 6 caracteres alfanuméricos en mayúsculas **sin ambiguos** (`0/O`, `1/I`), reintentando ante `P2002`. `passwordHash` con **`bcryptjs`** (el mismo que ya usa el seed; `bcrypt` puro no hace falta). Transacción: sala + `room_member` con `role='host'`. **Nunca devuelve `passwordHash`.** |
| `POST /api/rooms/join` | Busca por `code` (404). Compara la contraseña con `bcrypt.compare` (403 si falta o es incorrecta). **Valida el cupo dentro de una transacción** para que dos ingresos simultáneos no superen los 10 (409 con mensaje `"Sala llena 10/10"`). `200` si ya era miembro, sin duplicar la fila. `400` si la sala está cerrada. |
| `POST /api/rooms/:id/leave` | Borra la fila del usuario. Si era el anfitrión, **cierra la sala** con la misma lógica de `DELETE /:id` (**D16**). `404` si no era miembro. `204` sin contenido. |
| `GET /api/rooms/:id` | `403` si no es miembro. Trae sala + **miembros** (id, username, `pictureUrl`, rol) + **canciones de la playlist fuente con datos de reproducción en un solo include**, ordenadas por `position` (reutilizar el patrón de `PLAYLIST_INCLUDE` de `playlist.service.js:15-29`). Sin llamadas extra. |
| `GET /api/rooms/mine` | Salas donde el usuario es miembro, para el Sidebar. Mismo shape crudo que `GET /rooms`. |

**Criterios de aceptación (backend)**

- [ ] Crear con playlist propia o de una colaborativa donde es miembro, con canciones → `201` sin `passwordHash`.
- [ ] Playlist ajena (403), inexistente (404), vacía (400) y privada sin contraseña (400) se rechazan.
- [ ] Sala y fila de anfitrión se crean en **una sola transacción**.
- [ ] Dos ingresos simultáneos con un cupo libre **no superan los 10** miembros.
- [ ] Si ya era miembro responde `200` y no se duplica la fila.
- [ ] Contraseña faltante o incorrecta en sala privada devuelve `403`.
- [ ] Un no miembro recibe `403` en `GET /:id`; la respuesta nunca incluye `passwordHash`.
- [ ] Las canciones vienen ordenadas por `position`, con datos de reproducción.

### 5.2 Frontend · `feat/salas-crud-frontend`

- **`features/rooms/CreateRoom.jsx`** — **se rescata la UI de `feat/ts14-crear-sala`** (selector de playlist,
  toggle Pública/Privada, campo de contraseña, estado bloqueado con mensaje claro cuando no hay playlists
  usables) y se le cambia el contrato:
  `createRoom({ name, description, isPrivate, password, playlistId })`, **sin** `songIds` ni `playlistName` (eso
  los pone el server). Con **D19** el filtro del selector se simplifica mucho: `listPlaylists` ya devuelve solo
  las que creaste y las colab donde participás, así que el único filtro real es `songIds.length > 0`
  (excluyendo Favoritos, que es la autogenerada).
- **`features/rooms/JoinRoomDialog.jsx`**: modal "Unirme con código" (el proyecto **no tiene `dialog.tsx`**; el
  patrón es el `Sheet` de Base UI, como en `features/playlists/InviteUserDialog.jsx`). Pide código y, si la sala
  es privada, contraseña.
- **`features/rooms/RoomView.jsx`**: **se escribe de cero** (el de la rama vieja es read-only). En esta fase
  muestra datos de sala, código a compartir (+ contraseña si es privada), lista de miembros, playlist fuente y
  un **reproductor local** (la sincronización llega en la fase 3).
- **Rutas** `/salas/crear` y `/salas/:id` en `routes/AppRoutes.jsx` (protegidas).
- **"Mis Salas"**: `features/rooms/useMyRooms.js` + `RoomSidebarList.jsx`, siguiendo el patrón de
  `usePlaylistList()` + `PlaylistSidebarList` que ya llena "Mis Playlists".
- **Mapeo de canciones**: `roomsService` reutiliza el `toSong()` que `songsService.js:38` ya exporta, para no
  duplicar el mapper.

**Criterios de aceptación (frontend)**

- [ ] Solo se ofrecen playlists con al menos una canción.
- [ ] Cada error (403, 404, 409, 400) muestra un mensaje entendible.
- [ ] Salir de la sala pide confirmación.
- [ ] El creador ve el código para compartirlo, y la contraseña si es privada.
- [ ] Sin ninguna playlist usable, el botón de crear queda deshabilitado con un mensaje y acceso a crear una.

---

## 6. Fase 3 — Sincronización y administración (B11 + B16–B19 + F12)

La fase más delicada. Requiere `socket.io` en el backend, `socket.io-client` en el frontend y una extensión
**mínima** del `PlayerContext`.

### 6.1 Backend · `feat/salas-realtime-backend`

**Dependencias a agregar:** `socket.io` en `package.json`.

- **`src/index.js`**: crear `http.createServer(app)` y `io.attach(httpServer, { cors })`, para que se pueda
  hacer el *upgrade* a WebSocket.
- **`src/realtime/socket.js`** (nuevo): `initSocket(server)` y **`emitToRoom(roomId, event, payload)`** (para que
  los services REST emitan sin conocer `io`) más `getIo()`. Middleware `io.use` que valida
  `socket.handshake.auth.token` con `jwt.verify` reutilizando `JWT_SECRET`. Canal `room:<id>`, con rechazo del
  `join` al canal si el usuario no es miembro (chequeando `room_member`).
- **`src/services/roomPlayback.service.js`** (nuevo): `Map<roomId, { songId, status, positionMs, updatedAt,
  skipVotes }>`. Guarda **solo el estado**, no la lista de canciones: el `next` consulta `playlist_song` por
  `position` de `songId` cada vez que hace falta. La posición actual es
  `positionMs + (Date.now() - updatedAt)` si `status === 'playing'`, si no `positionMs`.
- **`POST /api/rooms/:id/playback`** (solo anfitrión): `play` (arranca la primera si estaba detenida o reanuda
  desde `positionMs`), `pause` (guarda la posición), `next` (siguiente por `position`, **vuelve a la primera** —
  **D18** — y **anula la votación en curso**), `stop`. Emite `room:playback`. El cliente del anfitrión envía
  `next` cuando termina una canción.
- **`GET /api/rooms/:id/playback`**: estado actual + estado de la votación para quien consulta. Si nunca
  arrancó, `stopped` con `200`.
- **`DELETE /api/rooms/:id/members/:userId`** (solo anfitrión, `400` si se expulsa a sí mismo, `403` si no es
  anfitrión): borra la fila, emite `room:members` y **`room:member-removed { userId }`** (broadcast; cada cliente
  lo compara contra su propio id, así el server no necesita un índice de sockets por usuario) y recalcula la
  votación.
- **`DELETE /api/rooms/:id`** (solo anfitrión): `status='cerrada'`, borra el estado en memoria, emite
  `room:closed` a todos. La sala deja de aparecer en `GET /rooms` y rechaza ingresos (`400`). Se reutiliza desde
  `leaveRoom` cuando sale el anfitrión (**D16**).

**Criterios de aceptación (backend)**

- [ ] Conexión sin token o con token inválido es rechazada.
- [ ] Un no miembro no puede entrar al canal `room:<id>`.
- [ ] Los eventos llegan a los miembros de la sala y **solo** a ellos.
- [ ] Solo el anfitrión puede cambiar el estado de reproducción; los demás reciben `403`.
- [ ] Cada acción válida emite `room:playback`.
- [ ] `next` limpia la votación en curso.
- [ ] Una sala nunca iniciada responde `200` con estado `stopped`.
- [ ] Una sala cerrada no aparece en `GET /api/rooms` y rechaza ingresos.
- [ ] Si sale el anfitrión, la sala queda cerrada y se emite `room:closed`.

### 6.2 Frontend · `feat/salas-realtime-frontend`

**Dependencias a agregar:** `socket.io-client` en `package.json`.

- **`services/socketService.js`** (nuevo — **hay que documentarlo en `AGENTS.md` §2**): conexión única,
  `subscribe(event, handler)`, reconexión y handshake con el token. Para eso hace falta **exportar
  `getAuthToken()` en `api.js`**, porque hoy el token es una variable privada de módulo (`api.js:30,36`).
- **`vite.config.js`**: el proxy necesita **`ws: true`** para `/socket.io`; si no, el handshake falla en dev.
- **`context/PlayerContext.jsx`**: **extensión mínima y opt-in**, para no meterle lógica de salas a un archivo de
  550 líneas que usan todas las features:
  - `playSongs(songs, startIndex, source, { autoplay = true, onEnded = null })` — `onEnded` reemplaza el `next()`
    local del handler `ended` (`PlayerContext.jsx:467-475`), que es lo que permite que **el anfitrión envíe
    `next` al servidor** cuando termina una canción.
  - `enterRoomMode()` / `exitRoomMode()` / `roomMode` expuesto.
- **`components/player/PlayerControls.jsx` y `ActionControls.jsx`**: en `roomMode` se apagan (shuffle y repeat
  deshabilitados; el transporte lo pone la sala). `ProgressBar` y `ExpandedPlayer` son agnósticos y siguen
  funcionando tal cual.
- **`features/rooms/useRoomPlayback.js`**: traduce el estado del servidor al player. Si cambia `songId`, rearma
  la cola con `autoplay` según el estado remoto y hace `seek(position)`. **Corrección de deriva**: si
  `|audio.currentTime × 1000 − posiciónRemota| > 750 ms`, hace `seek` (los relojes se comparan contra
  `updatedAt` del server, nunca contra el reloj del cliente). Expone `play/pause/next/stop` para el anfitrión y
  `voteSkip` para los miembros.
- **`features/rooms/RoomView.jsx`** completo: controles del anfitrión (reanudar, pausar, siguiente, detener,
  cerrar, expulsar), contador de votación, botón **"Tocar para escuchar"** si el navegador bloquea el autoplay,
  reconexión (re-pedir el estado al volver), y salidas forzadas: expulsado → `/salas` con aviso; cerrada →
  `/salas` con aviso. El socket se desconecta al salir de la pantalla.

**Criterios de aceptación (frontend)**

- [ ] Un miembro que entra con la sala sonando salta a la posición actual.
- [ ] Los miembros no ven controles de transporte; el anfitrión sí.
- [ ] Shuffle y repeat quedan desactivados en modo sala y el socket se desconecta al salir.
- [ ] Miembro expulsado pierde acceso a la sala y su cliente vuelve al listado con un aviso.
- [ ] Al cerrar la sala todos los miembros reciben el aviso y salen.

---

## 7. Fase 4 — Votar skip y calificar al anfitrión (B20 + B10 + F13)

### 7.1 Backend · `feat/salas-skip-backend`

**B20 — `POST /api/rooms/:id/skip-votes`**

- `201` si se registró el voto, con el estado de la votación (votos, votos requeridos y si la canción fue
  saltada).
- `400` si no hay canción sonando o la sala está cerrada; `401` sin sesión; `403` si no es miembro **o es el
  anfitrión**; `404` si la sala no existe; `409` si ya votó por la canción actual.
- Votos **en memoria**, junto al estado de reproducción, asociados al `songId` actual: cada miembro vota una
  sola vez por canción y se limpian al cambiar de canción (**también si la playlist se repite**).
- Aprobación = **más de la mitad de los miembros que no son anfitrión** (**D17**). Al aprobarse, avanzar con la
  misma lógica de `next` de B17, limpiar los votos y emitir `room:playback`.
- Emitir `room:skip-votes` en cada voto. Si un miembro sale o es eliminado, **recalcular `required`** sin tocar
  los votos ya emitidos. Si el anfitrión salta con `next`, la votación en curso se anula.
- Sin migración: los votos no van a Postgres (modelar basura efímera en la base no vale).

**B10 — `POST /api/rooms/:id/rating` (TS-11)**

- `201` si se registró. `401` sin sesión; `403` si no es miembro **o es el anfitrión**; `404` si la sala no
  existe; `409` si ya calificó esa sala (la PK `[idRoom, idRater, idHost]` lo garantiza igual).
- Guarda **`rating = 1`** (**D21**), resolviendo el host desde `room_member`. Sin body.
- Emitir `room:members` (o un evento propio) para que la calificación se refresque en vivo, reutilizando el canal
  de B11.

**D23 — Normalizar el seed (anotada, pendiente de ejecución)**

`Backend/prisma/seedRooms.js` hoy siembra `host_rating` con valores 5/4/3/2 (`:53-104`). Con **D21** la app
genera siempre `1`, así que hay que **bajar todas las calificaciones del seed a `1`**, para que el seed represente
lo que la app produce y el orden por calificación no se vea contradictorio (salas del seed con 5.00 vs. salas
reales con 1.00). Actualizar también el comentario de cabecera del archivo, que hoy explica que el seed existe
"para que el orden por rating sea comprobable": con la escala unificada **el criterio comprobable pasa a ser
"calificada antes que no calificada"**, y eso hay que documentarlo ahí mismo.

**Criterios de aceptación (backend)**

- [ ] Con 3 miembros no anfitrión se requieren 2 votos y el segundo avanza la canción.
- [ ] Segundo voto del mismo miembro por la misma canción devuelve `409`.
- [ ] El anfitrión recibe `403`; sin canción sonando, `400`.
- [ ] Solo un participante puede calificar al anfitrión, una vez por sala.
- [ ] Un participante que ya calificó recibe `409` y el anfitrión no puede calificar a nadie.

### 7.2 Frontend · `feat/salas-skip-frontend`

- **`F13` — Votar para saltar**: los miembros que no son anfitrión ven el botón "Votar para saltar" y el
  contador `votos / requeridos`. Después de votar el botón queda deshabilitado hasta que cambie la canción. El
  anfitrión **no ve el botón**, solo el contador. El estado llega con `GET /rooms/:id/playback` y se actualiza
  con `room:skip-votes`.
- **`rateHost(roomId)`** en `roomsService` + botón único tipo like en la sala, deshabilitado si ya calificaste,
  con el estado de "ya calificaste" tomado del mismo `GET /rooms/:id`.
- **Promedio del anfitrión en su perfil**: `ProfileView` y `ProfilePublic` hoy **no muestran calificación**
  (es el tercer criterio de TS-11, sin cumplir). Hay que sumar el promedio con su cantidad de calificaciones.

**Criterios de aceptación (frontend)**

- [ ] Después de votar el botón queda deshabilitado hasta que cambie la canción.
- [ ] El contador se actualiza en vivo con `room:skip-votes`.
- [ ] El anfitrión ve solo el contador, nunca el botón de votar.
- [ ] Botón deshabilitado si no hay canción sonando.
- [ ] Calificación acumulada visible en el perfil del anfitrión.

---

## 8. Migración de base de datos

Una sola migración chica, en la rama de backend de la fase correspondiente:

- **Índices** en `room`: `status`, `is_private`, `name`. El listado no pagina y las tres columnas están en el
  `WHERE` de B21; hoy `room` **no tiene ningún índice** (`schema.prisma:231-248`).
- **`CHECK (rating BETWEEN 1 AND 5)`** en `host_rating`: ya está escrito en `Backend/src/db/schema.sql:208` pero
  **nunca llegó a una migración de Prisma**. TS-11 empieza a escribir en esa tabla.
- **Sin cambios de columnas**: `code`, `passwordHash`, `maxCapacity`, `status` y `expiresAt` ya existen.

---

## 9. Riesgos y trampas concretas

| Riesgo | Mitigación |
| --- | --- |
| **Vercel serverless no acepta WebSockets entrantes.** `AGENTS.md` D3 dice que el despliegue es en Vercel, pero el repo no tiene `vercel.json` y hoy se levanta con `node` + docker Postgres | La decisión **D8′** es explícita: mientras sea local, Socket.IO va. Si algún día se despliega fuera, hay que migrar la fase 3 a polling (`GET /:id/playback` cada 3–5 s) o a un servicio externo. **Anotarlo en `AGENTS.md` y en `sprint-2-plan.md` cuando se implemente.** |
| **El estado en memoria se pierde al reiniciar el backend** | Ya especificado: `GET /:id/playback` responde `stopped` y la sala sigue `activa`. Es el comportamiento de B18, no un bug. |
| **Deriva de posición entre clientes** | Interpolación con `updatedAt` del servidor + corrección cada N ms cuando la diferencia pasa 750 ms. Nunca comparar contra el reloj del cliente. |
| **El atajo global `Space`** (`PlayerContext.jsx:272-296`) choca con los inputs de la sala | La guarda ya cede ante `input`/`textarea`/`[contenteditable]`; no hay que tocar nada. |
| **`$queryRaw` con `order` interpolado** | Whitelist estricto a `ASC`/`DESC`; `query` parametrizado con `${query}`. Nunca interpolar texto de usuario crudo. |
| **`avg_rating` llega como string** (numeric de Postgres) | `toRoom` ya hace `Number()`; no quitarlo. |
| **RoomCard con botón adentro** | Usar el patrón de slot `action` de `UserRow`, sin interactivos anidados dentro del link. |
| **Rama `feat/ts14-crear-sala` abandonada** | Se rescata solo `CreateRoom.jsx`. Borrarla es una decisión aparte, con autorización explícita. |
| **`RoomMember` no impide dos anfitriones** | Se resuelve en la query con subquery escalar (no `INNER JOIN`). No hace falta migración para eso. |
| **La playlist de Favoritos es `type: 'favorites'`** | **Supuesto a validar**: con D19 el backend no filtra por `type`, así que el filtro de "Mis Favoritos" tiene que hacerlo el cliente (o el backend excluir `favorites` explícitamente). Es el único valor de `type` que no es una playlist real. |

---

## 10. Verificación

- **Backend**: `curl` contra la base real, siguiendo el patrón de `PENDIENTES.md` §5.7 (la lógica se puede probar
  sin base, pero los includes anidados y el mapeo de tipos no). Casos mínimos:
  - crear con playlist propia / de colaborativa / ajena / inexistente / vacía;
  - unirse con código válido, inexistente, con contraseña incorrecta, con sala llena, dos ingresos simultáneos;
  - los 4 códigos de error de cada endpoint;
  - expulsar, cerrar, sala cerrada que rechaza ingresos;
  - votar skip: umbral alcanzado, voto repetido (409), anfitrión (403), sin canción sonando (400);
  - calificar: primera vez, repetida (409), anfitrión (403).
- **Frontend**: `npm run lint` + `npm run build` sin warnings nuevos, y smoke en Chrome, que es lo único que hay
  (el repo no tiene tests). Probar sobre todo: entrar a una sala con la reproducción ya empezada, el bloqueo de
  autoplay, la reconexión del socket y las salidas forzadas (expulsado / cerrada).
- **Antes de pushear cada rama** (regla 12.1): lint + build del frontend en verde, y stageo con rutas
  explícitas archivo por archivo.

---

## 11. Documentación a actualizar al cerrar el bloque

| Archivo | Qué cambia |
| --- | --- |
| `docs/ESPECIFICACIONES-BACKEND.md` §10 | Deja de decir "solo hay lectura": entra el contrato completo de salas y la forma de la respuesta. |
| `docs/REQUERIMIENTOS-BACKEND.md` §7 y §10 | **Hoy contradice al plan**: pide `POST /rooms/:id/close` (en vez de `DELETE`, **D15**), `POST /rooms/:id/join` con body de contraseña (en vez de `POST /rooms/join` por código), `maxCapacity` y `expiresAt` del cliente, y `POST /rooms/:id/ratings` con body `{ rating }` (en vez de `POST /rooms/:id/rating` sin body, **D21**). Además su numeración D1–D11 **colisiona** con la de `sprint-2-plan.md`. |
| `docs/CONTEXT.md` §3.1 y §4.2 | Endpoints nuevos, `roomsService` sin mock, `socketService` nuevo. |
| `docs/PENDIENTES.md` | Cerrar los ítems de salas y WebSockets (§5). |
| `docs/plan/sprint-2-plan.md` | Marcar TS-11, TS-14, TS-15, TS-16, TS-17 y TS-18 con su estado real, y registrar D15–D23. **Sin sobrescribir**: es un histórico de sprint (regla 9). |
| `AGENTS.md` | §2: alta de `socketService.js` en el árbol y en la §3 de convenciones. §5: la decisión de WebSockets deja de ser "pendiente". Añadir la nota de que la sincronización exige servidor Node persistente. |
| `Backend/prisma/seedRooms.js` | Comentario de cabecera, que hoy justifica el seed por "el orden por rating" y con **D23** tiene que describir el criterio nuevo. |

---

## 12. Pendiente de confirmación

Este plan **no ejecuta nada**. Antes de arrancar hay que confirmar:

1. **Orden de las 8 ramas** de la §3 (backend antes que frontend dentro de cada fase).
2. **Si la rama `feat/ts14-crear-sala` se borra** al terminar el bloque, o se deja archivada.
3. **El supuesto sobre "Mis Favoritos"** (§9, última fila): con D19 el backend no filtra por `type`, así que hay
   que decidir si se excluye en el cliente o se agrega una excepción explícita en el backend.
4. **Si se actualiza `REQUERIMIENTOS-BACKEND.md` §7** en el mismo bloque o en una rama `docs/` aparte al final.
5. **Si el bloqueo de play en una sala debe alcanzar también al anfitrión** (**D25**, comportamiento ya
   implementado y a revisar). Hoy un anfitrión que entra a su sala en `paused`/`stopped` **no puede arrancar el
   audio desde el `PlayerBar` ni desde el reproductor expandido**: el botón aparece deshabilitado y solo los
   controles de la pantalla de la sala lo reproducen. Es lo coherente con el resto de la regla —si el anfitrión
   arrancara por la barra, sonaría solo él, desfasado del resto, y no tendría cómo avisarle a la sala— pero es una
   restricción visible para quien administra y conviene decidirla a conciencia. Las dos salidas posibles:
   (a) dejarlo así, con el anfitrión siempre obligado a pasar por la pantalla de la sala; o (b) permitirle arrancar
   desde cualquier control y que ese arranque se propague al servidor como un `play` de sala. Ver **D25** en §2.
