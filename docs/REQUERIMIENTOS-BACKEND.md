# Hoja de requerimientos — incorporación del backend

> Alcance: qué necesita el frontend para dejar los mocks y hablar contra la API real. No es un contrato
> de endpoints ya implementado (eso está en `ESPECIFICACIONES-BACKEND.md`); es la lista de lo que falta,
> en orden de incorporación, con lo que hay que decidir antes de escribir cada endpoint.
>
> Documentos relacionados: `ESPECIFICACIONES-BACKEND.md` (contratos vigentes de la API),
> `PENDIENTES.md` (pendientes generales), `AGENTS.md` (convenciones),
> `docs/plan/sprint-2-plan.md` (TS-10 a TS-20, que es quien va a consumir casi todo lo de acá).

**Cómo usar la hoja:** cada requerimiento tiene un id (`REQ-<dominio>-<n>`), una prioridad y una casilla.
Una casilla se tilda cuando el endpoint está implementado **y** verificado contra la base real. Los
bloques ya migrados se verificaron con una suite de humo por HTTP el 2026-10-08 (detalle en
`PENDIENTES.md` §5.7); los que todavía no se escribieron siguen sin tildar. Las "decisiones a tomar"
son bloqueantes: si no se resuelven, el endpoint se implementa de una forma y después hay que
romperlo.

---

## 1. Punto de partida

### 1.1 Lo que el backend ya tiene

| Pieza | Estado | Nota |
| --- | --- | --- |
| Esquema Prisma | **completo** | Hay modelos para `Playlist`, `PlaylistSong`, `PlaylistMember`, `Favorite`, `Follow`, `Room`, `RoomMember`, `HostRating`, `Content`, `ContentPlayement`, `Mood`. El schema llega bastante más lejos que los endpoints. |
| Migraciones y seed | **aplicadas** | 6 migraciones (`20260930171420_init` … `20261003183946_add_room_avg_rating_view`); `prisma migrate status` → `Database schema is up to date!` (2026-10-08). 97 canciones, 35 géneros, 3 estados de ánimo. Los `CHECK` de `host_rating` (1–5) y de `follow` (no seguirse a uno mismo) están en la migración aplicada. |
| `GET /api/songs` | listo | Cursor, con `LIMIT = 10` fijo en `song.service.js`. |
| `GET /api/songs/search` | listo | Offset, contrato en `ESPECIFICACIONES-BACKEND.md` §2. |
| `GET /api/songs/:id` | listo | Usa `SONG_INCLUDE` (artista, géneros, estados de ánimo) y `findUniqueOrThrow`, así que un id inexistente cae en el `404` de `errorHandler`. |
| Auth | **listo** | `register` (201 con token), `login` y `logout`, montados **una sola vez** en `/api/auth` (el mount duplicado `/api/v1/auth` ya se eliminó). |
| `authenticate` | listo | JWT `Bearer`, deja el payload del token en `req.user`. |
| `GET /api/users/search` | listo | Offset con `{ items, total, page, pageSize, totalPages }`, busca por `username` **y** por género vía las vistas `user_top_genre` / `user_genre_counts`. Los `items` salen de un `$queryRaw`, así que traen `picture_url` y `genre_name` en snake_case (el mapeo vive en `usersService`). |
| Usuarios y follow | **listos** | `GET /users/me` (+ `PATCH`), `GET /users/:id` con contadores, `followers`/`following`, `POST`/`DELETE /:id/follow`. Contrato en ESPECIFICACIONES §7. |
| Playlists y favoritos | **listos** | CRUD completo de `/api/playlists` (las canciones se agregan/quitan/reordenan en lote por `PUT /:id`) y `/api/favorites`. Contrato en ESPECIFICACIONES §8–§9. |
| Manejo de errores | con reparos | `errorHandler` mapea códigos Prisma a español. Además, `getId` y los validadores de `validation.js` lanzan con `error.code = 400` y el catch-all de `app.js` usa `res.status(err.code \|\| 500)`. Ver los avisos de §2. |

### 1.2 Lo que el frontend tiene contra la API real

`songsService`, `authService`, `usersService` y `playlistsService` ya hablan contra la API real (la
sesión, el perfil, el seguimiento y las playlists/favoritos están migrados). Sigue en mocks
`roomsService` (`USE_MOCK = true`, consume `mocks/rooms.js`): es el único importador de `mocks/`.

### 1.3 Los huecos, de un vistazo

Los huecos 1–4 de versiones anteriores (cliente HTTP con verbos y token, playlists/favoritos, auth
con `register` que devuelve token, endpoints de usuarios) **ya se cerraron**. Lo que sigue abierto:

| # | Hueco | Impacto |
| --- | --- | --- |
| 1 | No hay lote de canciones por id (`?ids=`) | Hidratar una playlist son N requests (REQ-SONG-1) |
| 2 | No hay endpoints de salas CRUD, ni chat, ni recomendaciones, ni playlists colaborativas | Sprint 2 entero |
| 3 | El esquema no tiene dónde guardar votos de skip ni mensajes de chat | Dos features sin soporte de datos |
| 4 | La foto de perfil se guarda como base64 en la columna `pictureUrl` | `PENDIENTES.md` §7 |

---

## 2. Convenciones transversales

Aplican a **todos** los endpoints nuevos. Si se cumple esto, el frontend migra sin tocar componentes
(regla 6 de `AGENTS.md`: al migrar a backend real solo se edita el contenido de `services/`).

| Tema | Regla |
| --- | --- |
| Prefijo | `/api`, sin versión. `API_BASE_URL` ya es `/api` en el frontend y el proxy de Vite apunta a `:3000`. El mount duplicado `/api/v1/auth` ya se eliminó de `app.js`. |
| Rutas | Plurales, minúsculas, sin verbos (`/api/playlists/:id/songs`, no `/api/playlists/addSong`). Las acciones que no son CRUD van como sub-recurso: `/api/rooms/:id/vote-skip`, `/api/users/:id/follow`. |
| Identidad | Sale de `req.user.sub` (el `jwt.sign` actual pone `{ sub: user.id, email, username }`), **nunca** del body ni de un query param. Ojo: en JWT `sub` es string, hay que castearlo a número para Prisma. |
| Auth | Todo lo privado exige `authenticate`. Lo público sigue abierto. |
| Ids | `Int` de Postgres (SERIAL). El backend debe tolerar que el cliente mande `"43886"` además de `43886`; conviene verificar que Prisma no rompa con un string en un campo `Int` en vez de asumirlo. |
| Errores | Dos mecanismos conviven: `prismaErrorHandler` mapea códigos Prisma a español, y los validadores de `utils/validation.js` lanzan un `Error` con `error.code = 400` que el catch-all de `app.js` traduce a `res.status(err.code \|\| 500)`. El cuerpo es `{ status: "error", message, code? }`. La validación de `register` agrega `errors: [string]` (verificado 2026-10-08); los demás 400 van solo con `message`. No encontrado, `404`. Conflicto, `409`. |
| Avisos de errores | Tres cosas a tener presentes antes de que el frontend dependa de este contrato: (a) el catch-all devuelve `err.message` crudo, así que un error interno puede filtrar texto de Prisma o de SQL al cliente, cuando antes era un mensaje genérico; (b) `res.status(err.code)` asume que `code` es un número, pero Prisma y el driver de Postgres usan strings (`P2025`, `ECONNREFUSED`), y si alguno llegara al catch-all con `code` string, Express rompe al escribir la respuesta. Un `Number.isInteger(err.code) ? err.code : 500` lo evita; (c) **verificado 2026-10-08**: `PUT /playlists/:id` con `addSongs` de un id no numérico devuelve **500** (`P2023` sin mapear), mientras que un id numérico inexistente devuelve 409 (FK `P2003`). Falta mapear `P2023` a 400 en `errorHandler`. |
| Privacidad | Una playlist de otro usuario en `GET /api/playlists/:id` responde **`404`, no `403`**: un `403` confirma que el id existe. La UI depende de no filtrar existencia. Ojo: `PUT`/`DELETE /:id` sí responden `403` (chequeo de dueño aparte, ver ESPECIFICACIONES §9); conviene no agregar rutas nuevas que sigan ese 403 en lectura. |
| Paginación | **Resuelta (cuenta D11):** `/api/songs/search` y `/api/users/search` son offset y comparten el envelope `{ items, total, page, pageSize, totalPages }` (ver `ESPECIFICACIONES-BACKEND.md` §2), así que `SearchSongs` y `SearchPeople` usan el mismo componente de páginas numeradas. `GET /api/songs` sigue siendo por cursor a propósito (cola y novedades). |
| Fechas | ISO 8601 UTC. El esquema usa `TIMESTAMP(6)` sin timezone, así que la conversión es del lado del cliente. |
| Nombres de campos | El frontend mapea en `services/`, así que no hace falta que el backend use nombres de UI, pero sí ser **consistente**. Ojo con este mapeo: el frontend usa `avatarUrl` y `bio`; la base tiene `picture_url` y `biography`. |
| CORS | `app.use(cors())` abierto sirve para el dev con proxy, pero el APK (Capacitor) le pega a la API desde otro origen. En producción hay que fijar la lista. |

### 2.1 Contexto que estaba en comentarios del código

Los comentarios de `Backend/` se eliminaron para que el código se lea sin ruido. **Excepción: los de `prisma/migrations/`**, que no se tocan (ver la primera fila). Lo que era contexto y no queda explícito ni en el código ni en esta hoja:

| Tema | Contexto |
| --- | --- |
| Migraciones inmutables | Prisma guarda el SHA256 de cada `migration.sql` aplicado en `_prisma_migrations.checksum`. Editar uno ya aplicado —aunque sea para borrarle un comentario— hace que `migrate dev` lo marque como modificado. Los `migration.sql` son historia: no se editan. |
| Vistas SQL | `room_avg_rating`, `user_top_genre` y `user_genre_counts` las crea una migración a mano. Si falta alguna, `/api/rooms` y `/api/users/search` devuelven `500` (`P2010`/`42P01`) aunque `prisma migrate status` diga que el schema está al día. `room_avg_rating` además necesita `@@map("room_avg_rating")` en el bloque `view RoomAvgRating` del schema: sin eso Prisma la busca con el nombre del modelo y el query falla. |
| Índice único de favoritos | `20261003141706` agrega un índice único parcial que garantiza **un solo** playlist de tipo `favorites` por usuario. Esa es la garantía de "Mis Favoritos", y no se lee en el código. |
| Orden de rutas | En `user.routes.js`, `/me` se declara **antes** que `/:id`. Al revés, la ruta dinámica se come `/me` y responde `404`. |
| Visibilidad de `user` | Hay dos `select`: el público (sin `email` ni hash) y el del dueño de la sesión (agrega `email`, que la UI muestra en el perfil propio). El `passwordHash` no se devuelve en ninguno de los dos. |
| Cliente Prisma | Los services toman la instancia compartida con `require("../prisma/prismaClient")`. No se crea un `PrismaClient` por archivo. |
| Seed | `prisma/seed.js` puebla solo `artist`, `song`, `genre`, `mood`, `song_artist`, `song_genre` y `song_mood` desde `prisma/data/songs.json`. Ignora los campos del JSON que no existan en la base, descarta las canciones sin género o sin mood, e inserta ids explícitos, por lo que adelanta las secuencias con `setval`. Es idempotente: se puede volver a correr. |
| pgAdmin | `docker compose up -d` levanta también pgAdmin en `localhost:8080`; las credenciales están en `docker-compose.yml`. |
| [ ] Pendiente | En `favorite.service.js` había una nota de "probar esto" con `const playlist = await ensureFavoritesPlaylist(userId)` comentada. Queda sin decidir si el service debe garantizar la playlist de favoritos o si la resuelve el controlador. |

---

## 3. Bloqueantes (P0) — sin esto no se incorpora nada

### [x] REQ-HTTP-1 — Cliente HTTP con verbos y token

`Frontend/src/services/api.js` exporta `get`, `post`, `put`, `patch` y `del`, con el token inyectado
desde la sesión y manejo del 401.

- [x] Bearer automático. El token vive en el contexto de sesión (`setAuthToken`), no en cada service.
- [x] Un 401 dispara el cierre de sesión y la redirección a `/login`, **una sola vez**: si no, cada
      request en vuelo dispara su propio redirect (`setUnauthorizedHandler`).
- [x] `buildUrl` ya descarta los params vacíos: se reutiliza tal cual.
- [x] `ApiError` mantiene `status` y `code`: las pantallas ya muestran el `message` del backend.

**Por qué va primero:** sin esto no se puede llamar a ningún endpoint de escritura, que es el 80% de lo
que falta.

### [x] REQ-AUTH-1 — `register` tiene que devolver token

Verificado contra la base real (2026-10-08): `POST /api/auth/register` responde `201` con
`{ status, token, user }`, igual que `login`.

- [x] `register` responde `{ status: "success", token, user }`, igual que `login`.
- [x] `JWT_EXPIRES_IN`: decidido `7d` por defecto (`auth.controller.js`), sin revocación.
- [ ] `logout` es un no-op del lado del servidor. Con JWT sin blacklist, cerrar sesión no invalida el
      token: sigue vivo 7 días si alguien lo copió. Aceptable para el proyecto, pero **que sea una
      decisión escrita** (D7), no un olvido. Si se quiere cerrar de verdad, hace falta lista de
      revocación.

### [x] REQ-AUTH-2 — Endpoint del usuario actual

- [x] `GET /api/users/me` → el usuario del token, **incluyendo** `email` (la UI lo muestra en el perfil).
- [x] El `user` que devuelven `register` y `login` trae los mismos campos que `GET /users/me`
      (el select de `registerUser` es idéntico a `ME_USER_SELECT` y `loginUser` devuelve todas las
      columnas sin `passwordHash`).

### [x] REQ-USER-1 — Completar usuarios reales

| Método | Ruta | Estado | Notas |
| --- | --- | --- | --- |
| `GET` | `/api/users/search?query=` | listo | Offset con `{ items, total, page, pageSize, totalPages }` (antes cursor). `items` en snake_case (`picture_url`, `genre_name`); el mapeo vive en `usersService`. |
| `GET` | `/api/users/:id` | listo | `getUserById` (perfil público, TS-08), con `followers[]`, `following[]` y contadores |
| `GET` | `/api/users` | no implementado | `listUsers`: ninguna pantalla lo pide; no hace falta |
| `PATCH` | `/api/users/me` | listo | `updateProfile`, con username 3–50 y único |

- [x] **Paginación**: offset con el mismo envelope que `/songs/search`, porque `usersService.searchUsers`
      y `SearchPeople` ya están construidos sobre `{ items, total, page, pageSize, totalPages }`
      (cierre de D11).
- [x] **Campos**: el mapeo vive en el service (`usersService` traduce `avatarUrl`→`pictureUrl`,
      `bio`→`biography`), como pide la regla 6 de `AGENTS.md`; los componentes no ven snake_case.
- [x] **Query vacía**: tanto `/songs/search` como `/users/search` tratan la query vacía como
      "todo el catálogo" (200), no como error.
- [x] Sacar el `console.log(query)` que quedó en `user.controller.js`.
- [x] `PATCH /users/me` valida `username` único y de largo 3–50 (`user.service.js::updateUser`).
- [x] Los ids salen enteros: la firma de `updateProfile` ya no recibe ids mock.

### [x] REQ-AUTH-3 — Cuál es la ruta de auth

- [x] Quedarse con `/api/auth` y sacar `/api/v1`. El mount duplicado ya no existe en `app.js`.
- [x] Dejar escrito por qué: la convención de `AGENTS.md` es `/api` sin versión.

---

## 4. Playlists y favoritos (P0)

La migración más delicada, porque el esquema y el mock modelaban los favoritos de forma distinta.
**Ya está migrado y verificado contra la base real (2026-10-08).**

### 4.1 [x] Decisión: qué es "Mis Favoritos" (D1 resuelta)

- **El esquema:** `Favorite` es una tabla N:M aparte (`idUser`, `idSong`, `markedDate`).
- **El mock de TS-09:** los favoritos son *una playlist* con `isFavorites`, que aparece en la biblioteca
  y se abre en el mismo detalle que las demás.

**Resuelto así:** la tabla `favorite` es la única fuente. `GET /api/favorites` devuelve las canciones
favoritas ordenadas por `markedDate DESC` (más una playlist sintetizada `{ id, name }`), y
`playlistsService` arma la playlist virtual "Mis Favoritos" con el mismo objeto que ya devolvía el mock.
O sea: **cambia el almacenamiento, no la forma** — el punto de la regla 6 de `AGENTS.md`. La playlist
`type: "favorites"` se crea sola al primer favorito y no se puede editar ni borrar (403).

- [x] Decidido y documentado (aquí y en ESPECIFICACIONES §8). La alternativa (materializar todo en la
      tabla `playlist`) queda descartada salvo que el producto pida compartir la colección de favoritos
      con otras personas (eso sería D2).

### 4.2 [x] REQ-PLAYLIST-1 — Endpoints de playlists

Todos exigen `authenticate`. El dueño **sale siempre del token**, nunca del body: es la misma garantía
que ya aplica el mock. Verificado por humo: crear, name vacío/>50 → 400, ajena → 404 (GET) y 403
(DELETE), borrar → 200 y 404 después.

| Método | Ruta | Notas |
| --- | --- | --- |
| `GET` | `/api/playlists` | Las del usuario del token, con `creator` y `songs` ordenadas por posición. |
| `POST` | `/api/playlists` | Body `{ name, description?, isPublic? }`. `type: personal`, `idCreator` del token. `201` con la playlist creada. |
| `GET` | `/api/playlists/:id` | `404` si es de otro (no `403`). |
| `PUT` | `/api/playlists/:id` | Body `{ name?, description?, addSongs?, removeSongs?, reorder? }`. Dueño y no-favoritos; si no, `403`. |
| `DELETE` | `/api/playlists/:id` | Dueño y no-favoritos. Borrar la fuente de una sala tiene `onDelete: Restrict` en `Room`: `409` con mensaje claro, no un 500 de Prisma (pendiente de probar cuando existan salas). |
| `GET` | `/api/playlists/:id/members` | **Falta**: para las colaborativas (TS-12/TS-13). |

No existen (ni hacen falta) sub-recursos `/songs`: las canciones viajan en `GET /` y `GET /:id`, y se
agregan/quitan/reordenan en lote por `PUT /:id` (§4.3).

- [x] `name` no vacío y de largo `<= 50`; si no, `400`, no un 500 de Prisma (verificado).
- [x] `type` no lo manda el cliente: el service crea `personal`.
- [ ] `members` (colaborativas) — depende de TS-12.

### 4.3 [x] REQ-PLAYLIST-2 — Reglas que el esquema impone

`PlaylistSong` tiene PK compuesta `[idPlaylist, idSong]`. Las tres reglas quedaron implementadas en
`playlist.service.js::updatePlaylist` (todo dentro de una transacción):

1. **No se puede agregar dos veces la misma canción** → `createMany` con `skipDuplicates: true`:
   la repetida no inserta y la operación responde `200` (idempotente, verificado). Nunca llega el
   `P2002`/409.
2. **`position` se calcula** como `max(position) + 1` dentro de la transacción. Queda el caveat
   documentado: dos altas simultáneas pueden pisarse (no hay constraint único de posición).
3. **Al quitar se renumera** (`position = i + 1` en la misma transacción), sin huecos.

### 4.4 [x] REQ-PLAYLIST-3 — Forma de la respuesta

El frontend mapea en `playlistsService`; los campos ya coinciden con lo que consume la UI:

| En la UI | Del backend |
| --- | --- |
| `songIds` / canciones | `songs[]` **completas** (con `artist` y `songGenres`) ordenadas por `position`, incluidas en `GET /playlists` y `GET /playlists/:id` |
| `isFavorites` | **No viene del backend** (ver §4.1): lo arma el service del lado del cliente |
| `createdAt` | `creationDate` |
| `ownerId` | `idCreator` |

No hace falta hidratar con N requests (el hueco de §5.1 sigue abierto para cuando quiera pedirse el
lote puntual, pero la hidratación de playlists no lo necesita).

---

## 5. Canciones (P1) — huecos sobre lo ya implementado

### [ ] REQ-SONG-1 — Lote por id

`GET /api/songs?ids=1,2,3`, con los mismos includes que `search`. Sin esto, abrir una playlist de 20
canciones son 20 requests: es el hueco que quedó marcado en TS-09.

- [ ] Preservar el **orden pedido**: un `orderBy` por `id` no alcanza, porque la playlist tiene
      `position`.
- [ ] Definir qué pasa con los ids que no existen: ignorarlos en silencio, o devolverlos aparte. La UI
      ya muestra "no disponible" y no debe romperse por uno que falta.

### [ ] REQ-SONG-2 — `LIMIT` de `GET /api/songs` parametrizable

`LIMIT = 10` está fijo en `song.service.js` (constante, línea 3). `listSongs()` alimenta la cola inicial
del reproductor y la fila de novedades: 10 es una decisión de diseño, no del contrato.

- [ ] Aceptar `limit` con tope, con el mismo `MAX_PAGE_SIZE = 50` que ya usa `search`.

### [ ] REQ-SONG-3 — `source` ("Reproduciéndose desde")

**No es trabajo de backend.** La línea debería decir de dónde salió la canción (nombre de playlist o de
sala) y eso lo sabe el frontend, que es quien arma la cola en `playSongs()`. La fila no existe en el
esquema y no hace falta agregarla.

- [ ] Decisión del frontend: `playSongs(songs, startIndex, source)`.
- [ ] Cerrar el ítem 5.4 de `PENDIENTES.md` con esa decisión.

### [ ] REQ-SONG-4 — `album`: columna o fuera del contrato

El esquema no tiene columna `album` y el filtro de búsqueda no la cubre. Por eso se quitó la palabra del
copy de `SearchSongs` (§5.3 de `PENDIENTES.md`).

- [ ] Decidir: agregar columna + filtro + payload, o dejarlo definitivamente fuera. Si se agrega, hay que
      reponer "álbumo" en el copy y en el contrato de búsqueda.

---

## 6. Perfiles y seguimiento (P1)

Cubre TS-10 del plan de Sprint 2. El modelo `Follow` ya existe, con su `CHECK` de no-seguirse-a-sí-mismo
en la migración aplicada.

| Método | Ruta | Notas |
| --- | --- | --- |
| `POST` | `/api/users/:id/follow` | El `:id` del path, no del body. Idempotente. Seguirte a ti mismo: `400` (o `409`), no un 500 del `CHECK`. |
| `DELETE` | `/api/users/:id/follow` | Idempotente también: dar "dejar de seguir" a quien no seguís debería ser `200`, no `404`. |
| `GET` | `/api/users/:id/followers` | Paginado. |
| `GET` | `/api/users/:id/following` | Paginado. |
| `GET` | `/api/users/:id` | Idealmente con `isFollowing` y los contadores ya resueltos para el usuario del token, para no pedir tres endpoints al abrir un perfil. |

- [x] Rutas de follow implementadas: `POST`/`DELETE /api/users/:id/follow` (`follow.controller.js`) y
      `GET /api/users/:id/followers|following`, con preview `{ id, username, pictureUrl }`
      (`follow.service.js`). El frontend ya las consume (`usersService.js`, `useFollow`). Las listas
      todavía **no** están paginadas (devuelven el array completo).
- [x] `GET /api/users/:id` devuelve `followerCount`/`followingCount` y las listas `followers`/`following`
      (agregado en `f48a224`). Todavía **no** devuelve `isFollowing`; el frontend lo deriva de la lista de
      seguidores. Ver `PENDIENTES.md` §6.

---

## 7. Salas (P1 → P2)

Es lo más caro del proyecto, y el esquema tiene una restricción que condiciona todo: **`Room` exige
`idPlaylistSource`** (`onDelete: Restrict`). No hay sala sin playlist de origen, y borrar esa playlist con
una sala viva tiene que dar `409`.

| Método | Ruta | Notas |
| --- | --- | --- |
| `GET` | `/api/rooms` | **Existe** (verificado 2026-10-08): array crudo con `avg_rating` de la vista, `sort=alphabetical\|rating` y `400` ante sort inválido. Para TS-17 hace falta además `query`/`status`. |
| `POST` | `/api/rooms` | Body `{ name, description?, idPlaylistSource, isPrivate, password?, maxCapacity, expiresAt? }`. El `code` lo genera el server (único, `VarChar(20)`). `status: activa`. El creador entra como `host`. |
| `GET` | `/api/rooms/:id` | Con `members`, `playlistSource` y el puntaje promedio del anfitrión. |
| `PATCH` | `/api/rooms/:id` | Solo `host`. |
| `POST` | `/api/rooms/:id/close` | **Acción, no edición**: `status` no es un campo editable desde el cliente. `DELETE` sería ambiguo (¿borrar o cerrar?). |
| `POST` | `/api/rooms/:id/join` | Body `{ password? }` si es privada. Capacidad llena: `409`. |
| `POST` | `/api/rooms/:id/leave` | Si sale el host, decidir si cierra la sala o si el rol se transfiere. |
| `GET` | `/api/rooms/:id/members` | Con roles. |
| `POST` | `/api/rooms/:id/ratings` | Body `{ rating }` 1–5 (lo valida el `CHECK`; mejor validarlo antes y devolver `400`). PK `[idRoom, idRater, idHost]`: una calificación por persona y sala. |

- [ ] **Decisión: dónde viven los votos de skip.** No hay tabla ni columna para ellos, y son estado
      efímero de la reproducción (se reinician al cambiar de canción), así que guardarlos en Postgres es
      modelar basura. Alternativas: en memoria en el proceso del servidor (se pierde al reiniciar y no
      escala a más de una instancia) o Redis (hay que incorporarlo). Mientras no se decida, TS-18 no
      puede ir al backend.
- [ ] El puntaje promedio para ordenar salas sale de un `AVG` sobre `host_rating`; decidir si cuenta el
      promedio simple o uno ponderado por cantidad de votos.

---

## 8. Chat y sincronización de reproducción (P2)

Hay que decidir el transporte antes que el endpoint: la convención REST no cubre un chat.

- [ ] Definir si es WebSocket (`socket.io` o `ws`) y con qué auth (handshake con JWT).
- [ ] **El esquema no tiene mensajes de chat.** `Content` y `ContentPlayement` son para contenido con
      canción opcional, no para mensajes de sala. Hace falta una tabla `room_message`, o decidir que el
      chat es efímero y vive solo en el servidor.
- [ ] Sincronización de reproducción: la sala necesita saber qué canción está sonando y en qué segundo.
      Hoy la posición de la cola es estado del cliente (`PlayerContext`), no del servidor.
- [ ] Esto resuelve la decisión abierta 2 de `AGENTS.md` (`services/socketService.js`).

---

## 9. Recomendaciones (P2)

| Método | Ruta | Notas |
| --- | --- | --- |
| `GET` | `/api/recommendations` | Lo que me recomendaron (recibidas). |
| `POST` | `/api/recommendations` | Recomendar una canción a una persona. |
| `GET` | `/api/moods` | Para TS-20 (recomendación por estado de ánimo). |

- [ ] No hay modelo de recomendación en el esquema. `Content` podría servir para "recomendación con nota y
      canción", pero TS-19 pide una recomendación **por persona**: hay que definir si se modela con
      `Content` o con una tabla nueva.
- [ ] TS-20 pide recomendación por estado de ánimo "con IA": eso es un servicio externo o un job. El
      backend sería proxy, y hay que decidir de dónde salen las recomendaciones y cómo se cachean.
- [ ] `Mood` y `SongMood` ya están sembrados (3 estados de ánimo), así que el filtro por estado de ánimo
      tiene soporte de datos aunque el resto no.

---

## 10. Decisiones abiertas (bloquean endpoints)

Ninguna de estas se puede implementar sin resolverla antes.

| # | Decisión | Estado | Afecta a | Bloquea |
| --- | --- | --- | --- | --- |
| D1 | ¿Favoritos como tabla `favorite` o como playlist materializada? | **resuelta**: tabla `favorite` única fuente, playlist virtual en el cliente (§4.1) | §4.1 | Toda la API de favoritos (ya migrada) |
| D2 | ¿"Mis Favoritos" es compartible? Si sí, hace falta la playlist de verdad | abierta | §4.1 | TS-12 |
| D3 | ¿`source` lo calcula el frontend? (recomendado: sí) | abierta, **fuera del backend** (REQ-SONG-3) | §5 | Cierra PENDIENTES 5.4 |
| D4 | ¿`album` entra al esquema o queda fuera? | abierta | §5 | Copy y filtro de búsqueda |
| D5 | ¿Dónde viven los votos de skip? | abierta | §7 | TS-18 entero |
| D6 | ¿El host que sale de una sala la deja o la cierra? | abierta | §7 | `POST /rooms/:id/leave` |
| D7 | ¿Se revocan los tokens al hacer logout? | abierta | §3 | `POST /auth/logout` real |
| D8 | ¿Chat por WebSocket, con mensajes persistentes o efímeros? | abierta | §8 | Tareas de salas y chat |
| D9 | ¿Librería de validación para los endpoints nuevos? Hoy `utils/validation.js` es a mano | abierta | §2, todos | Consistencia de los `400` |
| D10 | ¿CORS con lista explícita de orígenes para el APK? | abierta | §2 | Build de producción |
| D11 | ¿`/api/users/search` pasa a offset o el frontend se adapta al cursor? | **resuelta**: offset, igual que `/songs/search` | §2, REQ-USER-1 | `SearchPeople` (ya funciona) |

---

## 11. Orden sugerido de incorporación

Cada bloque se puede entregar solo. La regla es: al terminar uno, el mock que reemplaza se borra (o queda
sin imports, como pasó con `mocks/songs.js`) y se actualizan las casillas.

1. **[x] REQ-HTTP-1 + REQ-AUTH-1/2/3 + REQ-USER-1** → la sesión y el perfil salen del mock. Es el bloque que
   desbloquea todo lo demás y el que más riesgo tiene (ids, tokens, forma del user).
2. **[x] REQ-PLAYLIST-1/2/3 + D1** → TS-09 pasa de `localStorage` a la base.
3. **[ ] REQ-SONG-1/2** → hidratar playlists sin N requests.
4. **[x] Follow + perfil** → TS-10.
5. **[ ] Salas** → cuando D5 y D6 estén resueltas. Es el bloque más grande.
6. **[ ] WebSocket + chat** → cuando D8 esté decidido.
7. **[ ] Recomendaciones** → al final, es lo más abierto a producto.

**Definition of done de cada bloque:**

- [ ] `npm run build` y `npm run lint` pasan en el frontend, sin warnings nuevos.
- [ ] Los endpoints verificados **contra la base real** con `curl`, no solo con un script que intercepta
      Prisma. El aprendizaje de §5.7 de `PENDIENTES.md`: la lógica se puede probar sin base, pero los
      includes anidados y el mapeo de tipos no.
- [ ] El service migrado no importa nada de `mocks/`.
- [ ] Los errores del backend (401/403/404/409) tienen una salida visible en la UI, no una pantalla en
      blanco.
- [ ] La pantalla se probó en navegador, porque no hay E2E en el repo.

---

## 12. Trazabilidad con los sprints

| Tarea | Requiere | Bloqueada por |
| --- | --- | --- |
| TS-10 Seguir personas | **hecho** (REQ-HTTP-1, REQ-USER-1, endpoints de follow verificados) | — |
| TS-11 Calificar anfitrión | §7, ratings | salas |
| TS-12 Playlist colaborativa | `PlaylistMember` + `tokenInvitation` | D1, D2 |
| TS-13 Invitar a colaborativa | endpoints de invitación | TS-12 |
| TS-14/15/16 Salas | §7 completo | D5, D6 |
| TS-17 Ordenar salas por calificación | `AVG(host_rating)` | TS-11 |
| TS-18 Votar skip | votos de skip | **D5** |
| TS-19/20 Recomendaciones | §9 completo | modelo de recomendación |

---

## 13. Verificación

Arranque y verificación mínima: los mismos comandos de `ESPECIFICACIONES-BACKEND.md` §5.2 (con la suite
de humo reproducible que queda registrada en `PENDIENTES.md` §5.7).

Chequeos de humo del bloque 1 (ejecutados 2026-10-08):

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"a@b.com","username":"abc","password":"Demo1234"}'
#    esperado: 201 con token (las reglas de validación: email, username 3-50, password >=8 con letra y número)

TOKEN=<el que devuelva login>
curl http://localhost:3000/api/users/me -H "Authorization: Bearer $TOKEN"
#    esperado: el usuario del token, con email

curl -X POST http://localhost:3000/api/playlists \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"name":"Primera"}'
#    esperado: 201 con la playlist creada y idCreator = id del token
```

Regla para los `curl` que agreguen valor: probar el caso negativo junto al positivo. Un endpoint que solo
se prueba en el camino feliz no demuestra que la privacidad del §2 funcione: el `404` de una playlist
ajena y el `409` de borrar la fuente de una sala son justo los casos que importan.
