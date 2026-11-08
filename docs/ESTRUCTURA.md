# Estructura del repositorio

Documento de onboarding: **dÃ³nde estÃ¡ cada cosa y quÃ© responsabilidad tiene**. Refleja la rama `dev`.
No reemplaza a los demÃ¡s documentos del proyecto (ver [Â§7](#7-otros-documentos)).

> **Actualizado post-reestructura:** el repo ahora es un monorepo con workspaces (`frontend`, `shared`, `mobile`; `backend` fuera).
> La lógica de negocio vive en `shared/` y la UI web en `Frontend/`. Ver `AGENTS.md` y `docs/agents/monorepo-y-adaptadores.md`.


---

## 1. Panorama general

SYNTHOS es una app social de mÃºsica (reproducciÃ³n, playlists, favoritos, salas, seguimiento, bÃºsqueda).
El repo es un **monorepo con workspaces npm** (`frontend`, `shared`, `mobile`; `backend` queda fuera y conserva su propio lockfile).

| | `frontend/` | `shared/` | `mobile/` | `backend/` |
|---|---|---|---|---|
| Stack | React 19, Vite 8, Tailwind 4, react-router 7 | JS puro (sin DOM/CSS/router) | Expo (React Native) | Node, Express 5, Prisma 7, PostgreSQL 17 |
| Puerto | 5173 (Vite) | â€” | Expo | 3000 (`PORT`) |
| Rol | SPA; consume la API | LÃ³gica de negocio compartida | App mobile (Fase 7+) | API REST; todo bajo `/api` |

- **La API siempre estÃ¡ bajo `/api`** y el Frontend llama con **rutas relativas** (`/api/songs/search`).
  En dev el proxy de `Frontend/vite.config.js` las redirige a `localhost:3000`; en producciÃ³n las sirve un
  reverse proxy. Por eso el mismo build funciona en los dos entornos sin variables de entorno.
- **No hay tests automatizados.** `Backend/npm test` es un stub y el Frontend no tiene runner: la
  verificaciÃ³n es `npm run lint` + `npm run build` en el Frontend y pruebas manuales contra la API.
- **Los comandos del Backend** estÃ¡n en la raÃ­z de `Backend/`: `npm run dev` (nodemon),
  `docker compose up -d` (Postgres + pgAdmin), `npx prisma migrate dev`, `npx prisma db seed`.

---

## 2. Ãrbol de carpetas

### RaÃ­z

```
AGENTS.md                  Reglas de arquitectura y convenciones (es la fuente de verdad del proyecto)
package-lock.json          Artefacto vacÃ­o, no commitear (los locks reales viven en Backend/ y Frontend/)
docs/
  ESTRUCTURA.md            Este documento: onboarding del repo
  CONTEXT.md               Snapshot del estado actual (se inyecta a agentes IA)
  PENDIENTES.md            Backlog vivo: quÃ© estÃ¡ migrado, quÃ© falta y decisiones abiertas
  REQUERIMIENTOS-BACKEND.md  Requisitos por TS y estado de cada uno
  ESPECIFICACIONES-BACKEND.md Contratos vigentes de la API con ejemplos de curl
  plan/                    Planes de sprint (sprint-1-plan.md, sprint-2-plan.md)
```

### `Backend/`

```
prisma/
  schema.prisma       17 modelos + 4 enums: la fuente de verdad del schema
  migrations/         SQL de cada migraciÃ³n, en carpetas timestamp
  views/public/       .sql de las vistas que crea una migraciÃ³n (user_genre_counts, user_top_genre)
  seed.js             Puebla el catÃ¡logo desde prisma/data/songs.json (artist, song, genre, mood y sus puentes)
  data/songs.json     Dataset de canciones del seed
src/
  index.js            dotenv + app.listen(PORT || 3000)
  app.js              cors, express.json, montaje de rutas, /api/health, manejo de errores
  routes/             SÃ³lo rutas + middleware. Un archivo por recurso
  controller/         HTTP: valida input, decide status code y arma la respuesta
  services/           Reglas de negocio y Prisma. No conocen req/res (incluye image.service.js: ImageKit)
  middlewares/        authenticate (JWT), uploadAvatar (multipart del avatar) y prismaErrorHandler (traduce cÃ³digos P2xxx)
  prisma/prismaClient.js  Instancia de Prisma con adapter-pg
  utils/validation.js     Validadores compartidos (getId, validateCursor, validateRegisterInput, â€¦)
utils/errors.js         httpError(status, message, code): contrato de errores de la API
  const/baseUrl.js    Resto sin usar: app.js monta todo en /api, no en /api/v1
  db/schema.sql       Dump SQL de referencia. La app no lo ejecuta
  test.js             Script de prueba manual. No lo usa nadie
```

### `Frontend/`

```
src/
  main.jsx            AuthProvider > PlayerProvider > NotificationsProvider > BrowserRouter > App
  app/
    App.jsx           Sólo delega en AppRoutes y monta usePlayerWebEffects
    layout/           AppLayout, Sidebar, SidebarAutoCollapse, TopBar, BottomNav
  routes/             AppRoutes + guardas RequireAuth (sesión obligatoria) y PublicOnly (sin sesión)
  pages/              Una página por ruta, sufijo *Page
    landing/ auth/ home/ profile/ playlists/ rooms/ catalog/ search/ notifications/ mood/
    dev/              ComponentsPage + ejemplos del design system
  features/           UI y lógica de un dominio (components/, hooks/, lib/)
    home/ player/ playlists/ rooms/ search/ social/ profile/
    notifications/ recommendation/ mood/
  components/
    actions/          QueueActionButton, AddToQueueButton
    cards/            MediaCard, MiniMediaCard, RoomCard, UserRow, ArtistCard
    motion/           combobox, SidebarAnimatedGroup
    ui/               Componentes shadcn/base-ui + Avatar y LoadingScreen propios
    animate-ui/
  hooks/              Sólo transversales: useBreakpoint, use-mobile
  lib/                audioMotor, utils.ts, toastMessages
    images/           prepareImage (recorte/compresión de imágenes)
    motion/           sidebar.js, drag.js
  styles/             tokens.css (única fuente de valores), utilities.css, base.css
  fonts/              Tipografías propias
  index.css           Entry point de Tailwind + puente semántico de shadcn
```

---

## 3. Frontend por capas

El orden de las capas va de la UI hacia la red. **Nunca se salta una capa**: los componentes no hacen
`fetch` ni conocen URLs, y los services no saben nada de React.

### 3.1 Rutas

`routes/AppRoutes.jsx` declara todas las rutas. Hay tres envoltorios:

- `<Protected>` = `RequireAuth` + `AppLayout` → pide sesión y dibuja la shell.
- `PublicOnly` → si hay sesión, redirige a `/home` (login y register).
- Rutas públicas de lectura (`/profile/:id`) van **fuera** de `Protected` a propósito: son un perfil
  ajeno y no deberían depender de que haya sesión.

`RequireAuth` y `PublicOnly` miran `loading` de `useAuth` y muestran `LoadingScreen` mientras
`AuthProvider` resuelve la sesiÃ³n.

### 3.2 Estado global (Context)

Los contextos globales viven en `shared/src/context/` y se consumen desde `@synthos/shared`:

- **`AuthProvider`** (`shared/src/context/AuthContext.jsx` + `authContext.js`): `user`, `loading`,
  `register`, `login`, `logout`, `updateProfile`, `uploadProfilePicture`. Al montar llama
  `getCurrentUser()` para rehidratar la sesión. También registra el handler de 401: si un request
  autenticado recibe 401, limpia la sesión y deja `user` en `null`; el redirect lo hace `RequireAuth`,
  no el provider (que está fuera del Router).
- **`PlayerProvider`** (`shared/src/context/PlayerContext.jsx` + `playerContext.js`): un único motor de
  audio inyectado por la app web (`lib/audioMotor.js`) con `queue`, `index`, `song`, `isPlaying`,
  `currentTime`, `duration`, `shuffle`, `repeat`, y los controles
  `play/pause/next/previous/seek/playSongs`.
- **`NotificationsProvider`** (`shared/src/context/NotificationsContext.jsx`): contador y estado de
  notificaciones.

El `createContext` va en un `.js` aparte para que el `.jsx` exporte sólo el provider y no rompa el fast
refresh.

La app web sólo monta los providers en `main.jsx` y aporta los adaptadores de plataforma
(almacenamiento y motor de audio). No define contextos propios.

### 3.3 Hooks

`Frontend/src/hooks/` sólo contiene hooks transversales de la UI web:

| Hook | Para qué |
|---|---|
| `useBreakpoint` | `'mobile'` \| `'desktop'` con 768px (coincide con `md:` de Tailwind) |
| `use-mobile` | Primitiva de shadcn para el sidebar (mismo breakpoint) |

Los hooks de negocio viven en `shared/src/hooks/` (globales) o en
`shared/src/features/<dominio>/` (de feature): `useAuth`, `usePlayer`, `useFavorites`, `useDebounce`,
`useSongPlaylists`, `useFollow`, etc. La app web los importa desde `@synthos/shared`.

### 3.4 Services — la única capa con `fetch`

`shared/src/services/api.js` es el único lugar del repo que llama a la red. Expone
`get/post/patch/put/del`, más:

- `API_BASE_URL = '/api'` y las rutas siempre relativas.
- `setAuthToken(token)`: acá el token queda **en memoria** para que ningún service lo maneje.
- `setUnauthorizedHandler(fn)`: se dispara una sola vez ante un 401 **con token adjunto**.
- `ApiError`: lleva `status` y `code` del backend, así la UI puede mostrar el mensaje real.
- `postForm(path, formData)`: multipart. `request()` detecta que el body es un `FormData` y lo manda
  crudo, sin `Content-Type`, para que el browser ponga el `boundary` (subida de la foto de perfil).

La app web inyecta los adaptadores con `configureApi({ baseUrl, storage })` en `main.jsx`; el
almacenamiento del token es específico de cada plataforma (localStorage en web).

Los services de dominio (`authService`, `songsService`, `albumsService`, `artistsService`,
`usersService`, `playlistsService`, `roomsService`, `notificationsService`, `recommendationService`,
`socketService`) viven en `shared/src/services/` y se reexportan desde `@synthos/shared`.

### 3.5 `features/`

Las pantallas ya no viven en `features/`: cada ruta tiene su archivo en `pages/`.
`features/` contiene sólo UI y lógica reutilizable de un dominio:

| Carpeta | Contenido |
|---|---|
| `home/` | `HomeDesktop`, `HomeSection` |
| `player/` | `PlayerBar`, `ExpandedPlayer`, `PlayerControls`, `ProgressBar`, `TransportControls`, `ActionControls`, `UpNext`, `Parts` + `usePlayerWebEffects` |
| `playlists/` | `PlaylistTile`, `PlaylistSongRow`, `PlaylistCreateForm`, `PlaylistInvitations`, `HeaderPlaylist`, `MisPlaylists`, `CollabPlaylists`, `FavoriteButton`, `AddToPlaylistPanel`; `index.js` público |
| `rooms/` | `JoinRoomDialog`, `MyRooms`, `RoomSidebarList` + `lib/roomNotice.js` |
| `search/` | `SearchSongs`, `SearchAlbums`, `SearchPeople`, `SearchTabs`, `SearchPersonRow`, `UserSearch`, `RecentSearchesCombobox` + `useRecentSearches` |
| `social/` | `FollowButton`, `FollowStats`, `HostRatingBadge`; `index.js` público |
| `profile/` | `ProfileEdit`, `ProfileSummary` |
| `notifications/` | `NotificationRow` + `lib/formatRelativeTime.js` |
| `recommendation/` | `RecommendationSection`, `RecommendSongModal`, `SongSearchStep` |
| `mood/` | `MoodPicker`, `MoodResults` + `lib/moodDetection.js` |

Las páginas del catálogo están en `pages/catalog/`: `AlbumsPage`, `AlbumDetailPage`,
`ArtistsPage`, `ArtistDetailPage` y `PopularPage`.

### 3.6 `components/`

Presentación pura. `components/` no importa de `features/` ni de `app/`:

- `ui/`: shadcn sobre `@base-ui/react` (Button, Input, Sidebar, Sheet, Tooltip, Pagination, Skeleton,
  Separator) más `Avatar` y `LoadingScreen` propios.
- `cards/`: `MediaCard`, `MiniMediaCard`, `RoomCard`, `UserRow`, `ArtistCard`.
- `actions/`: `QueueActionButton` y `AddToQueueButton`.
- `motion/`: primitivas de animación y `SidebarAnimatedGroup`.
- `animate-ui/`: primitivas de toasts.

`app/layout/AppLayout.jsx` compone el shell actual: `Sidebar` + `TopBar` + contenido + `PlayerBar`,
más el overlay del reproductor expandido. `BottomNav` queda para la fase mobile. Los componentes del
player consumen el mismo `PlayerContext` global de `shared/`.

### 3.7 Estilos

`styles/tokens.css` es la **única fuente de verdad** de los literales (color, tipografía, elevación).
`styles/utilities.css` (`.Wall`, `.Fucsia`, `.TextRegluar`, …) y `styles/base.css` se derivan con
`var(--ds-*)`. `src/index.css` solo cablea las capas y traduce los tokens a las variables semánticas de
shadcn (`--background`, `--primary`, `--sidebar*`) para que las utilidades `bg-*`/`text-*` de Tailwind
apunten al diseño del proyecto.

### 3.8 Flujo de datos (ejemplo)

```
Click en "seguir"
  → FollowButton.jsx                         (features/social)
  → useFollow()                              (shared/src/features/social)
  → usersService.followUser()                (shared/src/services)
  → api.js post('/users/:id/follow')         (única capa con fetch)
  → Vite proxy /api → localhost:3000
  → backend: routes → controller → service → Prisma → Postgres
  ← respuesta
  → notifyFollowChanged()                    (suscriptores: useFollow)
  → re-fetch de contadores y listas en todos los puntos que usan useFollow
```

---

## 4. Backend por capas

### 4.1 Arranque

`src/index.js` carga `dotenv` y levanta el server. `src/app.js` arma Express:

```
cors() â†’ express.json()
GET /api/health
/api/songs    â†’ song.routes
/api/auth     â†’ auth.routes
/api/users    â†’ user.routes
/api/favoritesâ†’ favorite.routes
/api/playlistsâ†’ playlist.routes
/api/rooms    â†’ room.routes
prismaErrorHandler â†’ handler genÃ©rico (status = err.code || 500)
```

### 4.2 Las tres capas

- **`routes/*.routes.js`** â€” sÃ³lo declara mÃ©todo + path + handler. Las privadas se protegen con
  `router.use(authenticate)`, que se puede aplicar **en el medio** del archivo: en `user.routes.js` lo
  usan sÃ³lo `POST`/`DELETE /:id/follow`, y las lecturas quedan pÃºblicas.
- **`controller/*.controller.js`** â€” traduce HTTP a dominio: valida el body/query, responde 400/401/403/404/409
  con `{ status: "error", message }`, y en algÃºn caso lanza `Error` con `error.code = 400` para que lo
  traduzca el handler global de `app.js`.
- **`services/*.service.js`** â€” Prisma y reglas. No conocen `req`/`res`. Acotan la paginaciÃ³n
  (`page >= 1`, `pageSize` en `[1, 50]`), aplican los `select`/`include` (nadie devuelve `passwordHash`)
  y definen quÃ© relaciones trae cada respuesta.

`middlewares/errorHandler.js` traduce los cÃ³digos de Prisma a respuestas HTTP: `P2000/P2005/P2006/P2007/P2009/P2011/P2012/P2013` â†’ 400,
`P2002/P2003/P2014` â†’ 409, `P2001/P2015/P2025` â†’ 404, `P2008/P2010` â†’ 500. Incluye el `code` en la
respuesta y, en desarrollo, el `meta`.

### 4.3 Base de datos

`src/prisma/prismaClient.js` instancia Prisma con el **adapter `pg`** (sin binario nativo), leyendo
`DATABASE_URL`.

Modelos (`prisma/schema.prisma`): `User`, `Artist`, `Song`, `SongArtist`, `Genre`, `SongGenre`, `Mood`,
`SongMood`, `Playlist`, `PlaylistMember`, `PlaylistSong`, `Favorite`, `Follow`, `Content`,
`ContentPlayement`, `Room`, `RoomMember`, `HostRating`.
Enums: `PlaylistType` (`personal`/`colab`/`favorites`), `PlaylistRole`, `RoomRole`, `RoomStatus`.

AdemÃ¡s del ORM hay **vistas SQL** creadas por migraciÃ³n y usadas con `$queryRaw`: `room_avg_rating`,
`user_top_genre`, `user_genre_counts`. `searchUsers` y `getSortedRoom` dependen de ellas.

### 4.4 Flujo de una request

```
GET /api/playlists/12
  â†’ playlist.routes: router.use(authenticate) verifica el Bearer y deja req.user = payload del JWT
  â†’ playlist.controller.getPlaylistById: valida el id, carga la playlist y compara
    playlist.idCreator con req.user.sub; si no es del dueÃ±o responde 404 (no 403, para no filtrar existencia)
  â†’ playlist.service.getPlaylistById: include de creator y songs ordenadas por position
  â†’ Prisma â†’ Postgres
  â† 200 { status: "success", playlist }
```

---

## 5. CatÃ¡logo de endpoints

Todo bajo `/api` (`Backend/src/app.js`). El contrato completo â€”requests, responses, errores y
`curl`â€” vive en [`ESPECIFICACIONES-BACKEND.md`](ESPECIFICACIONES-BACKEND.md); este es el resumen:

| Grupo | Endpoints | Privadas con JWT | Contrato |
|---|---|---|---|
| Salud | `GET /health` | â€” | ESPECIFICACIONES Â§6 |
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout` | `logout` | Â§6 |
| Usuarios y follow | `GET /users/search`, `GET\|PATCH /users/me`, `GET /users/:id`, `GET /users/:id/followers\|following`, `POST\|DELETE /users/:id/follow` | `me`, follow | Â§7 |
| Canciones | `GET /songs`, `GET /songs/search`, `GET /songs/recommendations`, `GET /songs/popular`, `GET /songs/:id` | â€” | Â§1â€“Â§5 |
| Ãlbumes y artistas | `GET /albums/:id`, `GET /artists`, `GET /artists/:id` | â€” | Â§2.4â€“Â§2.5 |
| Favoritos | `GET /favorites`, `GET /favorites/songs/ids`, `POST /favorites/songs`, `DELETE /favorites/songs/:songId`, `PUT /favorites/order` | todas | Â§8 |
| Playlists | `GET /playlists`, `GET\|PUT\|DELETE /playlists/:id`, `POST /playlists`, `POST\|DELETE /playlists/:id/songs`, `PUT /playlists/:id/songs/order` | todas | Â§9 |
| Salas | `GET /rooms?sort=` | â€” | Â§10 |

El resto es pÃºblico. Errores: siempre `{ status: "error", message, code? }` (ver Â§6).

---

## 6. Convenciones y trampas conocidas

**Convenciones que conviene no romper**

- **Response split**: todo lo que no sea 2xx es `{ status: "error", message }`, y suma `code` cuando el
  error viene de Prisma. El Frontend lo muestra tal cual (`ApiError.message`).
- **JWT**: `authenticate` deja el payload en `req.user`. `sub` **siempre es string**, y Prisma espera
  `Int`: hay que castear `Number(req.user.sub)`.
- **Ids numÃ©ricos**: casi todos los recursos usan Int autoincremental. `utils/validation.js:getId` lanza
  400 si el id no es entero â‰¥ 0.
- **Dos formas de paginaciÃ³n**: por cursor (`GET /songs`) y por pÃ¡gina (`/songs/search`,
  `/users/search`). Las de bÃºsqueda comparten el envelope `{ items, total, page, pageSize, totalPages }`
  para que el Frontend reuse el mismo componente de paginaciÃ³n.
- **Nunca devolver `passwordHash`**: los `select` de los services lo excluyen explÃ­citamente.
- **Tokens**: en el Frontend viven en memoria dentro de `api.js`, y ademÃ¡s `authService` los persiste en
  `localStorage["synthos_auth"]` junto al usuario cacheado. Por eso al arrancar la app hay que distinguir
  "no hubo respuesta" de "el servidor respondiÃ³ con un error": si no, un 500 del backend contaba como
  sesiÃ³n vÃ¡lida y `RequireAuth` dejaba entrar sin pedir login.

**Trampas**

- **Cliente Prisma desactualizado**: si agregÃ¡s una migraciÃ³n con un enum nuevo, el cliente generado puede
  quedar viejo y fallar en runtime aunque la migraciÃ³n estÃ© aplicada. CorrÃ© `npx prisma generate`.
- **Vistas SQL**: `room_avg_rating`, `user_top_genre` y `user_genre_counts` las crea una migraciÃ³n. Si
  falta alguna, `/api/rooms` y `/api/users/search` fallan aunque el schema estÃ© al dÃ­a.
- **Sin migraciones aplicadas = sin base**: hay que correr `docker compose up -d` y
  `npx prisma migrate dev` antes de levantar el server.
- **Favoritos**: la playlist de favoritos aparece reciÃ©n despuÃ©s del primer favorito, y editarla o
  borrarla devuelve 403.
- **`/api/v1` no existe**: todo cuelga de `/api` (`app.js`). `src/const/baseUrl.js` es un resto sin uso.
- **Código muerto** que conviene no tomar como referencia: `Backend/src/const/baseUrl.js`,
  `Backend/src/test.js` y la llamada a `ensureFavoritesPlaylist` que quedó comentada en
  `favorite.service.js`. `Frontend/src/mocks/` ya no existe.
- **Vistas de una sola página**: `/artistas` tiene catálogo y detalle (`pages/catalog/ArtistsPage` y
  `ArtistDetailPage`), `/albums` tiene grilla y detalle (`pages/catalog/AlbumsPage` y
  `AlbumDetailPage`) y `/populares` tiene ranking semanal (`pages/catalog/PopularPage`). El chat de
  salas todavía no existe.

---

## 7. Otros documentos

| Documento | Para quÃ© |
|---|---|
| [`AGENTS.md`](../AGENTS.md) | Reglas de arquitectura y convenciÃ³n de nombres. **La fuente de verdad** del proyecto |
| [`CONTEXT.md`](CONTEXT.md) | Snapshot del estado actual del repo, pensado para inyectar a agentes IA |
| [`PENDIENTES.md`](PENDIENTES.md) | Backlog vivo: quÃ© estÃ¡ migrado, quÃ© falta y las decisiones abiertas |
| [`REQUERIMIENTOS-BACKEND.md`](REQUERIMIENTOS-BACKEND.md) | Requisitos por historia de usuario y estado de cada uno |
| [`ESPECIFICACIONES-BACKEND.md`](ESPECIFICACIONES-BACKEND.md) | Contratos vigentes de la API en detalle (canciones Â§1â€“5, resto Â§6â€“10), con comandos de `curl` (Â§5.2) |
| [`NOTIFICACIONES-BACKEND.md`](NOTIFICACIONES-BACKEND.md) | Guía para implementar notificaciones: modelo Prisma, REST, WebSocket y adaptación a mobile |
| [`plan/sprint-*.md`](plan/sprint-1-plan.md) | Planes de sprint con el detalle de implementaciÃ³n |
