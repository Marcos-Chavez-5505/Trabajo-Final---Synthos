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
| Esquema Prisma | **completo** | Hay modelos para `Playlist`, `PlaylistSong`, `PlaylistMember`, `PlaylistInvitation`, `Favorite`, `Follow`, `Room`, `RoomMember`, `HostRating`, `Content`, `ContentPlayement`, `Mood`. El schema llega bastante más lejos que los endpoints. |
| Migraciones y seed | **aplicadas** | 6 migraciones (`20260930171420_init` … `20261003183946_add_room_avg_rating_view`); `prisma migrate status` → `Database schema is up to date!` (2026-10-08). 97 canciones, 35 géneros, 4 estados de ánimo. Los `CHECK` de `host_rating` (1–5) y de `follow` (no seguirse a uno mismo) están en la migración aplicada. |
| `GET /api/songs` | listo | Cursor, con `LIMIT = 10` fijo en `song.service.js`. |
| `GET /api/songs/search` | listo | Offset, contrato en `ESPECIFICACIONES-BACKEND.md` §2. |
| `GET /api/songs/:id` | listo | Usa `SONG_INCLUDE` (artista, géneros, estados de ánimo) y `findUniqueOrThrow`, así que un id inexistente cae en el `404` de `errorHandler`. |
| Auth | **listo** | `register` (201 con token), `login` y `logout`, montados **una sola vez** en `/api/auth` (el mount duplicado `/api/v1/auth` ya se eliminó). |
| `authenticate` | listo | JWT `Bearer`, deja el payload del token en `req.user`. |
| `GET /api/users/search` | listo | Offset con `{ items, total, page, pageSize, totalPages }`, busca por `username` **y** por género vía las vistas `user_top_genre` / `user_genre_counts`. Los `items` salen de un `$queryRaw`, así que traen `picture_url` y `genre_name` en snake_case (el mapeo vive en `usersService`). Con sesión (auth **opcional**) cada item agrega la relación en los dos sentidos para el que busca, resuelta con dos `EXISTS` en la misma query: `isFollowing` y `followsMe` (TS-10b). |
| Usuarios y follow | **listos** | `GET /users/me` (+ `PATCH`), `GET /users/:id` con contadores, `followers`/`following`, `POST`/`DELETE /:id/follow`. Contrato en ESPECIFICACIONES §7. |
| Playlists y favoritos | **listos** | CRUD completo de `/api/playlists` (con las subrutas de canciones, invitación y miembros de las colaborativas) y `/api/favorites`. Contrato en ESPECIFICACIONES §8–§9. |
| Manejo de errores | con reparos | `errorHandler` mapea códigos Prisma a español. Además, `getId` y los validadores de `validation.js` lanzan con `error.code = 400` y el catch-all de `app.js` usa `res.status(err.code \|\| 500)`. Ver los avisos de §2. |

### 1.2 Lo que el frontend tiene contra la API real

`songsService`, `authService`, `usersService`, `playlistsService` y `roomsService` ya hablan contra la
API real (sesión, perfil, seguimiento, playlists/favoritos y salas migrados). **No queda ningún mock en
el repo**: `mocks/` se borró entero al cerrar el bloque de salas (2026-10-18), así que este párrafo ya
no tiene nada que migrar.

### 1.3 Los huecos, de un vistazo

Los huecos 1–4 de versiones anteriores (cliente HTTP con verbos y token, playlists/favoritos, auth
con `register` que devuelve token, endpoints de usuarios) **ya se cerraron**. Lo que sigue abierto:

| # | Hueco | Impacto |
| --- | --- | --- |
| 1 | No hay lote de canciones por id (`?ids=`) | Hidratar una playlist son N requests (REQ-SONG-1) |
| 2 | ~~No hay endpoints de salas CRUD~~; siguen faltando chat y recomendaciones | Chat (§8) y recomendaciones (§9) |
| 3 | El esquema no tiene mensajes de chat. Los votos de skip **no** necesitan esquema: quedaron en memoria (D5) | Solo el chat (§8) |
| 4 | ~~La foto de perfil se guarda como base64 en la columna `pictureUrl`~~ | **cerrado** (TS-21): `POST /api/users/me/picture` + ImageKit. Ver `PENDIENTES.md` §7 |

---

## 2. Convenciones transversales

Aplican a **todos** los endpoints nuevos. Si se cumple esto, el frontend migra sin tocar componentes
(regla 6 de `AGENTS.md`: al migrar a backend real solo se edita el contenido de `services/`).

| Tema | Regla |
| --- | --- |
| Prefijo | `/api`, sin versión. `API_BASE_URL` ya es `/api` en el frontend y el proxy de Vite apunta a `:3000`. El mount duplicado `/api/v1/auth` ya se eliminó de `app.js`. |
| Rutas | Plurales, minúsculas, sin verbos (`/api/playlists/:id/songs`, no `/api/playlists/addSong`). Las acciones que no son CRUD van como sub-recurso: `/api/rooms/:id/skip-votes`, `/api/users/:id/follow`. |
| Identidad | Sale de `req.user.sub` (el `jwt.sign` actual pone `{ sub: user.id, email, username }`), **nunca** del body ni de un query param. Ojo: en JWT `sub` es string, hay que castearlo a número para Prisma. |
| Auth | Todo lo privado exige `authenticate`. Lo público sigue abierto. |
| Ids | `Int` de Postgres (SERIAL). El backend debe tolerar que el cliente mande `"43886"` además de `43886`; conviene verificar que Prisma no rompa con un string en un campo `Int` en vez de asumirlo. |
| Errores | Dos mecanismos conviven: `prismaErrorHandler` mapea códigos Prisma a español, y los validadores de `utils/validation.js` lanzan un `Error` con `error.code = 400` que el catch-all de `app.js` traduce a `res.status(err.code \|\| 500)`. El cuerpo es `{ status: "error", message, code? }`. La validación de `register` agrega `errors: [string]` (verificado 2026-10-08); los demás 400 van solo con `message`. No encontrado, `404`. Conflicto, `409`. |
| Avisos de errores | (a) El catch-all devuelve `err.message` crudo, así que un error interno puede filtrar texto de Prisma o de SQL al cliente; (b) el status **nunca** se saca de `err.code`: Prisma, el driver de Postgres y multer usan strings (`P2025`, `ECONNREFUSED`, `LIMIT_FILE_SIZE`) y `res.status()` con un string rompe la respuesta. **Resuelto (2026-10-14):** los errores propios se crean con `httpError(status, message, code)` (`utils/errors.js`), que deja el status en `error.httpStatus` y el `code` como identificador estable de negocio; el catch-all usa `Number.isInteger(err.httpStatus) ? err.httpStatus : 500` y responde `{ status, message, code }`; (c) `P2023` quedó mapeado a **400** (verificado: `PUT /playlists/:id` con `addSongs` no numérico ya no devuelve 500; un id numérico inexistente sigue siendo 409 por `P2003`); (d) el Frontend traduce por `code` (`utils/mapError.js`) y solo muestra el `message` si el código no lo conoce, así que **cambiar un texto ya no rompe la UI**. |
| Códigos de error | Todo error de validación lleva un `code` estable en mayúsculas (`USERNAME_TAKEN`, `INVALID_IMAGE_TYPE`, `FOLLOW_REQUIRED`…). El `message` es para el humano y va en español; el `code` es el contrato. Antes de inventar uno nuevo: buscar si ya existe uno que describa lo mismo (`utils/errors.js` y `mapError.js` son las dos listas). |
| Archivos / multipart | Un endpoint que recibe un archivo va en `multipart/form-data`, con el archivo en un campo nombrado (`picture` en `POST /users/me/picture`), tipo y tamaño validados por un middleware (`middlewares/upload.middleware.js`) y **los errores de multipart reemitidos con `code = 400`** para que salgan como JSON con mensaje en español. El binario no se escribe en disco: se reenvía al servicio de almacenamiento. `express.json()` conserva su límite por defecto (100 KB); subirlo globalmente "por si acaso" expone al resto de la API. Tope actual: 2 MB, porque el body de una serverless function de Vercel corta ~4,5 MB. |
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
| `GET` | `/api/users/search?query=` | listo | Offset con `{ items, total, page, pageSize, totalPages }` (antes cursor). `items` en snake_case (`picture_url`, `genre_name`); el mapeo vive en `usersService`. Con sesión (auth opcional): relación completa por item (TS-10b) — `isFollowing` + `followsMe` |
| `GET` | `/api/users/:id` | listo | `getUserById` (perfil público, TS-08), con `followers[]`, `following[]` y contadores |
| `GET` | `/api/users` | no implementado | `listUsers`: ninguna pantalla lo pide; no hace falta |
| `PATCH` | `/api/users/me` | listo | `updateProfile`, con username 3–50 y único. `pictureUrl` solo acepta URLs `http(s)`: una data URL se rechaza con 400 |
| `POST` | `/api/users/me/picture` | listo | Subida del avatar en multipart, campo `picture`, tope 2 MB, JPG/PNG/WEBP. Requiere `IMAGEKIT_PRIVATE_KEY` (TS-21; contrato en `ESPECIFICACIONES-BACKEND.md` §7.1) |

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
| `GET` | `/api/playlists` | Las que creó el usuario del token **y** las colaborativas donde es miembro, con `creator`, `members` y `songs` ordenadas por posición. |
| `POST` | `/api/playlists` | Body `{ name, description?, isPublic?, type }`, con `type` obligatorio (`personal` o `colab`, si no `400`). `idCreator` del token. `201` con la playlist creada; si es `colab`, también la fila de miembro con rol `creator`. |
| `GET` | `/api/playlists/:id` | `404` si no es suya, no es miembro y no es pública (no `403`, para no filtrar existencia). |
| `PUT` | `/api/playlists/:id` | Body `{ name?, description?, addSongs?, removeSongs? }`. Dueño y no-favoritos; si no, `403`. |
| `DELETE` | `/api/playlists/:id` | Dueño y no-favoritos. Borrar la fuente de una sala tiene `onDelete: Restrict` en `Room`: `409` con mensaje claro, no un 500 de Prisma (sale del `errorHandler` al violar el `Restrict`; decisión **D20**: si la playlist se vacía o cambia, la sala sigue viva). |
| `POST` | `/api/playlists/:id/songs` | Body `{ songId }`. En una `personal` solo el dueño; en una `colab` cualquier miembro. `409` si ya estaba. |
| `DELETE` | `/api/playlists/:id/songs/:songId` | Misma regla de membresía. `404` si la canción no estaba. |
| `POST` | `/api/playlists/:id/invitation` | Body `{ userId }`. Solo del creador y solo sobre `colab`; `404` si esa persona no existe. |
| `GET` | `/api/playlists/:id/invitations` | Solo del creador: a quién invitó y en qué estado. |
| `DELETE` | `/api/playlists/:id/members/:userId` | Solo del creador. `400` si intenta echar a sí mismo. |
| `GET` | `/api/playlists/invitations` | Invitaciones **pendientes** del usuario del token. |
| `POST` | `/api/playlists/invitations/:idPlaylist/accept` | `201`; inserta el miembro `colaborator` y marca la invitación en la misma transacción. |
| `POST` | `/api/playlists/invitations/:idPlaylist/reject` | `200`; marca la invitación como rechazada. |

`members` viaja incluido en `GET /` y `GET /:id`, así que no hace falta un `/members` de solo lectura.

- [x] `name` no vacío y de largo `<= 50`; si no, `400`, no un 500 de Prisma (verificado).
- [x] `type` lo manda el cliente y es obligatorio; el controller lo valida (`400 PLAYLIST_TYPE_INVALID`).
- [x] `members` de las colaborativas, con rol, en la respuesta de `GET /` y `GET /:id`.

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

### [x] REQ-SONG-4 — `album`: columna o fuera del contrato

**Resuelto: entra al esquema y al contrato.** El modelo `Album` llegó con el feature de álbumes (migración
`20261015215159_add_album`), con `Song.idAlbum` obligatorio y un índice por álbum.

- `SONG_INCLUDE` trae `album: { id, name }`, así que todas las respuestas de canción lo llevan.
- El filtro de búsqueda matchea también el nombre del álbum.
- `songsService.toSong()` dejó de hardcodear `album: null`: ahora `PlayerBar` usa el nombre real como
  `alt` de la carátula.
- El copy de `SearchSongs` volvió a decir "Buscá por título, artista, género o álbum", que era lo que pedía
  el comentario del propio archivo.
- `source` sigue fuera: no existe en el esquema y la línea "Reproduciéndose desde" se oculta si no viene.

Verificado contra la base real: `GET /api/songs/search?query=Woods` devuelve las 3 canciones del álbum
"Woods of Chaos", y cada canción trae `album: { id: 888, name: "Woods of Chaos" }`.

### [x] REQ-ALBUM-1 — Endpoints de álbumes

Cubre la pantalla `/albums` del Sidebar, que hasta ahora era un placeholder.

- [x] Listado paginado con filtro por nombre de disco o de artista: `GET /api/songs/search?type=albums`,
      reutilizando la paginación por offset de §2. Cada item trae `artist` y `_count.songs`.
- [x] `type` validado: `songs` o `albums`, y cualquier otro valor es `400 SEARCH_TYPE_INVALID` (venía
      devolviendo 500 por una variable sin definir).
- [x] Detalle: `GET /api/albums/:id` → `{ status, album }` con `artist` y `songs[]`; `404 ALBUM_NOT_FOUND`,
      `400 INVALID_ID`. Sin sesión, igual que `/api/songs`.
- [x] Frontend: `albumsService.js` con su mapper, grilla `/albums` paginada (`?page=`, sin input: la
      búsqueda de discos vive en `/buscar`), y detalle con "Reproducir" sobre la cola del `PlayerContext`.
- [x] **Los álbumes se buscan desde `/buscar`**, no desde una pantalla propia: nueva pestaña `?tipo=albumes`
      (`SearchAlbums`), que reutiliza `listAlbums` y comparte `?q=`/`?page=` con canciones y personas.
- [x] Sin migración: el modelo ya estaba.

**Lo que quedó fuera:** el orden de las pistas es por `id` porque el esquema no tiene número de track.
Los artistas se agregaron después como recurso propio (`GET /api/artists` + `/artistas/:id`; ver
`PENDIENTES.md` §12).

> Nota: `SearchAlbums` pagina de a 10, igual que `SearchSongs`, porque las dos pestañas usan la misma grilla de
> `MiniMediaCard`. La página `/albums` usa 12 (`ALBUMS_PAGE_SIZE`), ya que ahí no compite con otra pestaña.

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

## 7. Salas (P1 → P2) — entregado 2026-10-18

> **Contrato vigente:** `ESPECIFICACIONES-BACKEND.md` §10 es la fuente canónica (request/response,
> errores y `curl`). Esto es el resumen de lo que quedó implementado y de las decisiones que hubo que
> tomar para llegar ahí. Verificado contra la base real: 80 chequeos de API y 9 de socket
> (`PENDIENTES.md` §5.6b, plan en `docs/plan/sprint-2-salas-plan.md`).

El esquema impone **`Room.idPlaylistSource`** (`onDelete: Restrict`): no hay sala sin playlist de
origen, y borrar esa playlist con una sala viva da `409` (decisión **D20**: si la playlist se vacía o
cambia, la sala no se invalida).

| Método | Ruta | Notas |
| --- | --- | --- |
| `GET` | `/api/rooms` | Auth opcional. Query `query` (texto libre), `sort = name` (default, alias `alphabetical`) \| `rating`, `order = asc` (default) \| `desc`. Devuelve **array plano**, columnas explícitas (nunca `room.*`: filtraría `password_hash`), **solo públicas y activas**. `sort`/`order` inválidos → `400 INVALID_SORT` / `INVALID_ORDER`. |
| `GET` | `/api/rooms/mine` | Auth. Las salas **activas** de las que el usuario es miembro, mismo shape, **incluye las privadas** (a esas se entra con el código). Alimenta el grupo "Mis Salas" del Sidebar. |
| `POST` | `/api/rooms` | Body `{ name, description?, playlistId, isPrivate, password? }`. `maxCapacity` lo fija el server en **10** (no es editable) y el `code` lo genera el server (`VarChar(20)` único); `status` arranca `activa` y el creador entra como `host`. Acepta playlist propia **o** colaborativa de la que sea miembro (**D19**, no valida `type`): 404 si no existe, 403 si no tiene acceso, 400 si no tiene canciones. **Nunca devuelve `passwordHash`.** |
| `POST` | `/api/rooms/join` | Body `{ code, password? }`. `201` si se unió, `200` si ya era miembro; `404` código inexistente, `403` contraseña, `400` sala cerrada, `409` llena. |
| `GET` | `/api/rooms/:id` | Auth. Misma sala que `POST /`, más `viewerHasRated` y `viewerRating`. `403` si no sos miembro (no `404`, para no filtrar existencia), `404` si no existe. |
| `POST` | `/api/rooms/:id/leave` | `204`. **Si sale el anfitrión, la sala se cierra** (decisión **D6**, plan: D16). |
| `DELETE` | `/api/rooms/:id` | Solo el anfitrión. `204`: pone `status = cerrada`, limpia el estado de reproducción en memoria y emite `room:closed`. **`status` no es editable desde el cliente**, por eso cerrar es `DELETE` y no `PATCH` (decisión **D15** del plan de salas). |
| `DELETE` | `/api/rooms/:id/members/:userId` | Solo el anfitrión. `204`; `400` si se saca a sí mismo, `403` si no es host. Borra la fila de `room_member` y emite `room:kicked` solo al canal `user:<id>` del expulsado. |
| `POST` | `/api/rooms/:id/playback` | Solo el anfitrión. Body `{ action: play \| pause \| next \| stop }` → `200 { status, playback }`. |
| `GET` | `/api/rooms/:id/playback` | Auth (403 si no es miembro) → `{ status, playback, skipVotes }`. |
| `POST` | `/api/rooms/:id/skip-votes` | `201 { status, skipVotes, approved }`; `403` si vota el anfitrión, `409` si ya votó, `400` sin canción en curso. |
| `POST` | `/api/rooms/:id/rating` | Body `{ rating }` 1–5. `201 { status, rating }`; `403` si es el anfitrión o no es miembro, `409` si ya calificó (`HOST_ALREADY_RATED`). |

**Endpoints que no existen** (y no hacen falta): `PATCH /api/rooms/:id`, `POST /api/rooms/:id/close`
(el cierre es `DELETE`) y `GET /api/rooms/:id/members` (`members[]` viaja dentro del payload de la
sala, igual que en playlists).

- [x] **Dónde viven los votos de skip — D5 de esta hoja resuelta** (D8′ y D17 del plan de salas): **en
      memoria del proceso** (`Backend/src/realtime/roomState.js`), no en Postgres. Son estado efímero de
      la reproducción (se reinician al cambiar de canción) y guardarlos en la base sería modelar basura.
      Sale junto con el transporte de §8 y arrastra sus límites: una sola instancia, se pierden al
      reiniciar y exige un backend Node persistente (no corre en serverless).
- [x] **Puntaje promedio para ordenar salas — resuelto:** `AVG(host_rating.rating)` por anfitrión,
      promedio **simple**, no ponderado por cantidad de votos (vista `HostAvgRating`). Llega como
      `avg_rating`, que es `numeric` de Postgres y por lo tanto un **string**; el backend lo coalescea
      a `0` cuando nadie calificó, y el frontend lo traduce a `null` (= "Sin calificaciones").

---

## 8. Chat y sincronización de reproducción (P2)

**Transporte decidido y ya implementado para la sincronización:** Socket.IO sobre el mismo servidor
HTTP, con handshake por JWT (contrato en `ESPECIFICACIONES-BACKEND.md` §10.1). Lo que sigue abierto es
el chat en sí.

- [x] **Sincronización de reproducción: resuelta.** La sala sabe qué canción está sonando y en qué
      segundo (`GET|POST /api/rooms/:id/playback`), con la posición en memoria del servidor y
      corrección de deriva en el cliente. Hoy la posición de la cola en el player sigue siendo estado
      del cliente (`PlayerContext`), pero en sala la que manda es la del servidor.
- [ ] **El esquema no tiene mensajes de chat.** `Content` y `ContentPlayement` son para contenido con
      canción opcional, no para mensajes de sala. Hace falta una tabla `room_message`, o decidir que el
      chat es efímero y vive solo en el servidor. Es lo único que sigue bloqueando acá (**D8**): el
      transporte ya está decidido, falta la persistencia de los mensajes.
- [x] El WebSocket dejó de ser una decisión abierta de `AGENTS.md` §5; de ese apartado solo quedó el
      chat.

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
- [ ] `Mood` y `SongMood` ya están sembrados (4 estados de ánimo), así que el filtro por estado de ánimo
      tiene soporte de datos aunque el resto no.

---

## 10. Decisiones abiertas (bloquean endpoints)

Ninguna de estas se puede implementar sin resolverla antes.

> **Ojo con la numeración:** los `D1`–`D11` de **esta hoja** son una serie propia (migración del
> frontend a la API) y **no son los mismos** que los `D1`–`D25` de `docs/plan/sprint-2-plan.md` y
> `docs/plan/sprint-2-salas-plan.md`, que tienen otro significado para el mismo número (por ejemplo,
> el `D5` de esta hoja son los votos de skip; el `D5` del plan de sprint es "crear calificaciones de
> anfitrión"). Las decisiones del bloque de salas están tomadas y viven en el plan de salas §2.

| # | Decisión | Estado | Afecta a | Bloquea |
| --- | --- | --- | --- | --- |
| D1 | ¿Favoritos como tabla `favorite` o como playlist materializada? | **resuelta**: tabla `favorite` única fuente, playlist virtual en el cliente (§4.1) | §4.1 | Toda la API de favoritos (ya migrada) |
| D2 | ¿"Mis Favoritos" es compartible? Si sí, hace falta la playlist de verdad | abierta | §4.1 | TS-12 |
| D3 | ¿`source` lo calcula el frontend? (recomendado: sí) | abierta, **fuera del backend** (REQ-SONG-3) | §5 | Cierra PENDIENTES 5.4 |
| D4 | ¿`album` entra al esquema o queda fuera? | **resuelta: entra** (modelo `Album` + filtro + payload; REQ-SONG-4 y REQ-ALBUM-1) | §5 | Copy y filtro de búsqueda |
| D5 | ¿Dónde viven los votos de skip? | **resuelta: en memoria del proceso** (no en Postgres), junto con la reproducción (§7) | §7 | — (TS-18 entregado) |
| D6 | ¿El host que sale de una sala la deja o la cierra? | **resuelta: la cierra** (D16 del plan de salas) | §7 | — (`POST /rooms/:id/leave` ya existe) |
| D7 | ¿Se revocan los tokens al hacer logout? | abierta | §3 | `POST /auth/logout` real |
| D8 | ¿Chat por WebSocket, con mensajes persistentes o efímeros? | **transporte decidido (Socket.IO)**; sigue abierta la persistencia de los mensajes | §8 | Chat de salas |
| D9 | ¿Librería de validación para los endpoints nuevos? Hoy `utils/validation.js` es a mano | abierta | §2, todos | Consistencia de los `400` |
| D10 | ¿CORS con lista explícita de orígenes para el APK? | abierta | §2 | Build de producción |
| D11 | ¿`/api/users/search` pasa a offset o el frontend se adapta al cursor? | **resuelta**: offset, igual que `/songs/search` | §2, REQ-USER-1 | `SearchPeople` (ya funciona) |

Las decisiones **D12 en adelante** (privacidad, capacidad, playlist de origen, votos, rating, etc.) no
se listan acá: están tomadas y documentadas en `docs/plan/sprint-2-salas-plan.md` §2, que es el plan
del bloque de salas.

---

## 11. Orden sugerido de incorporación

Cada bloque se puede entregar solo. La regla es: al terminar uno, el mock que reemplaza se borra (o queda
sin imports, como pasó con `mocks/songs.js`) y se actualizan las casillas.

1. **[x] REQ-HTTP-1 + REQ-AUTH-1/2/3 + REQ-USER-1** → la sesión y el perfil salen del mock. Es el bloque que
   desbloquea todo lo demás y el que más riesgo tiene (ids, tokens, forma del user).
2. **[x] REQ-PLAYLIST-1/2/3 + D1** → TS-09 pasa de `localStorage` a la base.
3. **[ ] REQ-SONG-1/2** → hidratar playlists sin N requests.
4. **[x] Follow + perfil** → TS-10.
5. **[x] Salas** → entregado 2026-10-18, con la **D5** y la **D6** de esta hoja ya resueltas. Fue el
   bloque más grande: cuatro fases (listado, ciclo de vida, realtime, skip + rating) y ocho ramas.
6. **[ ] WebSocket + chat** → el WebSocket ya está (sincronización de salas, §8); falta el chat, cuando
   cierre D8.
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
| TS-11 Calificar anfitrión | **hecho** (`POST /rooms/:id/rating`, verificado 2026-10-18) | — |
| TS-12 Playlist colaborativa | `PlaylistMember` | **hecho** (B5, B8 y F4/F7 verificados contra la base real) |
| TS-13 Invitar a colaborativa | `PlaylistInvitation` + endpoints de invitación | **hecho** (invitación dirigida con Aceptar/Rechazar, verificada contra la base real) |
| TS-14/15/16 Salas | **hecho** (§7 completo, con la **D5** y la **D6** de esta hoja ya resueltas) | — |
| TS-17 Ordenar salas por calificación | **hecho** (`AVG(host_rating)` en la vista `HostAvgRating`) | — |
| TS-18 Votar skip | **hecho** (votos en memoria, `POST /rooms/:id/skip-votes`) | — |
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
