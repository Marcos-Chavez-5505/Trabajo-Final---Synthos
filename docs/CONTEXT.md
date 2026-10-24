# CONTEXTO DE PROYECTO â€” SYNTHOS

## 1. QuÃ© es

Monorepo de **SYNTHOS**, app de música social (tipo Spotify con capa social). Estructura actual (post reestructura):

- `backend/` — API REST (Express + Prisma + PostgreSQL). Fuera de workspaces.
- `frontend/` — SPA React (Vite + Tailwind). Solo UI + adaptadores web.
- `shared/` — paquete `@synthos/shared`: lógica de negocio compartida (sin DOM/CSS/router).
- `mobile/` — App Expo (scaffold Fase 7; solo login).
- Raíz: `package.json` con workspaces `["frontend","shared","mobile"]`.

Ver `AGENTS.md` sección "Estructura del monorepo (raíz)" y "Adaptadores".

Idioma de dominio, UI, comentarios, nombres de archivos y mensajes de error: **espaÃ±ol**. Las ramas y commits tambiÃ©n (ver Â§8).

## 2. Estructura del repo

```
/
â”œâ”€â”€ Backend/
â”‚   â”œâ”€â”€ docker-compose.yml        # postgres:17 (5432) + pgadmin (8080)
â”‚   â”œâ”€â”€ prisma.config.ts          # schema, migrations, seed
â”‚   â”œâ”€â”€ prisma/
â”‚   â”‚   â”œâ”€â”€ schema.prisma         # modelo completo + vistas
â”‚   â”‚   â”œâ”€â”€ data/songs.json       # catÃ¡logo para seed
â”‚   â”‚   â”œâ”€â”€ seed.js               # catÃ¡logo (artist/song/genre/mood)
â”‚   â”‚   â”œâ”€â”€ seedRooms.js          # salas + host_rating de prueba
â”‚   â”‚   â”œâ”€â”€ migrations/           # 6 migraciones
â”‚   â”‚   â””â”€â”€ views/public/*.sql    # user_genre_counts, user_top_genre
â”‚   â””â”€â”€ src/
â”‚       â”œâ”€â”€ index.js              # arranca el server (PORT || 3000)
â”‚       â”œâ”€â”€ app.js                # express + rutas + middlewares de error
â”‚       â”œâ”€â”€ routes/*.js           # 6 routers
â”‚       â”œâ”€â”€ controller/*.js       # 7 controllers (HTTP: valida + formatea)
â”‚       â”œâ”€â”€ services/*.js         # services (Prisma + lÃ³gica; image.service = ImageKit)
â”‚       â”œâ”€â”€ middlewares/          # auth.middleware (JWT), upload.middleware (multipart), errorHandler (Prisma)
â”‚       â”œâ”€â”€ utils/validation.js   # validadores compartidos
â”‚       â”œâ”€â”€ utils/errors.js       # httpError(status, message, code) â€” contrato de errores
â”‚       â”œâ”€â”€ prisma/prismaClient.js# singleton con adapter-pg
â”‚       â”œâ”€â”€ const/baseUrl.js      # "localhost:3000/api/v1" (huÃ©rfano, no se usa)
â”‚       â””â”€â”€ db/schema.sql         # DDL de referencia (no es la fuente: lo es schema.prisma)
â”œâ”€â”€ Frontend/
â”‚   â”œâ”€â”€ components.json           # config shadcn (style base-nova, css: src/index.css)
â”‚   â”œâ”€â”€ vite.config.js            # alias @ â†’ ./src, proxy /api â†’ localhost:3000
â”‚   â””â”€â”€ src/                      # ver Â§4
â”œâ”€â”€ docs/                         # (excluido de este contexto salvo ESPECIFICACIONES-BACKEND)
â”œâ”€â”€ AGENTS.md                     # reglas del repo
â””â”€â”€ .github/PULL_REQUEST_TEMPLATE.md
```

## 3. Backend

**Stack:** Express **5** (CommonJS, `"type": "commonjs"`), Prisma **7** con `@prisma/adapter-pg`, PostgreSQL 17, `bcrypt`, `jsonwebtoken`, `cors`, `dotenv`, `multer` (multipart), `@imagekit/nodejs` (fotos de perfil), `nodemon` (dev). `mongoose` estÃ¡ en dependencies pero **no se usa en ningÃºn lado**.

**Scripts:** `npm run dev` (nodemon, NODE_ENV=development), `npm start`, `vercel-build` (`prisma generate`). No hay tests (`npm test` es el stub de npm).

**Capas:** `routes â†’ controller â†’ service â†’ prisma`. Los controllers solo validan HTTP (`req.params/query/body`, `req.user.sub`) y devuelven status; la lÃ³gica y las queries viven en `services/`. NingÃºn `fetch`/query fuera de services.

**Auth:** JWT Bearer. `authenticate` (`middlewares/auth.middleware.js`) decodifica con `JWT_SECRET` y deja el payload en `req.user`; el id del usuario es **`req.user.sub` y llega como nÃºmero** (`signToken` mete `user.id` de Prisma tal cual), asÃ­ que se puede comparar directo contra las columnas `Int`. `optionalAuthenticate` (mismo archivo) deja `req.user = null` si no viene header y solo 401 si el token estÃ¡ presente pero es invÃ¡lido: lo usan endpoints pÃºblicos que enriquecen su respuesta con sesiÃ³n (`GET /users/search`). `signToken` en `auth.controller.js`: payload `{ sub, email, username }`, expiraciÃ³n `JWT_EXPIRES_IN || "7d"`.

**Errores:** `middlewares/errorHandler.js` mapea cÃ³digos Prisma a HTTP con mensajes en espaÃ±ol:
`P2000/P2005/P2006/P2007/P2009/P2011/P2012/P2013/P2023 â†’ 400`, `P2002 â†’ 409` (incluye los campos en conflicto), `P2003/P2014 â†’ 409`, `P2001/P2015/P2025 â†’ 404`, `P2008/P2010 â†’ 500`; cualquier otro â†’ 500. En development agrega `meta`/`details`. DetrÃ¡s hay un handler unhandled que responde `{ status:"error", message, code? }`: el status sale de `error.httpStatus` (nunca de `error.code`, porque Prisma, el driver y multer usan strings) y **solo se loguea lo que es 500 o mÃ¡s**.

**CÃ³digos de error (`utils/errors.js`):** los errores de validaciÃ³n se crean con
`httpError(status, message, code, extra?)`, que deja el status en `error.httpStatus` y un `code` de
negocio **string y estable** (`USERNAME_TAKEN`, `IMAGE_TOO_LARGE`, `FOLLOW_REQUIRED`â€¦), que es lo que
viaja en el body. Los controllers lanzan en vez de armar el JSON a mano. El Frontend traduce por `code`
(`utils/mapError.js`), asÃ­ que cambiar la redacciÃ³n de un mensaje no rompe ninguna pantalla. `extra`
sirve para campos aparte del error, como el `errors[]` del registro.

**Forma de respuesta (parcialmente inconsistente â€” respetar la que ya tiene cada endpoint):**

- Envolvente `{ status: "success"|"error", ... }` en auth, users, favorites, playlists, follow.
- Payload crudo (sin envolvente) en `songs` y `rooms`.
- Errores: siempre `{ status:"error", message, code? }`, mÃ¡s `errors[]` u otros campos cuando el error los trae (`httpError(..., extra)`).

### 3.1 Endpoints vigentes (`app.js`, todo bajo `/api`)

```
GET    /api/health                     â†’ { status: "ok" }

POST   /api/auth/register              â†’ 201 { token, user }   (valida email/username/password)
POST   /api/auth/login                 â†’ 200 { token, user }
POST   /api/auth/logout                â†’ authenticate

GET    /api/songs?cursor=              â†’ { songs[10], nextCursor, hasMore }   (cursor, orden id asc)
GET    /api/songs/search?query=&type=songs|albums&page=&pageSize=  â†’ { items, total, page, pageSize, totalPages } (400 SEARCH_TYPE_INVALID si `type` no es `songs` ni `albums`; con `type=albums` cada item es un Ã¡lbum con `artist` y `_count.songs`)
GET    /api/songs/recommendations?expression=     â†’ { status, songs } por estado de Ã¡nimo (400 si la expresiÃ³n no es un mood vÃ¡lido)
GET    /api/songs/popular              â†’ { status, week: {from,to}, minimumFavorites, songs[] } con `favoriteCount` por canciÃ³n. Ranking de la semana en curso (lunes 00:00 a lunes 00:00 UTC) sobre `favorite.markedDate`, contando usuarios distintos; solo entran las que llegan a 3
GET    /api/songs/:id                  â†’ song (findUniqueOrThrow)
GET    /api/albums/:id                 â†’ 200 { status, album } con `artist` y `songs[]` | 400 INVALID_ID | 404 ALBUM_NOT_FOUND
GET    /api/artists?query=&page=&pageSize=  â†’ { items, total, page, pageSize, totalPages } con `_count.albums` y `_count.songs` (orden name asc)
GET    /api/artists/:id                â†’ 200 { status, artist } con `_count` y `albums[]` | 400 INVALID_ID | 404 ARTIST_NOT_FOUND

GET    /api/users/search?query=&page=&pageSize=  â†’ { items, total, page, pageSize, totalPages } (auth opcional; con sesiÃ³n cada item suma isFollowing y followsMe)
GET    /api/users/me                   â†’ authenticate
PATCH  /api/users/me                   â†’ authenticate (username/biography/pictureUrl; pictureUrl solo URL http(s), una data URL da 400)
POST   /api/users/me/picture           â†’ authenticate, multipart campo `picture` (JPG/PNG/WEBP, â‰¤2MB) â†’ usuario con la URL de ImageKit (400 archivo/tipo/tamaÃ±o, 500 si falla la subida)
GET    /api/users/:id                  â†’ usuario + followers[] + following[] + followerCount + followingCount
GET    /api/users/:id/followers        â†’ { followers: [user] }
GET    /api/users/:id/following        â†’ { following: [user] }
POST   /api/users/:id/follow           â†’ authenticate (idempotente, 200 aunque ya siga)
DELETE /api/users/:id/follow           â†’ authenticate (404 si no seguÃ­as)
GET    /api/users/:id/follow-status    â†’ authenticate â†’ { viewerFollows, targetFollows, isMutual } (el frontend no lo consume hoy)
GET    /api/users/:id/recommendations  â†’ authenticate â†’ { status, recommendations } (dueÃ±o ve las recibidas, emisor solo las suyas; un tercero recibe [])
POST   /api/users/:id/recommendations  â†’ authenticate, body { songId, text } â†’ 201 (400 texto/canciÃ³n, 403 sin follow mutuo, 404 usuario o canciÃ³n)

GET    /api/favorites                  â†’ authenticate â†’ { playlist, songs }
GET    /api/favorites/songs/ids        â†’ authenticate â†’ { songIds: number[] }
POST   /api/favorites/songs            â†’ authenticate, body { songId } â†’ 201 (409 si ya existe, 404 si no existe la canciÃ³n)
DELETE /api/favorites/songs/:songId    â†’ authenticate (404 si no estaba)

GET    /api/playlists                  â†’ authenticate â†’ { playlists } (las que creÃ³ y las colab donde es miembro)
GET    /api/playlists/:id              â†’ authenticate (404 si no es suya, no es miembro y no es pÃºblica)
POST   /api/playlists                  â†’ authenticate, { name (â‰¤50), description?, isPublic?, type? } â†’ 201 ("colab" o "personal"); `type` obligatorio (400 PLAYLIST_TYPE_INVALID)
PUT    /api/playlists/:id              â†’ authenticate, dueÃ±o, NO favorites; body { name?, description?, addSongs?, removeSongs?, reorder? }
DELETE /api/playlists/:id              â†’ authenticate, dueÃ±o, NO favorites
POST   /api/playlists/:id/songs        â†’ authenticate â†’ 201 { song } (403 NOT_PLAYLIST_OWNER / NOT_PLAYLIST_MEMBER, 409 si ya estaba)
DELETE /api/playlists/:id/songs/:songId â†’ authenticate â†’ 200 (404 si no estaba, 403 si no sos miembro)
POST   /api/playlists/:id/invitation   â†’ authenticate, body { userId } â†’ 201 { invitation, converted } (403 si no es el creador, 400 si es la de favoritos o uno mismo, 404 si no existe la playlist o la persona, 409 si ya es miembro; `converted: true` si la playlist pasÃ³ de `personal` a `colab`)
GET    /api/playlists/:id/invitations   â†’ authenticate, solo el creador â†’ { invitations }
DELETE /api/playlists/:id/members/:userId â†’ authenticate, solo el creador â†’ 200 (404 si no era miembro, 400 si es el creador)
GET    /api/playlists/invitations      â†’ authenticate â†’ { invitations } (las pendientes recibidas)
POST   /api/playlists/invitations/:idPlaylist/accept â†’ authenticate â†’ 201 (404 si no hay pendiente)
POST   /api/playlists/invitations/:idPlaylist/reject â†’ authenticate â†’ 200 (404 si no hay pendiente)

GET    /api/rooms?query=&sort=name|rating&order=asc|desc  â†’ array crudo con columnas explÃ­citas de `room` + `host_id`, `host_username`, `avg_rating` (string), `members_count`, `songs_count`. Solo pÃºblicas y activas
GET    /api/rooms/mine       â†’ authenticate; mismo shape, de las salas activas del usuario (incluye privadas)
POST   /api/rooms            â†’ authenticate, { name, description?, playlistId, isPrivate, password? } â†’ 201 { status, room } con `members[]` y `playlistSource.songs`. Acepta playlist propia **o** de una colab de la que sea miembro (D19); exige â‰¥1 canciÃ³n. `maxCapacity` siempre 10, el `code` lo genera el server. Nunca devuelve `passwordHash`
POST   /api/rooms/join       â†’ authenticate, { code, password? } â†’ 201 (200 si ya era miembro); 404 cÃ³digo inexistente, 403 contraseÃ±a, 400 cerrada, 409 llena
GET    /api/rooms/:id        â†’ authenticate (403 no miembro, 404 no existe) â†’ { status, room } con `members[]`, `hostAvgRating`, `viewerHasRated` y las canciones de la fuente
POST   /api/rooms/:id/leave  â†’ authenticate â†’ 204 (si sale el anfitriÃ³n, **cierra la sala**)
DELETE /api/rooms/:id        â†’ authenticate, solo host â†’ 204 (cierra y emite `room:closed`)
DELETE /api/rooms/:id/members/:userId â†’ authenticate, solo host â†’ 204 (400 si se saca a sÃ­ mismo, 403 si no es host)
POST   /api/rooms/:id/playback   â†’ authenticate, solo host, { action: play|pause|next|stop } â†’ 200 { status, playback }
GET    /api/rooms/:id/playback   â†’ authenticate (403 no miembro) â†’ { status, playback, skipVotes }
POST   /api/rooms/:id/skip-votes â†’ authenticate â†’ 201 { status, skipVotes, approved }; 403 si es el host, 409 si ya votÃ³, 400 sin canciÃ³n
POST   /api/rooms/:id/rating     â†’ authenticate, { rating } 1â€“5 â†’ 201 { status, rating }; 403 si es el host o no es miembro, 409 si ya calificÃ³
```

**Endpoints que NO existen todavÃ­a** (los espera el frontend o el plan): **chat de salas** (no hay tabla `room_message` ni eventos que lo transmitan), contenidos (`Content`/`ContentPlayement` sin rutas), refresh de token, logout server-side real (logout solo responde OK). Las salas y las playlists colaborativas estÃ¡n completas de punta a punta; artistas ya tiene recurso propio (`GET /api/artists`).

**Salas â€” sincronizaciÃ³n (Socket.IO, `src/realtime/` + `src/index.js`):** el handshake se autentica con el JWT en `socket.handshake.auth.token` (rechaza si falta o venciÃ³) y cada socket entra solo a `user:<id>`; entrar a una sala es `join-room`, que el servidor valida contra `room_member` antes de sumar el socket a `room:<id>`. Eventos: `joined-room`, `room:playback`, `room:members`, `room:skip-votes`, `room:rating`, `room:kicked`, `room:closed`. **Los clientes solo escuchan**: el estado cambia por REST y el servidor emite. El mute/silencio es **local por dispositivo** (`PlayerContext.isMuted` â†’ `audio.muted`): no viaja por el socket y cada miembro, incluido el anfitriÃ³n, silencia solo su propio audio. El estado de reproducciÃ³n y los votos viven en **memoria del proceso** (`src/realtime/roomState.js`), una sola instancia, y se pierden al reiniciar; `positionMs` va congelado en `updatedAt` (hora del servidor) y la posiciÃ³n real mientras suena es `positionMs + (Date.now() - updatedAt)`. **Exige backend Node persistente**: una funciÃ³n serverless no sostiene el handshake.

### 3.2 Validaciones (`utils/validation.js`)

- `getId(req)` â†’ lanza error con `code = 400` si el id no es nÃºmero â‰¥ 0.
- `validateQuery` (string no vacÃ­o), `validateCursor` (number | null).
- `validateSortType` â†’ `"alphabetical" | "name" | "rating"` (el backend normaliza `alphabetical` a `name`); `validateOrderType` â†’ `"asc" | "desc"`.
- `validateRegisterInput` â†’ email regex, username 3â€“50, password â‰¥8 con al menos una letra y un nÃºmero.

### 3.3 Modelo de datos (`prisma/schema.prisma`)

Tablas mapeadas a snake_case (`@@map`, `@map`), claves compuestas como `@@id([a, b])`.

- **User**: `email` unique, `username` unique (â‰¤50), `passwordHash`, `pictureUrl?`, `biography?`, `registrationDate`.
- **Artist / Song** (`Song.idArtist` FK, `url` NOT NULL, `duration?`, `coverUrl?`, `releaseDate?`) / **SongArtist**, **Genre/SongGenre**, **Mood/SongMood** (ambos joins con cascade).
- **Playlist**: `type: PlaylistType { personal | colab | favorites }`, `isPublic`, `idCreator` (cascade). `PlaylistMember` con `PlaylistRole { creator | colaborator }`: al crear una `colab` se inserta la fila del `creator` (tambiÃ©n al convertir una `personal` al invitar) y `POST /playlists/invitations/:id/accept` inserta la del `colaborator`. `PlaylistInvitation` PK `[idPlaylist, idReceiver]` + `InvitationStatus { pendiente | aceptada | rechazada }` (migraciones `20261015203304_playlist_invitation` y `..._drop_token_invitation`); las dos relaciones a `User` van con nombre (`InvitationSender`, `InvitationReceiver`). `PlaylistSong` PK `[idPlaylist, idSong]` + `position`, `addedBy?`. **Ya no existe la columna `token_invitation`**: era del flujo por link que ya no existe.
- **Favorite**: PK `[idUser, idSong]`.
- **Follow**: PK `[followerId, followedId]` (hay CHECK de no auto-seguirse mencionado en el frontend).
- **Content / ContentPlayement**: tienen rutas de lectura/escritura de recomendaciones (TS-19); `ContentPlayement` es donde vive el destinatario de una recomendaciÃ³n. `SongMood` + `Mood` alimentan `GET /songs/recommendations`.
- **Room**: `code` unique (â‰¤20), `name`, `idPlaylistSource` NOT NULL FK playlist, `isPrivate`, `passwordHash?`, `maxCapacity`, `status: RoomStatus { activa | cerrada }`, `expiresAt?`. `RoomMember` con `RoomRole { host | member }`. `HostRating` PK `[idRoom, idRater, idHost]`, `rating SmallInt`.
- **Vistas** (preview `views`): `user_genre_counts`, `user_top_genre` (usada por `searchUsers`), `HostAvgRating` â†’ mapeada a `host_avg_rating` (`AVG(host_rating.rating)` por `id_host`, creada a mano por la migraciÃ³n `20261013164336`; la usa el raw SQL de salas y el promedio del anfitriÃ³n).

**Semillas:** `prisma.config.ts` â†’ `db seed` corre `seed.js && seedRooms.js && seedUsers.js` (idempotentes). `seed.js` puebla artista/canciones/gÃ©neros/moods desde `prisma/data/songs.json` (descarta canciones sin gÃ©nero o mood). `seedRooms.js` crea 5 anfitriones + 3 raters (contraseÃ±a **`Demo1234`**), playlists fuente, salas y `host_rating` (escala 1â€“5) para que el orden por rating sea comprobable. `seedUsers.js` suma usuarios, follows, favoritos, playlists y recomendaciones; incluye un bloque `POPULAR_SONGS` con canciones marcadas por 3+ personas distintas y `markedDate` refrescado a la semana actual para que `/populares` tenga datos.

**Env:** `DATABASE_URL`, `POSTGRES_USER/PASSWORD/DB`, `PGADMIN_DEFAULT_EMAIL/PASSWORD`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `IMAGEKIT_PRIVATE_KEY` (`.env.example`; el `.env` local solo tiene las primeras + `JWT_SECRET` + `IMAGEKIT_PRIVATE_KEY`). **La clave de ImageKit es opcional en el arranque**: `services/image.service.js` instancia el cliente de forma perezosa, asÃ­ que sin la var el server levanta y solo falla la subida de fotos (500 con mensaje en espaÃ±ol). Ya no hace falta `FRONTEND_URL`: era para armar el link de invitaciÃ³n, que se eliminÃ³ con el flujo por token.

**Setup local:** `docker compose up -d` â†’ `npx prisma migrate dev --name x` â†’ `npx prisma db seed` â†’ `npm run dev` (pgadmin en localhost:8080, `npx prisma studio` como alternativa).

## 4. Frontend

**Stack:** React **19**, Vite **8**, Tailwind **4** vÃ­a `@tailwindcss/vite` (sin tailwind.config: config en CSS), `react-router-dom` **7**, `@base-ui/react` (primitivas) + primitivas estilo **shadcn** (`components/ui/*.tsx`, style `base-nova`), `class-variance-authority`, `clsx`/`tailwind-merge` (`cn` en `lib/utils.ts`), `lucide-react` (deuda: ver Â§7), `oxlint` como linter. Mezcla de `.jsx` (app) y `.tsx/.ts` (ui de shadcn, hooks `use-mobile.ts`).

**Scripts:** `npm run dev` | `build` | `lint` (oxlint) | `preview`. Alias `@ â†’ src`. Proxy Vite: `/api â†’ http://localhost:3000`.

**Punto de entrada** (`main.jsx`): `AuthProvider > PlayerProvider > BrowserRouter > App`. `AppRoutes` decide.

### 4.1 Capa de red

`services/api.js` es el **Ãºnico** lugar que hace `fetch`:

- Base relativa `API_BASE_URL = '/api'` (funciona con el proxy de dev y con reverse proxy en prod; nunca hardcodea el host).
- Token en memoria (`setAuthToken`), se setea desde `authService`; `Authorization: Bearer` automÃ¡tico.
- `setUnauthorizedHandler(cb)`: un 401 **con token** limpia sesiÃ³n una sola vez; un 401 sin token (login fallido) es un error normal.
- `buildUrl` descarta `undefined/null/''` de los query params (el backend distingue `?query=` de ausente).
- 204 â†’ `null`; no-2xx â†’ lanza `ApiError { message, status, code }` (el mensaje viene del backend y se muestra tal cual en la UI, salvo que `utils/mapError.js` lo traduzca por `code`).
- Helpers: `get/post/patch/put/del` + `postForm` (multipart: si el body es `FormData` va crudo y sin `Content-Type`, para que el browser ponga el `boundary`).
- `utils/mapError.js` traduce los errores **por `code`** (el identificador estable del backend) y cae al `message` del servidor solo si el cÃ³digo no lo conoce.

### 4.2 Services (uno por dominio, Ãºnico punto de traducciÃ³n de contratos)

| Archivo                 | Expone                                                                                                                                                                                                 | Notas                                                                                                                                                                                                                                                                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `authService.js`      | `registerUser`, `loginUser`, `logoutUser`, `getCurrentUser`, `clearSession`                                                                                                                  | SesiÃ³n en`localStorage['synthos_auth'] = {token, user}`; `toUser()` traduce`pictureUrlâ†’avatarUrl`, `biographyâ†’bio`, `idâ†’String`. `getCurrentUser` valida contra `/users/me`: sin red devuelve el usuario cacheado, 401/404 limpia sesiÃ³n, 5xx no borra pero no deja entrar. API devuelve `{success, user}` (no tira).              |
| `songsService.js`     | `listSongs`, `getSongById`, `searchSongs`, `listSongsByMood`, `listPopularSongs`, `SEARCH_PAGE_SIZE=10`                                                                                                                | `toSong()`: `urlâ†’audioUrl`, `artist.nameâ†’artist`, `songGenres[].genre.nameâ†’genre`, `album.nameâ†’album` (dejÃ³ de hardcodear `null` con el modelo Album), `source` = `null` (no existe en el esquema). `listSongsByMood(expression)` consume `GET /songs/recommendations` (TS-20, sin paginar, hasta 20 canciones). `listPopularSongs()` consume `GET /songs/popular` y conserva `favoriteCount` para el ranking de `/populares`. |
| `albumsService.js`    | `listAlbums`, `getAlbumById`, `toAlbum`, `ALBUMS_PAGE_SIZE=12`                                                                                                                                  | El listado **no** tiene recurso propio: es `GET /songs/search?type=albums`. `toAlbum()` traduce `_count.songsâ†’songsCount` y `releaseDateâ†’releaseYear`; el detalle reutiliza el `toSong()` de `songsService` para las pistas (que llegan sin `album`). |
| `artistsService.js`   | `listArtists`, `getArtistById`, `toArtist`, `ARTISTS_PAGE_SIZE=18`                                                                                                                                  | Consume `GET /artists` (envelope paginado) y `GET /artists/:id`. `toArtist()` traduce `_count.albumsâ†’albumsCount` y `_count.songsâ†’songsCount`; el detalle mapea `albums[]` con `toAlbum()`. La query y la pÃ¡gina viven en `?q=`/`?page=`; el input usa `useDebounce`. |
| `playlistsService.js` | CRUD playlists,`addSongToPlaylist`, `removeSongFromPlaylist`, `removePlaylistMember`, `sendInvitation`, `listSentInvitations`, `listReceivedInvitations`, `acceptPlaylistInvitation`, `rejectPlaylistInvitation`, `toggleFavorite`, `isFavorite`, `listFavoriteSongIds`, `subscribeToPlaylists`                                                | Favoritos = playlist`type==='favorites'` (la UI la llama **"Mis Favoritos"**); operaciones sobre ella se redirigen a `/favorites`. Idempotente: ignora 409/404. `ownerId` es obligatorio en la firma y es **el id de quien mira**, no del dueÃ±o: de ahÃ­ sale el `role` (`creator`/`colaborator`/null) que la UI usa para mostrar quÃ© puede hacer cada uno. `toPlaylist` traduce `type`, `role`, `creator` y `members`. Las canciones van por `POST|DELETE /playlists/:id/songs`, que son las rutas con roles. |
| `usersService.js`     | `getUserById`, `searchUsers`, `updateProfile`, `uploadProfilePicture`, `getFollowCounts`, `followStatus`, `listFollowers/listFollowing`, `followUser/unfollowUser`, `subscribeToFollow`, `SEARCH_PAGE_SIZE=4` | Traduce`bioâ†’biography`, `avatarUrlâ†’pictureUrl`. `updateProfile` solo manda `pictureUrl` si viene (si no, el backend no toca la foto; `null` la quita). `uploadProfilePicture` va multipart a `/users/me/picture` y devuelve el usuario mapeado. `searchUsers` suma la relaciÃ³n en los dos sentidos por resultado (los trae el backend con sesiÃ³n, TS-10b): `isFollowing` + `followsMe`. **`followStatus(viewerId, personId)`** usa `GET /users/:id/follow-status` y devuelve `{isFollowing, isFollowedBy, isMutual}` en un request (reemplaza a la vieja `isFollowing`, que bajaba la lista completa de seguidores para mirar un id). No lee la sesiÃ³n (evita ciclo con authService): recibe ids por parÃ¡metro.           |
| `recommendationService.js` | `getUserRecommendations(userId)`                                                                                                                         | Traduce el payload de `/users/:id/recommendations` (recomendaciones de personas, TS-19). El alta la hace `hooks/useRecommendation.jsx` con `post`, no el service. |
| `roomsService.js`     | `searchRooms({query,sort,order})`, `listMyRooms`, `createRoom`, `joinRoom`, `leaveRoom`, `getRoomById`, `closeRoom`, `kickMember`, `getPlayback`, `controlPlayback`, `voteSkip`, `rateHost`, `subscribeToRooms`, `ROOM_SORTS`, `ROOM_ORDERS` | **Ya no hay mock.** `toRoom()` traduce las columnas snake_case del listado y coalescea `avg_rating: 0` a `null` (= "Sin calificaciones", no "calificada con cero"). `toRoomDetail()` agrega `members[]`, `songs[]` (reutiliza el `toSong()` de `songsService`), `playlistName` y `viewerHasRated`. El **orden lo resuelve el servidor**: el service normaliza `sort`/`order` para no mandar requests que el backend rechaza con 400, pero no reordena. `getPlayback` traduce `playback` (`updatedAt` es hora del servidor, la posiciÃ³n se interpola con ella) y `skipVotes`. `subscribeToRooms` existe porque el grupo "Mis Salas" del Sidebar no se remonta al unirse o salir desde otra pantalla (mismo patrÃ³n que `subscribeToPlaylists`). |
| `socketService.js`    | `connectSocket`, `disconnectSocket`, `subscribeToRoomEvent`, `joinRoomChannel`, `leaveRoomChannel`, `getSocket`                                                                                    | Un solo socket para toda la app, con el JWT en `auth.token` (por eso `api.js` exporta `getAuthToken()`). Los suscriptores se registran en un mapa y se enganchan al socket cuando existe, asÃ­ varias pantallas comparten la conexiÃ³n. Recuerda los canales unidos y **re-emite `join-room` en cada reconexiÃ³n**. Los clientes solo escuchan; el estado cambia por REST. Lo cierra `AuthContext` en el logout. |

Regla: **`mocks/` ya no existe**: no queda ningÃºn mock en el repo. Toda la red pasa por `services/`.

### 4.3 Estado global

- **`AuthContext`** (`context/AuthContext.jsx` + `authContext.js` que solo crea el contexto): `{ user, loading, register, login, logout, updateProfile, uploadProfilePicture }`. Al montar llama `getCurrentUser()`; registra el handler de 401 (limpia sesiÃ³n y `user=null`; no navega porque estÃ¡ fuera del Router). Las dos Ãºltimas(setUser con la respuesta del backend) son las que mantienen avatar y perfil al dÃ­a sin recargar.
- **`PlayerContext`** (`context/PlayerContext.jsx`): un solo `<audio>` HTML5. Estado: `queue, index, isPlaying, currentTime, duration, shuffle, repeat ('off'|'track'|'list'), roomMode, song, hasQueue`. Acciones: `playSongs(songs, startIndex, source, { autoplay, onEnded, startPosition })`, `enterRoomMode/exitRoomMode`, `next/previous/seek/togglePlay/toggleShuffle/cycleRepeat`, y sincronizaciÃ³n con la fuente de la cola: `removeFromPlaylistQueue(songId, playlistId)`, `removeFromFavoritesQueue(songId)`, `clearQueueIfSource(playlistId)`. Detalles clave: `queueSourceRef` = `{playlistId, isFavorites} | null` (cola sin origen nunca se toca); `pendingSkipRef` = si se quita la canciÃ³n que suena, sigue sonando y se descarta en el prÃ³ximo `next()`; `historyRef` para `previous()` y shuffle con memoria de 10; `repeat 'track'` se maneja en el evento `ended`; `sameSong()` compara ids como string (number del backend vs string del storage). Cola inicial = primera tanda de `listSongs()` (TODO: reemplazar por la selecciÃ³n real del usuario).
- **"Modo sala" del player (opt-in, TS-15):** `playSongs` acepta tres opciones que por defecto no cambian nada. `onEnded` reemplaza al `next()` local cuando termina una canciÃ³n (en una sala el avance lo pide el anfitriÃ³n al servidor). `startPosition` arranca en un segundo concreto y **la aplica el efecto que carga el track**, no un `seek()` aparte: ese efecto pone `currentTime` en 0 y pisarÃ­a el seek. `roomMode` apaga aleatorio y repeticiÃ³n y hace que `PlayerControls` y `ActionControls` dejen de ofrecerlos. La lÃ³gica de salas vive en `features/rooms/useRoomPlayback.js`, no en el contexto.
- No hay Context de playlists/follow: se resuelven con hooks + suscripciones.
- **`recommendationContext.jsx`** (`context/` + `hooks/useRecommendation.jsx`): provider **por perfil** (TS-19), montado en `ProfileView` y `ProfilePublic` con `userId` distinto, para que la lista de uno no pise la del otro. Aporta `{ items, loading, error, retry, send, submitting, sendError, reset }`. No es un Context global: sigue el patrÃ³n de las features.

### 4.4 Patrones de datos en features (a replicar)

1. **Respuesta con key + versiÃ³n**: el estado guarda `{key, datos, ...}`; `key` identifica la request (userId, sort, requestKey). Si `key !== parÃ¡metro actual` se muestra vacÃ­o/cargando. Evita renders en cascada y no hace falta sincronizar `setLoading(true)`.
2. **`version` para refetch por suscripciÃ³n**: `useEffect(() => subscribeToX(() => setVersion(v => v+1)), [])` y `version` en deps del fetch. Lo usan `useFavorites`, `MisPlaylists`, `useFollow`.
3. **`let active = true` + cleanup** en todo fetch (y `AbortController` donde ya estÃ¡: `HomeDesktop`).
4. **Optimismo**: `useFollow.toggle()` cambia el estado al instante y revierte si el service falla.
5. **Estado en la URL**: `?q=` (TopBar/`/buscar`), `?tipo=canciones|albumes|personas`, `?page=`, `?sort=` (salas). Compartible + botÃ³n atrÃ¡s funciona; los defaults no se escriben en la URL.
6. **`useDebounce(value, 300)`** en inputs de bÃºsqueda.
7. **Trabajo pesado en el navegador, no en la red** (foto de perfil, TS-21): `features/profile/profileImage.js` recorta (1024 px) y recomprime (â‰¤1 MB) el archivo del `<input type="file">` con `canvas`, devuelve un `File` listo para `FormData` y tira con mensajes en espaÃ±ol (incluido el `DOMException` de `createImageBitmap`, que viene en inglÃ©s). Es un helper de la feature, no un service: no habla con la API.

### 4.5 Rutas (`routes/AppRoutes.jsx`)

```
/                         Landing (pÃºblica)
/login, /register         PublicOnly â†’ redirect a /home si hay sesiÃ³n
/home                     Protected  Home (siempre HomeDesktop: no hay layout mobile, Â§4.6)
/perfil                   Protected  ProfileView
/perfil/seguidores        Protected  FollowList relation="seguidores"
/perfil/siguiendo         Protected  FollowList relation="siguiendo"
/playlists                Protected  Playlists (sub-pestaÃ±as por `?tab=mis|colaborativas|invitaciones`)
/playlists/:id            Protected  PlaylistDetail
/salas                    Protected  Rooms
/salas/crear              Protected  CreateRoom
/salas/:id                Protected  RoomView
/animo                    Protected  MoodScan (recomendaciones por estado de Ã¡nimo, TS-20)
/buscar                   Protected  Search (pestaÃ±as `?tipo=canciones|albumes|personas`, con `?q=` y `?page=`)
/albums                Protected  Albums (catÃ¡logo paginado, solo `?page=`)
/albums/:id            Protected  AlbumDetail (carÃ¡tula + "Reproducir" + pistas)
/populares                Protected  Populares (ranking semanal por favoritos)
/artistas                 Protected  Artists (catÃ¡logo paginado con `?q=` y `?page=`)
/artistas/:id             Protected  ArtistDetail (cabecera + grilla de Ã¡lbumes)
/profile/:id              AppLayout sin RequireAuth (perfil pÃºblico)
/profile/:id/seguidores | /siguiendo   AppLayout sin RequireAuth
*                         Navigate a /
```

Guards: `RequireAuth` (si `loading` â†’ `LoadingScreen`; si no hay user â†’ `/login` con `state.from`), `PublicOnly` (si hay user â†’ `/home`).

### 4.6 Layout

> **Desactualizado (2026-10-11, pendiente):** el layout mobile ya no existe. `AppLayout` renderiza
> **siempre** el de desktop y `Home` siempre `HomeDesktop`; `BottomNav`, `MiniPlayerBar`, `HomeMobile`
> y `useBreakpoint.js` siguen en disco sin uso (ver `PENDIENTES.md` Â§8). Lo que sigue describe el
> comportamiento anterior.

`AppLayout` usaba `useBreakpoint()` (768px = `md` de Tailwind) para alternar:

- **Desktop**: `SidebarProvider` (shadcn) + `Sidebar` (colapsable a Ã­conos; header logo, nav Home/Populares/Salas/**Ãnimo**/Perfil, "Mi ColecciÃ³n" Playlists/Albums/Artistas, "Mis Salas" â† `features/rooms/MyRooms.jsx` (las salas del usuario, con las que administra marcadas), "Mis Playlists" â† `MisPlaylists` de la feature y "Playlists Colaborativas" â† `CollabPlaylists`, footer `ProfileSummary`) + `TopBar` + contenido + `PlayerBar`. `AppLayout` monta `SidebarAutoCollapse`, que colapsa/expande el sidebar al cruzar los 1280px sin pisar el trigger manual; el `SidebarTrigger` del `TopBar` (shadcn) es el botÃ³n que lo abre/cierra a mano.
- **Mobile**: **ya no hay.** Era contenido + `MiniPlayerBar` + `BottomNav`; se desarmÃ³, ver `PENDIENTES.md` Â§8.

`TopBar`: input controlado por la URL que navega a `/buscar?q=â€¦`; las flechas back/forward estÃ¡n `hidden` (sin handler). `Home` renderiza `HomeDesktop`.

### 4.7 Design system

- **`styles/tokens.css`** = Ãºnica fuente de verdad de literales (`--ds-*`: colores `red/salmon/lighter/pink/light/shadow/plaster/volume/wall/surface/surface-light/fucsia/...`,tipografÃ­a Roboto con `Header1-4`, `TextRegluar/Medium/Tiny/Large`, `Button`, elevaciÃ³n, radios, tamaÃ±os de MediaCard).
- **`styles/utilities.css`** = clases `.Wall .Fucsia .Volume .Surface .SurfaceLight .CardRadius .Elevation1 .Header3 .TextRegluar .TextFucsia .LogoSynthos â€¦` derivadas con `var()`, dentro de `@layer components` (una utility de Tailwind las pisa).
- **`styles/base.css`** = resets.
- **`src/index.css`** = `@import tailwindcss` + los tres archivos de arriba + puente shadcn: `@theme inline` (mapea `--color-*` a `var(--ds-*)` y a `var(--background)` etc.) y`:root` con `--background/--primary/--sidebar*` **solo con `var(--ds-*)`**.
- Regla dura: **ningÃºn hex/px/shadow literal fuera de `tokens.css`**. Color nuevo = token primero, despuÃ©s clase o mapeo.
- `components.json` apunta `tailwind.css` a `src/index.css`: si se corre `npx shadcn add`, revisar que no pise el `:root` con literales neutros.

### 4.8 Ãconos e imÃ¡genes

- Set propio en `src/assets/*.svg` (19 archivos los importan). Se importan **como URL** y se usan `<img src={...} alt="" aria-hidden className="h-5 w-5">`. **Nunca** el sufijo `?react` (rompe: el import queda `data:image/svg+xml` y al renderizarlo como componente revienta con `InvalidCharacterError`).
- Los SVG traen `#F4F0F9` (= `--ds-lighter`) hardcodeado: **no se recolorean**. Estado activo â†’ jugar con fondo (`Fucsia`/`Volume`/`sidebar-primary`), no con el color del Ã­cono. Para recolorear un `<img>` de SVG existe el truco `invert` (lo usa `Sidebar`).
- `lucide-react` sigue en uso en `Sidebar`, `MisPlaylists`, `ui/sidebar.tsx`, `ui/sheet.tsx` â†’ deuda declarada, migrar al set propio de a uno.
- `<img>` con `alt` real solo para contenido (carÃ¡tulas, avatares).

## 5. Contrato de canciones

Fuente canÃ³nica: **`docs/ESPECIFICACIONES-BACKEND.md` Â§1â€“Â§5** (no duplicar acÃ¡). En corto: `GET /api/songs` es cursor (cola del player y novedades); `GET /api/songs/search` es offset con `{items,total,page,pageSize,totalPages}`, query vacÃ­a = catÃ¡logo completo, clamping de pÃ¡gina y `pageSize` 10â€“50, y acepta `type=songs|albums` (los Ã¡lbumes salen por ahÃ­, con `GET /api/albums/:id` para el detalle); el `query` matchea tambiÃ©n el nombre del Ã¡lbum; los payloads crudos los mapea `songsService.toSong()` y los gÃ©neros llegan anidados (`songGenres[].genre.name`, `SONG_INCLUDE`). Toda canciÃ³n trae `album: { id, name }`.

## 6. Comandos de verificaciÃ³n

```bash
# Backend â€” arranque completo (docker, migrate, seed, dev): ver
# docs/ESPECIFICACIONES-BACKEND.md Â§5.2
# verificaciÃ³n por humo contra la base real: ver docs/PENDIENTES.md Â§5.7
curl "http://localhost:3000/api/songs/search?query=rock&page=1&pageSize=10"
curl "http://localhost:3000/api/rooms?sort=rating"

# Frontend
cd Frontend && npm run lint && npm run build
npm run dev                 # localhost:5173, proxy /api â†’ :3000
```

## 7. Deudas y huecos conocidos (encontrados en el cÃ³digo)

- `roomsService.USE_MOCK` ya no existe: `/salas` habla con la API real desde que el bloque de salas se entregÃ³ (2026-10-18). Ver `PENDIENTES.md` Â§5.6b para las deudas que dejÃ³.
- Ya no quedan pantallas placeholder. Los archivos del layout mobile (`BottomNav`, `MiniPlayerBar`, `HomeMobile`, `hooks/useBreakpoint.js`) siguen en disco sin uso (`PENDIENTES.md` Â§8).
- Campo inexistente en el esquema que la UI tolera con `null`: `source`. `album` ya existe (`Album`) y las canciones lo traen.
- **Chat de salas**: la sincronizaciÃ³n de reproducciÃ³n ya usa WebSocket (`services/socketService.js` + Socket.IO), pero el chat no existe: no hay tabla `room_message` ni eventos que lo transmitan.
- Salas: la barra de progreso es de solo lectura para los miembros (no hay endpoint para buscar dentro de la canciÃ³n, la posiciÃ³n es del servidor), y `joinRoom` no garantiza el tope de 10 ante dos ingresos simultÃ¡neos (la transacciÃ³n relee el cupo pero con el aislamiento por defecto de Postgres).
- `GET /users/:id/follow-status` ya tiene consumidor: `useFollow` lo usa para resolver la relaciÃ³n y `isMutual` en un request (antes eran dos llamadas que bajaban la lista de seguidores de cada lado).
- Backend: se borrÃ³ la columna `playlist.token_invitation` (migraciÃ³n `drop_token_invitation`) y `FRONTEND_URL` ya no se lee en ningÃºn lado.
- Backend: en una `colab` cualquier miembro agrega y quita canciones (`POST|DELETE /playlists/:id/songs`); editar, borrar, invitar y echar son del creador (`idCreator`). `PUT /playlists/:id` conserva `addSongs`/`removeSongs` por compatibilidad y sigue siendo del creador: el frontend ya no lo usa para canciones. **Invitar convierte la playlist en `colab`**, asÃ­ que no hay miembros en playlists personales salvo la de favoritos, que no se puede invitar.
- La rama `feat/ts14-crear-sala` (`77fe367`, sin mergear) quedÃ³ obsoleta: el bloque de salas se rehÃ­zo sobre `dev` contra el contrato real, asÃ­ que esa rama ya no sirve de base (su `joinRoom` entraba por id y no por cÃ³digo).
- Backend: `mongoose` sin usar; `const/baseUrl.js` (`/api/v1`) sin usar y contradictorio con las rutas reales; `src/test.js` es un snippet huÃ©rfano; `db/schema.sql` es solo referencia.
- Sin tests en ninguna de las dos apps (el mapeo de estado de Ã¡nimo de TS-20 se puede probar en node, porque es una funciÃ³n pura).
- TS-20 (/animo): el detector es **face-api.js 0.22.2 desde CDN, cargado bajo demanda** (script + pesos en el primer ingreso a la pantalla). Sin red o sin CDN la pantalla cae al selector manual. La detecciÃ³n real de un rostro no se pudo verificar automÃ¡ticamente: la cÃ¡mara falsa de Chrome no muestra ninguno (sÃ­ se verificÃ³ el mapeo de expresiones a los 4 estados y todo el camino manual). face-api no tiene mantenimiento desde 2020.
- `GET /api/songs/:id` usa `findUniqueOrThrow` â†’ el error lo maneja el mapeador de Prisma (404 vÃ­a `P2025`).
- El Sidebar no se remonta ante mutaciones â†’ por eso existen `subscribeToPlaylists`/`subscribeToFollow`; mantener ese patrÃ³n ante nuevas mutaciones compartidas.
- Backend: `PUT /playlists/:id` con `addSongs` de un id no numÃ©rico responde 400 (`P2023` quedÃ³ mapeado en `errorHandler`); id numÃ©rico inexistente â†’ 409. El frontend ya no pasa por ahÃ­ para agregar o quitar: usa `POST|DELETE /playlists/:id/songs`.
- Fotos de perfil (TS-21): cambiar de formato (JPG â†’ PNG) deja el archivo viejo en ImageKit, porque el nombre es determinista y solo se reemplaza el del formato actual. Quitar la foto tampoco borra el archivo (se reutiliza). No hay transformaciones de ImageKit: se sirve el archivo tal cual (el cliente ya lo manda recortado).
- El `message` del backend se sigue mostrando cuando el `code` no es conocido por `mapApiError`, asÃ­ que un mensaje nuevo en inglÃ©s se verÃ­a en pantalla: no hay lint que lo impida.

## 8. Reglas del repo (AGENTS.md, condensadas)

1. El concepto es **Salas/`rooms`**, jamÃ¡s "Grupos".
2. Reutilizar `MediaCard` y sus variantes (`MiniMediaCard`, `RoomCard`) â€” no variantes ad-hoc.
3. Un solo `PlayerContext`; `PlayerBar`/`MiniPlayerBar` son presentaciÃ³n.
4. Breakpoints Tailwind para layouts; duplicar componentes solo cuando la interacciÃ³n cambia (Sidebar vs BottomNav).
5. Toda red pasa por `services/`; los componentes nunca hacen fetch.
6. `mocks/` ya no existe: la app no tiene datos falsos, todo habla con la API.
7. Ãconos solo de `src/assets/*.svg` importados como URL (Â§4.8).
8. Literales de estilo solo en `tokens.css`.
9. **Git**: sin push/ramas/tags/PRs sin autorizaciÃ³n. Commits locales permitidos. Ramas salen de `dev`, prefijo `feat/fix/docs/`, un cambio por rama, mensajes en espaÃ±ol al imperativo, stageo con rutas explÃ­citas (ojo: no subir el `package-lock.json` de la raÃ­z, es un artefacto vacÃ­o), verificar `lint` + `build` antes de pushear, el PR lo abre el usuario.
