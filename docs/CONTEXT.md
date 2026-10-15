# CONTEXTO DE PROYECTO — SYNTHOS

## 1. Qué es

Monorepo de **SYNTHOS**, app de música social (tipo Spotify con capa social). Dos apps en un repo:

- `Backend/` — API REST (Express + Prisma + PostgreSQL).
- `Frontend/` — SPA React (Vite + Tailwind) que consume esa API.

Idioma de dominio, UI, comentarios, nombres de archivos y mensajes de error: **español**. Las ramas y commits también (ver §8).

## 2. Estructura del repo

```
/
├── Backend/
│   ├── docker-compose.yml        # postgres:17 (5432) + pgadmin (8080)
│   ├── prisma.config.ts          # schema, migrations, seed
│   ├── prisma/
│   │   ├── schema.prisma         # modelo completo + vistas
│   │   ├── data/songs.json       # catálogo para seed
│   │   ├── seed.js               # catálogo (artist/song/genre/mood)
│   │   ├── seedRooms.js          # salas + host_rating de prueba
│   │   ├── migrations/           # 6 migraciones
│   │   └── views/public/*.sql    # user_genre_counts, user_top_genre
│   └── src/
│       ├── index.js              # arranca el server (PORT || 3000)
│       ├── app.js                # express + rutas + middlewares de error
│       ├── routes/*.js           # 6 routers
│       ├── controller/*.js       # 7 controllers (HTTP: valida + formatea)
│       ├── services/*.js         # services (Prisma + lógica; image.service = ImageKit)
│       ├── middlewares/          # auth.middleware (JWT), upload.middleware (multipart), errorHandler (Prisma)
│       ├── utils/validation.js   # validadores compartidos
│       ├── utils/errors.js       # httpError(status, message, code) — contrato de errores
│       ├── prisma/prismaClient.js# singleton con adapter-pg
│       ├── const/baseUrl.js      # "localhost:3000/api/v1" (huérfano, no se usa)
│       └── db/schema.sql         # DDL de referencia (no es la fuente: lo es schema.prisma)
├── Frontend/
│   ├── components.json           # config shadcn (style base-nova, css: src/index.css)
│   ├── vite.config.js            # alias @ → ./src, proxy /api → localhost:3000
│   └── src/                      # ver §4
├── docs/                         # (excluido de este contexto salvo ESPECIFICACIONES-BACKEND)
├── AGENTS.md                     # reglas del repo
└── .github/PULL_REQUEST_TEMPLATE.md
```

## 3. Backend

**Stack:** Express **5** (CommonJS, `"type": "commonjs"`), Prisma **7** con `@prisma/adapter-pg`, PostgreSQL 17, `bcrypt`, `jsonwebtoken`, `cors`, `dotenv`, `multer` (multipart), `@imagekit/nodejs` (fotos de perfil), `nodemon` (dev). `mongoose` está en dependencies pero **no se usa en ningún lado**.

**Scripts:** `npm run dev` (nodemon, NODE_ENV=development), `npm start`, `vercel-build` (`prisma generate`). No hay tests (`npm test` es el stub de npm).

**Capas:** `routes → controller → service → prisma`. Los controllers solo validan HTTP (`req.params/query/body`, `req.user.sub`) y devuelven status; la lógica y las queries viven en `services/`. Ningún `fetch`/query fuera de services.

**Auth:** JWT Bearer. `authenticate` (`middlewares/auth.middleware.js`) decodifica con `JWT_SECRET` y deja el payload en `req.user`; el id del usuario es **`req.user.sub` y llega como string** (hay que hacerle `Number()` para Prisma). `optionalAuthenticate` (mismo archivo) deja `req.user = null` si no viene header y solo 401 si el token está presente pero es inválido: lo usan endpoints públicos que enriquecen su respuesta con sesión (`GET /users/search`). `signToken` en `auth.controller.js`: payload `{ sub, email, username }`, expiración `JWT_EXPIRES_IN || "7d"`.

**Errores:** `middlewares/errorHandler.js` mapea códigos Prisma a HTTP con mensajes en español:
`P2000/P2005/P2006/P2007/P2009/P2011/P2012/P2013/P2023 → 400`, `P2002 → 409` (incluye los campos en conflicto), `P2003/P2014 → 409`, `P2001/P2015/P2025 → 404`, `P2008/P2010 → 500`; cualquier otro → 500. En development agrega `meta`/`details`. Detrás hay un handler unhandled que responde `{ status:"error", message, code? }`: el status sale de `error.httpStatus` (nunca de `error.code`, porque Prisma, el driver y multer usan strings) y **solo se loguea lo que es 500 o más**.

**Códigos de error (`utils/errors.js`):** los errores de validación se crean con
`httpError(status, message, code, extra?)`, que deja el status en `error.httpStatus` y un `code` de
negocio **string y estable** (`USERNAME_TAKEN`, `IMAGE_TOO_LARGE`, `FOLLOW_REQUIRED`…), que es lo que
viaja en el body. Los controllers lanzan en vez de armar el JSON a mano. El Frontend traduce por `code`
(`utils/mapError.js`), así que cambiar la redacción de un mensaje no rompe ninguna pantalla. `extra`
sirve para campos aparte del error, como el `errors[]` del registro.

**Forma de respuesta (parcialmente inconsistente — respetar la que ya tiene cada endpoint):**

- Envolvente `{ status: "success"|"error", ... }` en auth, users, favorites, playlists, follow.
- Payload crudo (sin envolvente) en `songs` y `rooms`.
- Errores: siempre `{ status:"error", message, code? }`, más `errors[]` u otros campos cuando el error los trae (`httpError(..., extra)`).

### 3.1 Endpoints vigentes (`app.js`, todo bajo `/api`)

```
GET    /api/health                     → { status: "ok" }

POST   /api/auth/register              → 201 { token, user }   (valida email/username/password)
POST   /api/auth/login                 → 200 { token, user }
POST   /api/auth/logout                → authenticate

GET    /api/songs?cursor=              → { songs[10], nextCursor, hasMore }   (cursor, orden id asc)
GET    /api/songs/search?query=&page=&pageSize=  → { items, total, page, pageSize, totalPages }
GET    /api/songs/recommendations?expression=     → { status, songs } por estado de ánimo (400 si la expresión no es un mood válido)
GET    /api/songs/:id                  → song (findUniqueOrThrow)

GET    /api/users/search?query=&page=&pageSize=  → { items, total, page, pageSize, totalPages } (auth opcional; con sesión cada item suma isFollowing y followsMe)
GET    /api/users/me                   → authenticate
PATCH  /api/users/me                   → authenticate (username/biography/pictureUrl; pictureUrl solo URL http(s), una data URL da 400)
POST   /api/users/me/picture           → authenticate, multipart campo `picture` (JPG/PNG/WEBP, ≤2MB) → usuario con la URL de ImageKit (400 archivo/tipo/tamaño, 500 si falla la subida)
GET    /api/users/:id                  → usuario + followers[] + following[] + followerCount + followingCount
GET    /api/users/:id/followers        → { followers: [user] }
GET    /api/users/:id/following        → { following: [user] }
POST   /api/users/:id/follow           → authenticate (idempotente, 200 aunque ya siga)
DELETE /api/users/:id/follow           → authenticate (404 si no seguías)
GET    /api/users/:id/follow-status    → authenticate → { viewerFollows, targetFollows, isMutual } (el frontend no lo consume hoy)
GET    /api/users/:id/recommendations  → authenticate → { status, recommendations } (dueño ve las recibidas, emisor solo las suyas; un tercero recibe [])
POST   /api/users/:id/recommendations  → authenticate, body { songId, text } → 201 (400 texto/canción, 403 sin follow mutuo, 404 usuario o canción)

GET    /api/favorites                  → authenticate → { playlist, songs }
GET    /api/favorites/songs/ids        → authenticate → { songIds: number[] }
POST   /api/favorites/songs            → authenticate, body { songId } → 201 (409 si ya existe, 404 si no existe la canción)
DELETE /api/favorites/songs/:songId    → authenticate (404 si no estaba)

GET    /api/playlists                  → authenticate → { playlists }
GET    /api/playlists/:id              → authenticate (404 si no es tuya)
POST   /api/playlists                  → authenticate, { name (≤50), description?, isPublic?, type? } → 201 ("colab" o "personal")
PUT    /api/playlists/:id              → authenticate, dueño, NO favorites; body { name?, description?, addSongs?, removeSongs?, reorder? }
DELETE /api/playlists/:id              → authenticate, dueño, NO favorites
POST   /api/playlists/:id/invitation   → authenticate → 201 { token, link } (403 si no es el creador, 400 si no es colab, 404 si no existe; regenera el token)
GET    /api/playlists/join/:token      → preview público → { playlist: {id,name,description,creator}, isMember }
POST   /api/playlists/join/:token      → authenticate → 201 unido / 200 si ya era miembro / 404 token inválido

GET    /api/rooms?sort=alphabetical|rating  → array crudo de `room` + `avg_rating` (SQL raw: LEFT JOIN a `room_member` + vista `host_avg_rating`)
```

**Endpoints que NO existen todavía** (los espera el frontend o el plan): crear/unirse/salir de sala, buscar salas (`GET /rooms` no acepta `query` ni trae el nombre del anfitrión), votar skip, calificar anfitrión (`host_rating` solo se carga por seed), chat, permisos de playlists colaborativas (crear y unirse por invitación ya existen; falta que un `colaborator` pueda editar y que el frontend consuma las invitaciones), recomendaciones por estado de ánimo en el frontend (el endpoint ya existe), contenidos (`Content`/`ContentPlayement` sin rutas), albums/artistas como recursos, refresh de token, logout server-side real (logout solo responde OK).

### 3.2 Validaciones (`utils/validation.js`)

- `getId(req)` → lanza error con `code = 400` si el id no es número ≥ 0.
- `validateQuery` (string no vacío), `validateCursor` (number | null).
- `validateSortType` → solo `"alphabetical" | "rating"` (el frontend debe respetar estas keys exactas).
- `validateRegisterInput` → email regex, username 3–50, password ≥8 con al menos una letra y un número.

### 3.3 Modelo de datos (`prisma/schema.prisma`)

Tablas mapeadas a snake_case (`@@map`, `@map`), claves compuestas como `@@id([a, b])`.

- **User**: `email` unique, `username` unique (≤50), `passwordHash`, `pictureUrl?`, `biography?`, `registrationDate`.
- **Artist / Song** (`Song.idArtist` FK, `url` NOT NULL, `duration?`, `coverUrl?`, `releaseDate?`) / **SongArtist**, **Genre/SongGenre**, **Mood/SongMood** (ambos joins con cascade).
- **Playlist**: `type: PlaylistType { personal | colab | favorites }`, `isPublic`, `tokenInvitation?`, `idCreator` (cascade). `PlaylistMember` con `PlaylistRole { creator | colaborator }`: el rol `colaborator` lo crea `POST /playlists/join/:token`; el `creator` **no** se inserta como fila (el dueño se reconoce por `idCreator`). `PlaylistSong` PK `[idPlaylist, idSong]` + `position`, `addedBy?`.
- **Favorite**: PK `[idUser, idSong]`.
- **Follow**: PK `[followerId, followedId]` (hay CHECK de no auto-seguirse mencionado en el frontend).
- **Content / ContentPlayement**: tienen rutas de lectura/escritura de recomendaciones (TS-19); `ContentPlayement` es donde vive el destinatario de una recomendación. `SongMood` + `Mood` alimentan `GET /songs/recommendations`.
- **Room**: `code` unique (≤20), `name`, `idPlaylistSource` NOT NULL FK playlist, `isPrivate`, `passwordHash?`, `maxCapacity`, `status: RoomStatus { activa | cerrada }`, `expiresAt?`. `RoomMember` con `RoomRole { host | member }`. `HostRating` PK `[idRoom, idRater, idHost]`, `rating SmallInt`.
- **Vistas** (preview `views`): `user_genre_counts`, `user_top_genre` (usada por `searchUsers`), `RoomAvgRating` → mapeada a `room_avg_rating` (usada por raw SQL de rooms).

**Semillas:** `prisma.config.ts` → `db seed` corre `seed.js && seedRooms.js` (ambos idempotentes). `seed.js` puebla artista/canciones/géneros/moods desde `prisma/data/songs.json` (descarta canciones sin género o mood). `seedRooms.js` crea 5 anfitriones + 3 raters (contraseña **`Demo1234`**), playlists fuente, salas y `host_rating` (escala 1–5) para que el orden por rating sea comprobable.

**Env:** `DATABASE_URL`, `POSTGRES_USER/PASSWORD/DB`, `PGADMIN_DEFAULT_EMAIL/PASSWORD`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `IMAGEKIT_PRIVATE_KEY` (`.env.example`; el `.env` local solo tiene las primeras + `JWT_SECRET` + `IMAGEKIT_PRIVATE_KEY`). **La clave de ImageKit es opcional en el arranque**: `services/image.service.js` instancia el cliente de forma perezosa, así que sin la var el server levanta y solo falla la subida de fotos (500 con mensaje en español). **`FRONTEND_URL`** la usa `POST /playlists/:id/invitation` para armar el `link` de invitación (`${FRONTEND_URL}/join/<token>`) y **no está declarada en `.env.example`**: sin ella el link sale `undefined/join/<token>`.

**Setup local:** `docker compose up -d` → `npx prisma migrate dev --name x` → `npx prisma db seed` → `npm run dev` (pgadmin en localhost:8080, `npx prisma studio` como alternativa).

## 4. Frontend

**Stack:** React **19**, Vite **8**, Tailwind **4** vía `@tailwindcss/vite` (sin tailwind.config: config en CSS), `react-router-dom` **7**, `@base-ui/react` (primitivas) + primitivas estilo **shadcn** (`components/ui/*.tsx`, style `base-nova`), `class-variance-authority`, `clsx`/`tailwind-merge` (`cn` en `lib/utils.ts`), `lucide-react` (deuda: ver §7), `oxlint` como linter. Mezcla de `.jsx` (app) y `.tsx/.ts` (ui de shadcn, hooks `use-mobile.ts`).

**Scripts:** `npm run dev` | `build` | `lint` (oxlint) | `preview`. Alias `@ → src`. Proxy Vite: `/api → http://localhost:3000`.

**Punto de entrada** (`main.jsx`): `AuthProvider > PlayerProvider > BrowserRouter > App`. `AppRoutes` decide.

### 4.1 Capa de red

`services/api.js` es el **único** lugar que hace `fetch`:

- Base relativa `API_BASE_URL = '/api'` (funciona con el proxy de dev y con reverse proxy en prod; nunca hardcodea el host).
- Token en memoria (`setAuthToken`), se setea desde `authService`; `Authorization: Bearer` automático.
- `setUnauthorizedHandler(cb)`: un 401 **con token** limpia sesión una sola vez; un 401 sin token (login fallido) es un error normal.
- `buildUrl` descarta `undefined/null/''` de los query params (el backend distingue `?query=` de ausente).
- 204 → `null`; no-2xx → lanza `ApiError { message, status, code }` (el mensaje viene del backend y se muestra tal cual en la UI, salvo que `utils/mapError.js` lo traduzca por `code`).
- Helpers: `get/post/patch/put/del` + `postForm` (multipart: si el body es `FormData` va crudo y sin `Content-Type`, para que el browser ponga el `boundary`).
- `utils/mapError.js` traduce los errores **por `code`** (el identificador estable del backend) y cae al `message` del servidor solo si el código no lo conoce.

### 4.2 Services (uno por dominio, único punto de traducción de contratos)

| Archivo                 | Expone                                                                                                                                                                                                 | Notas                                                                                                                                                                                                                                                                                                                                                   |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `authService.js`      | `registerUser`, `loginUser`, `logoutUser`, `getCurrentUser`, `clearSession`                                                                                                                  | Sesión en`localStorage['synthos_auth'] = {token, user}`; `toUser()` traduce`pictureUrl→avatarUrl`, `biography→bio`, `id→String`. `getCurrentUser` valida contra `/users/me`: sin red devuelve el usuario cacheado, 401/404 limpia sesión, 5xx no borra pero no deja entrar. API devuelve `{success, user}` (no tira).              |
| `songsService.js`     | `listSongs`, `getSongById`, `searchSongs`, `listSongsByMood`, `SEARCH_PAGE_SIZE=10`                                                                                                                | `toSong()`: `url→audioUrl`, `artist.name→artist`, `songGenres[].genre.name→genre`, `album`/`source` = `null` (no existen en el esquema). `listSongsByMood(expression)` consume `GET /songs/recommendations` (TS-20, sin paginar, hasta 20 canciones).                                                                                                                               |
| `playlistsService.js` | CRUD playlists,`addSongToPlaylist`, `removeSongFromPlaylist`, `toggleFavorite`, `isFavorite`, `listFavoriteSongIds`, `subscribeToPlaylists`                                                | Favoritos = playlist`type==='favorites'` (la UI la llama **"Mis Favoritos"**); operaciones sobre ella se redirigen a `/favorites`. Idempotente: ignora 409/404. `ownerId` es obligatorio en la firma (chequeo defensivo; el dueño real sale del token).                                                                                    |
| `usersService.js`     | `getUserById`, `searchUsers`, `updateProfile`, `uploadProfilePicture`, `getFollowCounts`, `followStatus`, `listFollowers/listFollowing`, `followUser/unfollowUser`, `subscribeToFollow`, `SEARCH_PAGE_SIZE=4` | Traduce`bio→biography`, `avatarUrl→pictureUrl`. `updateProfile` solo manda `pictureUrl` si viene (si no, el backend no toca la foto; `null` la quita). `uploadProfilePicture` va multipart a `/users/me/picture` y devuelve el usuario mapeado. `searchUsers` suma la relación en los dos sentidos por resultado (los trae el backend con sesión, TS-10b): `isFollowing` + `followsMe`. **`followStatus(viewerId, personId)`** usa `GET /users/:id/follow-status` y devuelve `{isFollowing, isFollowedBy, isMutual}` en un request (reemplaza a la vieja `isFollowing`, que bajaba la lista completa de seguidores para mirar un id). No lee la sesión (evita ciclo con authService): recibe ids por parámetro.           |
| `recommendationService.js` | `getUserRecommendations(userId)`                                                                                                                         | Traduce el payload de `/users/:id/recommendations` (recomendaciones de personas, TS-19). El alta la hace `hooks/useRecommendation.jsx` con `post`, no el service. |
| `roomsService.js`     | `listRooms({sort})`, `ROOM_SORTS`, `DEFAULT_ROOM_SORT`                                                                                                                                           | **`USE_MOCK = true`**: hoy consume `mocks/rooms.js`, no el endpoint. `toRoom()` ya acepta ambos shapes (snake_case del SQL crudo y el del mock), `avg_rating` llega como string Decimal → `Number()`, `hostRating: null` = "Sin calificar" (distinto de 0). Ordena en el clientecon `localeCompare('es')`, sin rating va al final. Falta apagar el flag (TS-17/F8). |

Regla: **`mocks/` solo se importa desde su service** (hoy solo `roomsService` importa mocks).

### 4.3 Estado global

- **`AuthContext`** (`context/AuthContext.jsx` + `authContext.js` que solo crea el contexto): `{ user, loading, register, login, logout, updateProfile, uploadProfilePicture }`. Al montar llama `getCurrentUser()`; registra el handler de 401 (limpia sesión y `user=null`; no navega porque está fuera del Router). Las dos últimas(setUser con la respuesta del backend) son las que mantienen avatar y perfil al día sin recargar.
- **`PlayerContext`** (`context/PlayerContext.jsx`, 452 líneas): un solo `<audio>` HTML5. Estado: `queue, index, isPlaying, currentTime, duration, shuffle, repeat ('off'|'track'|'list'), song, hasQueue`. Acciones: `playSongs(songs, startIndex, source)`, `next/previous/seek/togglePlay/toggleShuffle/cycleRepeat`, y sincronización con la fuente de la cola: `removeFromPlaylistQueue(songId, playlistId)`, `removeFromFavoritesQueue(songId)`, `clearQueueIfSource(playlistId)`. Detalles clave: `queueSourceRef` = `{playlistId, isFavorites} | null` (cola sin origen nunca se toca); `pendingSkipRef` = si se quita la canción que suena, sigue sonando y se descarta en el próximo `next()`; `historyRef` para `previous()` y shuffle con memoria de 10; `repeat 'track'` se maneja en el evento `ended`; `sameSong()` compara ids como string (number del backend vs string del storage). Cola inicial = primera tanda de `listSongs()` (TODO: reemplazar por la selección real del usuario).
- No hay Context de playlists/follow: se resuelven con hooks + suscripciones.
- **`recommendationContext.jsx`** (`context/` + `hooks/useRecommendation.jsx`): provider **por perfil** (TS-19), montado en `ProfileView` y `ProfilePublic` con `userId` distinto, para que la lista de uno no pise la del otro. Aporta `{ items, loading, error, retry, send, submitting, sendError, reset }`. No es un Context global: sigue el patrón de las features.

### 4.4 Patrones de datos en features (a replicar)

1. **Respuesta con key + versión**: el estado guarda `{key, datos, ...}`; `key` identifica la request (userId, sort, requestKey). Si `key !== parámetro actual` se muestra vacío/cargando. Evita renders en cascada y no hace falta sincronizar `setLoading(true)`.
2. **`version` para refetch por suscripción**: `useEffect(() => subscribeToX(() => setVersion(v => v+1)), [])` y `version` en deps del fetch. Lo usan `useFavorites`, `MisPlaylists`, `useFollow`.
3. **`let active = true` + cleanup** en todo fetch (y `AbortController` donde ya está: `HomeDesktop`).
4. **Optimismo**: `useFollow.toggle()` cambia el estado al instante y revierte si el service falla.
5. **Estado en la URL**: `?q=` (TopBar/`/buscar`), `?tipo=canciones|personas`, `?page=`, `?sort=` (salas). Compartible + botón atrás funciona; los defaults no se escriben en la URL.
6. **`useDebounce(value, 300)`** en inputs de búsqueda.
7. **Trabajo pesado en el navegador, no en la red** (foto de perfil, TS-21): `features/profile/profileImage.js` recorta (1024 px) y recomprime (≤1 MB) el archivo del `<input type="file">` con `canvas`, devuelve un `File` listo para `FormData` y tira con mensajes en español (incluido el `DOMException` de `createImageBitmap`, que viene en inglés). Es un helper de la feature, no un service: no habla con la API.

### 4.5 Rutas (`routes/AppRoutes.jsx`)

```
/                         Landing (pública)
/login, /register         PublicOnly → redirect a /home si hay sesión
/home                     Protected  Home (siempre HomeDesktop: no hay layout mobile, §4.6)
/perfil                   Protected  ProfileView
/perfil/seguidores        Protected  FollowList relation="seguidores"
/perfil/siguiendo         Protected  FollowList relation="siguiendo"
/playlists                Protected  Playlists
/playlists/:id            Protected  PlaylistDetail
/salas                    Protected  Rooms
/animo                    Protected  MoodScan (recomendaciones por estado de ánimo, TS-20)
/buscar                   Protected  Search (?q= & ?tipo= & ?page=)
/populares, /albums, /artistas  Protected  ScreenPlaceholder ("Pantalla en construcción")
/profile/:id              AppLayout sin RequireAuth (perfil público)
/profile/:id/seguidores | /siguiendo   AppLayout sin RequireAuth
*                         Navigate a /
```

Guards: `RequireAuth` (si `loading` → `LoadingScreen`; si no hay user → `/login` con `state.from`), `PublicOnly` (si hay user → `/home`).

### 4.6 Layout

> **Desactualizado (2026-10-11, pendiente):** el layout mobile ya no existe. `AppLayout` renderiza
> **siempre** el de desktop y `Home` siempre `HomeDesktop`; `BottomNav`, `MiniPlayerBar`, `HomeMobile`
> y `useBreakpoint.js` siguen en disco sin uso (ver `PENDIENTES.md` §8). Lo que sigue describe el
> comportamiento anterior.

`AppLayout` usaba `useBreakpoint()` (768px = `md` de Tailwind) para alternar:

- **Desktop**: `SidebarProvider` (shadcn) + `Sidebar` (colapsable a íconos; header logo, nav Home/Populares/Salas/**Ánimo**/Perfil, "Mi Colección" Playlists/Albums/Artistas, "Mis Salas"vacío, "Mis Playlists" ← `MisPlaylists` de la feature, footer `ProfileSummary`) + `TopBar` + contenido + `PlayerBar`. `AppLayout` monta `SidebarAutoCollapse`, que colapsa/expande el sidebar al cruzar los 1280px sin pisar el trigger manual; el `SidebarTrigger` del `TopBar` (shadcn) es el botón que lo abre/cierra a mano.
- **Mobile**: **ya no hay.** Era contenido + `MiniPlayerBar` + `BottomNav`; se desarmó, ver `PENDIENTES.md` §8.

`TopBar`: input controlado por la URL que navega a `/buscar?q=…`; las flechas back/forward están `hidden` (sin handler). `Home` renderiza `HomeDesktop`.

### 4.7 Design system

- **`styles/tokens.css`** = única fuente de verdad de literales (`--ds-*`: colores `red/salmon/lighter/pink/light/shadow/plaster/volume/wall/surface/surface-light/fucsia/...`,tipografía Roboto con `Header1-4`, `TextRegluar/Medium/Tiny/Large`, `Button`, elevación, radios, tamaños de MediaCard).
- **`styles/utilities.css`** = clases `.Wall .Fucsia .Volume .Surface .SurfaceLight .CardRadius .Elevation1 .Header3 .TextRegluar .TextFucsia .LogoSynthos …` derivadas con `var()`, dentro de `@layer components` (una utility de Tailwind las pisa).
- **`styles/base.css`** = resets.
- **`src/index.css`** = `@import tailwindcss` + los tres archivos de arriba + puente shadcn: `@theme inline` (mapea `--color-*` a `var(--ds-*)` y a `var(--background)` etc.) y`:root` con `--background/--primary/--sidebar*` **solo con `var(--ds-*)`**.
- Regla dura: **ningún hex/px/shadow literal fuera de `tokens.css`**. Color nuevo = token primero, después clase o mapeo.
- `components.json` apunta `tailwind.css` a `src/index.css`: si se corre `npx shadcn add`, revisar que no pise el `:root` con literales neutros.

### 4.8 Íconos e imágenes

- Set propio en `src/assets/*.svg` (19 archivos los importan). Se importan **como URL** y se usan `<img src={...} alt="" aria-hidden className="h-5 w-5">`. **Nunca** el sufijo `?react` (rompe: el import queda `data:image/svg+xml` y al renderizarlo como componente revienta con `InvalidCharacterError`).
- Los SVG traen `#F4F0F9` (= `--ds-lighter`) hardcodeado: **no se recolorean**. Estado activo → jugar con fondo (`Fucsia`/`Volume`/`sidebar-primary`), no con el color del ícono. Para recolorear un `<img>` de SVG existe el truco `invert` (lo usa `Sidebar`).
- `lucide-react` sigue en uso en `Sidebar`, `MisPlaylists`, `ui/sidebar.tsx`, `ui/sheet.tsx` → deuda declarada, migrar al set propio de a uno.
- `<img>` con `alt` real solo para contenido (carátulas, avatares).

## 5. Contrato de canciones

Fuente canónica: **`docs/ESPECIFICACIONES-BACKEND.md` §1–§5** (no duplicar acá). En corto: `GET /api/songs` es cursor (cola del player y novedades); `GET /api/songs/search` es offset con `{items,total,page,pageSize,totalPages}`, query vacía = catálogo completo, clamping de página y `pageSize` 10–50; los payloads crudos los mapea `songsService.toSong()` y los géneros llegan anidados (`songGenres[].genre.name`, `SONG_INCLUDE`).

## 6. Comandos de verificación

```bash
# Backend — arranque completo (docker, migrate, seed, dev): ver
# docs/ESPECIFICACIONES-BACKEND.md §5.2
# verificación por humo contra la base real: ver docs/PENDIENTES.md §5.7
curl "http://localhost:3000/api/songs/search?query=rock&page=1&pageSize=10"
curl "http://localhost:3000/api/rooms?sort=rating"

# Frontend
cd Frontend && npm run lint && npm run build
npm run dev                 # localhost:5173, proxy /api → :3000
```

## 7. Deudas y huecos conocidos (encontrados en el código)

- `roomsService.USE_MOCK = true` → la pantalla `/salas` no habla con el backend todavía (el endpoint `GET /api/rooms` sí existe).
- Pantallas placeholder: `/populares`, `/albums`, `/artistas`. Los archivos del layout mobile (`BottomNav`, `MiniPlayerBar`, `HomeMobile`, `hooks/useBreakpoint.js`) siguen en disco sin uso (`PENDIENTES.md` §8).
- Campos inexistentes en el esquema que la UI tolera con `null`: `album`, `source`.
- No existen `socketService` ni WebSockets (mencionados como plan, no implementados): la sincronización real de salas sigue pendiente (D8 del plan).
- `GET /users/:id/follow-status` ya tiene consumidor: `useFollow` lo usa para resolver la relación y `isMutual` en un request (antes eran dos llamadas que bajaban la lista de seguidores de cada lado).
- Backend: `POST /playlists/:id/invitation` genera el link con `FRONTEND_URL`, que no está en `.env.example`; además el link apunta a `/join/<token>` y las rutas reales son `/api/playlists/join/:token` y ninguna de las dos está en `AppRoutes` (TS-13 F6).
- Backend: los roles de `PlaylistMember` no se aplican en `PUT /playlists/:id` (403 por `idCreator`): un colaborador no puede agregar canciones (TS-12 B8).
- La rama `feat/ts14-crear-sala` (`77fe367`, sin mergear) tiene TS-14 completo en la capa mock (`CreateRoom`, `RoomView`, `createRoom`/`joinRoom`/`getRoomById`, rutas `/salas/crear` y `/salas/:id`); es anterior a PR #65 y rebasa con conflicto en `Rooms.jsx`/`roomsService.js`.
- `roomsService.USE_MOCK = true` sigue sirviendo `mocks/rooms.js` aunque el backend ya ordena por rating real (`host_avg_rating`): es el único ítem de TS-17 que queda (F8).
- Backend: `mongoose` sin usar; `const/baseUrl.js` (`/api/v1`) sin usar y contradictorio con las rutas reales; `src/test.js` es un snippet huérfano; `db/schema.sql` es solo referencia.
- Sin tests en ninguna de las dos apps (el mapeo de estado de ánimo de TS-20 se puede probar en node, porque es una función pura).
- TS-20 (/animo): el detector es **face-api.js 0.22.2 desde CDN, cargado bajo demanda** (script + pesos en el primer ingreso a la pantalla). Sin red o sin CDN la pantalla cae al selector manual. La detección real de un rostro no se pudo verificar automáticamente: la cámara falsa de Chrome no muestra ninguno (sí se verificó el mapeo de expresiones a los 3 estados y todo el camino manual). face-api no tiene mantenimiento desde 2020.
- `GET /api/songs/:id` usa `findUniqueOrThrow` → el error lo maneja el mapeador de Prisma (404 vía `P2025`).
- El Sidebar no se remonta ante mutaciones → por eso existen `subscribeToPlaylists`/`subscribeToFollow`; mantener ese patrón ante nuevas mutaciones compartidas.
- Backend: `PUT /playlists/:id` con `addSongs` de un id no numérico responde 400 (`P2023` quedó mapeado en `errorHandler`); id numérico inexistente → 409. Ojo: `playlist.controller.js` tiene `addSong`/`removeSong` con la lógica de roles de TS-12/B8 (colaborador puede agregar, solo el creador quita) pero **no están montados en `playlist.routes.js`**.
- Fotos de perfil (TS-21): cambiar de formato (JPG → PNG) deja el archivo viejo en ImageKit, porque el nombre es determinista y solo se reemplaza el del formato actual. Quitar la foto tampoco borra el archivo (se reutiliza). No hay transformaciones de ImageKit: se sirve el archivo tal cual (el cliente ya lo manda recortado).
- El `message` del backend se sigue mostrando cuando el `code` no es conocido por `mapApiError`, así que un mensaje nuevo en inglés se vería en pantalla: no hay lint que lo impida.

## 8. Reglas del repo (AGENTS.md, condensadas)

1. El concepto es **Salas/`rooms`**, jamás "Grupos".
2. Reutilizar `MediaCard` y sus variantes (`MiniMediaCard`, `RoomCard`) — no variantes ad-hoc.
3. Un solo `PlayerContext`; `PlayerBar`/`MiniPlayerBar` son presentación.
4. Breakpoints Tailwind para layouts; duplicar componentes solo cuando la interacción cambia (Sidebar vs BottomNav).
5. Toda red pasa por `services/`; los componentes nunca hacen fetch.
6. `mocks/` solo se consume desde su `xService.js`.
7. Íconos solo de `src/assets/*.svg` importados como URL (§4.8).
8. Literales de estilo solo en `tokens.css`.
9. **Git**: sin push/ramas/tags/PRs sin autorización. Commits locales permitidos. Ramas salen de `dev`, prefijo `feat/fix/docs/`, un cambio por rama, mensajes en español al imperativo, stageo con rutas explícitas (ojo: no subir el `package-lock.json` de la raíz, es un artefacto vacío), verificar `lint` + `build` antes de pushear, el PR lo abre el usuario.
