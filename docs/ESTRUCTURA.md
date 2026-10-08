# Estructura del repositorio

Documento de onboarding: **dónde está cada cosa y qué responsabilidad tiene**. Refleja la rama `dev`.
No reemplaza a los demás documentos del proyecto (ver [§7](#7-otros-documentos)).

---

## 1. Panorama general

SYNTHOS es una app social de música (reproducción, playlists, favoritos, salas, seguimiento, búsqueda).
El repo es un **monorepo sin gestor de workspaces**: dos apps con `package.json` independiente.

| | `Frontend/` | `Backend/` |
|---|---|---|
| Stack | React 19, Vite 8, Tailwind 4, react-router 7 | Node, Express 5, Prisma 7, PostgreSQL 17 |
| Puerto | 5173 (Vite) | 3000 (`PORT`) |
| Rol | SPA; consume la API | API REST; todo bajo `/api` |

- **La API siempre está bajo `/api`** y el Frontend llama con **rutas relativas** (`/api/songs/search`).
  En dev el proxy de `Frontend/vite.config.js` las redirige a `localhost:3000`; en producción las sirve un
  reverse proxy. Por eso el mismo build funciona en los dos entornos sin variables de entorno.
- **No hay tests automatizados.** `Backend/npm test` es un stub y el Frontend no tiene runner: la
  verificación es `npm run lint` + `npm run build` en el Frontend y pruebas manuales contra la API.
- **Los comandos del Backend** están en la raíz de `Backend/`: `npm run dev` (nodemon),
  `docker compose up -d` (Postgres + pgAdmin), `npx prisma migrate dev`, `npx prisma db seed`.

---

## 2. Árbol de carpetas

### Raíz

```
AGENTS.md                  Reglas de arquitectura y convenciones (es la fuente de verdad del proyecto)
package-lock.json          Artefacto vacío, no commitear (los locks reales viven en Backend/ y Frontend/)
docs/
  ESTRUCTURA.md            Este documento: onboarding del repo
  CONTEXT.md               Snapshot del estado actual (se inyecta a agentes IA)
  PENDIENTES.md            Backlog vivo: qué está migrado, qué falta y decisiones abiertas
  REQUERIMIENTOS-BACKEND.md  Requisitos por TS y estado de cada uno
  ESPECIFICACIONES-BACKEND.md Contratos vigentes de la API con ejemplos de curl
  plan/                    Planes de sprint (sprint-1-plan.md, sprint-2-plan.md)
```

### `Backend/`

```
prisma/
  schema.prisma       17 modelos + 4 enums: la fuente de verdad del schema
  migrations/         SQL de cada migración, en carpetas timestamp
  views/public/       .sql de las vistas que crea una migración (user_genre_counts, user_top_genre)
  seed.js             Puebla el catálogo desde prisma/data/songs.json (artist, song, genre, mood y sus puentes)
  data/songs.json     Dataset de canciones del seed
src/
  index.js            dotenv + app.listen(PORT || 3000)
  app.js              cors, express.json, montaje de rutas, /api/health, manejo de errores
  routes/             Sólo rutas + middleware. Un archivo por recurso
  controller/         HTTP: valida input, decide status code y arma la respuesta
  services/           Reglas de negocio y Prisma. No conocen req/res
  middlewares/        authenticate (JWT) y prismaErrorHandler (traduce códigos P2xxx)
  prisma/prismaClient.js  Instancia de Prisma con adapter-pg
  utils/validation.js     Validadores compartidos (getId, validateCursor, validateRegisterInput, …)
  const/baseUrl.js    Resto sin usar: app.js monta todo en /api, no en /api/v1
  db/schema.sql       Dump SQL de referencia. La app no lo ejecuta
  test.js             Script de prueba manual. No lo usa nadie
```

### `Frontend/`

```
src/
  main.jsx            AuthProvider > PlayerProvider > BrowserRouter > App
  App.jsx             Sólo delega en AppRoutes
  routes/             AppRoutes + guardas RequireAuth (sesión obligatoria) y PublicOnly (sin sesión)
  context/            AuthContext.jsx / PlayerContext.jsx (estado) + authContext.js / playerContext.js (createContext)
  hooks/              useAuth, usePlayer, useBreakpoint, useFavorites, useDebounce, use-mobile
  services/           ÚNICA capa que hace fetch. Un archivo por dominio
  features/           Lógica de negocio y pantallas, una carpeta por dominio
  components/
    layout/           AppLayout (Sidebar vs BottomNav), Sidebar, SidebarAutoCollapse, TopBar, BottomNav, MiniPlayerBar
    player/           PlayerBar (desktop), PlayerControls, ProgressBar
    cards/            MediaCard, MiniMediaCard, RoomCard, UserRow
    ui/               Componentes shadcn/base-ui + Avatar y LoadingScreen propios
  styles/             tokens.css (única fuente de valores), utilities.css, base.css
  assets/*.svg        Set de íconos propio. Se importan como URL y se usan con <img>
  lib/                utils.ts (cn), formatTime.js, pageRange.js
  mocks/              Datos falsos. Sólo `rooms.js` los consume (vía `roomsService`); ver §6
  index.css           Entry point de Tailwind + puente semántico de shadcn
  pages/Landing/      Landing pública
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
`AuthProvider` resuelve la sesión.

### 3.2 Estado global (Context)

Sólo dos, y son transversales:

- **`AuthProvider`** (`context/AuthContext.jsx`): `user`, `loading`, `register`, `login`, `logout`,
  `updateProfile`. Al montar llama `getCurrentUser()` para rehidratar la sesión. También registra el
  handler de 401: si un request autenticado recibe 401, limpia la sesión y deja `user` en `null`; el
  redirect lo hace `RequireAuth`, no el provider (que está fuera del Router).
- **`PlayerProvider`** (`context/PlayerContext.jsx`): un único `<audio>` HTML5 con `queue`, `index`,
  `song`, `isPlaying`, `currentTime`, `duration`, `shuffle`, `repeat`, y los controles
  `play/pause/next/previous/seek/playSongs`.

El `createContext` va en un `.js` aparte (`authContext.js`, `playerContext.js`) para que el `.jsx`
exporte sólo el provider y no rompa el fast refresh.

### 3.3 Hooks

| Hook | Para qué |
|---|---|
| `useAuth` / `usePlayer` | Leen el Context y fallan ruidosamente si faltan sus providers |
| `useBreakpoint` | `'mobile'` \| `'desktop'` con 768px (coincide con `md:` de Tailwind) |
| `useFavorites` | Favoritos del usuario. Cada consumidor tiene su instancia; se suscribe a `subscribeToPlaylists` para que todas coincidan |
| `useDebounce` | Para inputs de búsqueda |

`useSongPlaylists` y `useFollow` viven en `features/playlists` y `features/social`: son lógica de una
feature, no infraestructura.

### 3.4 Services — la única capa con `fetch`

`services/api.js` es el único lugar del Frontend que llama a la red. Expone
`get/post/patch/put/del`, más:

- `API_BASE_URL = '/api'` y las rutas siempre relativas.
- `setAuthToken(token)`: acá el token queda **en memoria** para que ningún service lo maneje. Ojo que
  no es el único lugar donde existe: `authService` lo persiste en `localStorage["synthos_auth"]` (con
  el usuario cacheado) para que la sesión sobreviva al refresh.
- `setUnauthorizedHandler(fn)`: se dispara una sola vez ante un 401 **con token adjunto**.
- `ApiError`: lleva `status` y `code` del backend, así la UI puede mostrar el mensaje real.

Los services de dominio (`authService`, `songsService`, `usersService`, `playlistsService`) son la
capa que se edita al migrar un módulo de mock a la API real; nada fuera de `services/` cambia.

### 3.5 `features/`

Una carpeta por dominio, con sus pantallas, componentes y hooks:

| Carpeta | Contenido |
|---|---|
| `auth/` | `Login`, `Register` |
| `home/` | `Home` (elige `HomeDesktop`/`HomeMobile` por breakpoint) |
| `profile/` | `ProfileView` (propio), `ProfilePublic` (ajeno), `ProfileEdit` |
| `playlists/` | Biblioteca y detalle, formularios, `MisPlaylists` (sidebar), `FavoriteButton`, `AddToPlaylistPanel`, `useSongPlaylists` |
| `search/` | `Search` + pestañas `SearchSongs` / `SearchPeople` / `SearchTabs` |
| `social/` | `useFollow`, `FollowButton`, `FollowList`, `FollowStats`, `ProfileSummary` |
| `rooms/` | `Rooms.jsx`: listado con `RoomCard` (hoy contra mocks; crear/administrar salas, pendiente) |

### 3.6 `components/`

Presentación pura. `components/ui/` es shadcn sobre `@base-ui/react` (Button, Input, Sidebar, Sheet,
Tooltip, Pagination, Skeleton, Separator) y no se edita a mano salvo por el puente de tokens.

`AppLayout` es el que decide el shell: **desktop** = `Sidebar` + `TopBar` + `PlayerBar`;
**mobile** = `BottomNav` + `MiniPlayerBar`. Ambos players consumen el mismo `PlayerContext`.

### 3.7 Estilos

`styles/tokens.css` es la **única fuente de verdad** de los literales (color, tipografía, elevación).
`styles/utilities.css` (`.Wall`, `.Fucsia`, `.TextRegluar`, …) y `styles/base.css` se derivan con
`var(--ds-*)`. `src/index.css` solo cablea las capas y traduce los tokens a las variables semánticas de
shadcn (`--background`, `--primary`, `--sidebar*`) para que las utilidades `bg-*`/`text-*` de Tailwind
apunten al diseño del proyecto.

### 3.8 Flujo de datos (ejemplo)

```
Click en "seguir"
  → FollowButton.jsx
  → useFollow()                        (hook de la feature)
  → usersService.followUser()          (service)
  → api.js post('/users/:id/follow')   (única capa con fetch)
  → Vite proxy /api → localhost:3000
  → backend: routes → controller → service → Prisma → Postgres
  ← respuesta
  → notifyFollowChanged()              (suscriptores: useFollow)
  → re-fetch de contadores y listas en todos los puntos que usan useFollow
```

---

## 4. Backend por capas

### 4.1 Arranque

`src/index.js` carga `dotenv` y levanta el server. `src/app.js` arma Express:

```
cors() → express.json()
GET /api/health
/api/songs    → song.routes
/api/auth     → auth.routes
/api/users    → user.routes
/api/favorites→ favorite.routes
/api/playlists→ playlist.routes
/api/rooms    → room.routes
prismaErrorHandler → handler genérico (status = err.code || 500)
```

### 4.2 Las tres capas

- **`routes/*.routes.js`** — sólo declara método + path + handler. Las privadas se protegen con
  `router.use(authenticate)`, que se puede aplicar **en el medio** del archivo: en `user.routes.js` lo
  usan sólo `POST`/`DELETE /:id/follow`, y las lecturas quedan públicas.
- **`controller/*.controller.js`** — traduce HTTP a dominio: valida el body/query, responde 400/401/403/404/409
  con `{ status: "error", message }`, y en algún caso lanza `Error` con `error.code = 400` para que lo
  traduzca el handler global de `app.js`.
- **`services/*.service.js`** — Prisma y reglas. No conocen `req`/`res`. Acotan la paginación
  (`page >= 1`, `pageSize` en `[1, 50]`), aplican los `select`/`include` (nadie devuelve `passwordHash`)
  y definen qué relaciones trae cada respuesta.

`middlewares/errorHandler.js` traduce los códigos de Prisma a respuestas HTTP: `P2000/P2005/P2006/P2007/P2009/P2011/P2012/P2013` → 400,
`P2002/P2003/P2014` → 409, `P2001/P2015/P2025` → 404, `P2008/P2010` → 500. Incluye el `code` en la
respuesta y, en desarrollo, el `meta`.

### 4.3 Base de datos

`src/prisma/prismaClient.js` instancia Prisma con el **adapter `pg`** (sin binario nativo), leyendo
`DATABASE_URL`.

Modelos (`prisma/schema.prisma`): `User`, `Artist`, `Song`, `SongArtist`, `Genre`, `SongGenre`, `Mood`,
`SongMood`, `Playlist`, `PlaylistMember`, `PlaylistSong`, `Favorite`, `Follow`, `Content`,
`ContentPlayement`, `Room`, `RoomMember`, `HostRating`.
Enums: `PlaylistType` (`personal`/`colab`/`favorites`), `PlaylistRole`, `RoomRole`, `RoomStatus`.

Además del ORM hay **vistas SQL** creadas por migración y usadas con `$queryRaw`: `room_avg_rating`,
`user_top_genre`, `user_genre_counts`. `searchUsers` y `getSortedRoom` dependen de ellas.

### 4.4 Flujo de una request

```
GET /api/playlists/12
  → playlist.routes: router.use(authenticate) verifica el Bearer y deja req.user = payload del JWT
  → playlist.controller.getPlaylistById: valida el id, carga la playlist y compara
    playlist.idCreator con req.user.sub; si no es del dueño responde 404 (no 403, para no filtrar existencia)
  → playlist.service.getPlaylistById: include de creator y songs ordenadas por position
  → Prisma → Postgres
  ← 200 { status: "success", playlist }
```

---

## 5. Catálogo de endpoints

Todo bajo `/api` (`Backend/src/app.js`). El contrato completo —requests, responses, errores y
`curl`— vive en [`ESPECIFICACIONES-BACKEND.md`](ESPECIFICACIONES-BACKEND.md); este es el resumen:

| Grupo | Endpoints | Privadas con JWT | Contrato |
|---|---|---|---|
| Salud | `GET /health` | — | ESPECIFICACIONES §6 |
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout` | `logout` | §6 |
| Usuarios y follow | `GET /users/search`, `GET\|PATCH /users/me`, `GET /users/:id`, `GET /users/:id/followers\|following`, `POST\|DELETE /users/:id/follow` | `me`, follow | §7 |
| Canciones | `GET /songs`, `GET /songs/search`, `GET /songs/:id` | — | §1–§5 |
| Favoritos | `GET /favorites`, `GET /favorites/songs/ids`, `POST /favorites/songs`, `DELETE /favorites/songs/:songId` | todas | §8 |
| Playlists | `GET /playlists`, `GET\|PUT\|DELETE /playlists/:id`, `POST /playlists` | todas | §9 |
| Salas | `GET /rooms?sort=` | — | §10 |

El resto es público. Errores: siempre `{ status: "error", message, code? }` (ver §6).

---

## 6. Convenciones y trampas conocidas

**Convenciones que conviene no romper**

- **Response split**: todo lo que no sea 2xx es `{ status: "error", message }`, y suma `code` cuando el
  error viene de Prisma. El Frontend lo muestra tal cual (`ApiError.message`).
- **JWT**: `authenticate` deja el payload en `req.user`. `sub` **siempre es string**, y Prisma espera
  `Int`: hay que castear `Number(req.user.sub)`.
- **Ids numéricos**: casi todos los recursos usan Int autoincremental. `utils/validation.js:getId` lanza
  400 si el id no es entero ≥ 0.
- **Dos formas de paginación**: por cursor (`GET /songs`) y por página (`/songs/search`,
  `/users/search`). Las de búsqueda comparten el envelope `{ items, total, page, pageSize, totalPages }`
  para que el Frontend reuse el mismo componente de paginación.
- **Nunca devolver `passwordHash`**: los `select` de los services lo excluyen explícitamente.
- **Tokens**: en el Frontend viven en memoria dentro de `api.js`, y además `authService` los persiste en
  `localStorage["synthos_auth"]` junto al usuario cacheado. Por eso al arrancar la app hay que distinguir
  "no hubo respuesta" de "el servidor respondió con un error": si no, un 500 del backend contaba como
  sesión válida y `RequireAuth` dejaba entrar sin pedir login.

**Trampas**

- **Cliente Prisma desactualizado**: si agregás una migración con un enum nuevo, el cliente generado puede
  quedar viejo y fallar en runtime aunque la migración esté aplicada. Corré `npx prisma generate`.
- **Vistas SQL**: `room_avg_rating`, `user_top_genre` y `user_genre_counts` las crea una migración. Si
  falta alguna, `/api/rooms` y `/api/users/search` fallan aunque el schema esté al día.
- **Sin migraciones aplicadas = sin base**: hay que correr `docker compose up -d` y
  `npx prisma migrate dev` antes de levantar el server.
- **Favoritos**: la playlist de favoritos aparece recién después del primer favorito, y editarla o
  borrarla devuelve 403.
- **`/api/v1` no existe**: todo cuelga de `/api` (`app.js`). `src/const/baseUrl.js` es un resto sin uso.
- **Código muerto** que conviene no tomar como referencia: `Frontend/src/mocks/` (sólo `rooms.js` se
  consume, vía `roomsService`; `users.js`, `songs.js` y `playlists.js` quedaron sin uso tras migrar),
  `Backend/src/const/baseUrl.js`, `Backend/src/test.js` y la llamada a `ensureFavoritesPlaylist` que
  quedó comentada en `favorite.service.js`.
- **Vistas de una sola página**: `/populares`, `/albums` y `/artistas` son `ScreenPlaceholder`;
  el chat todavía no existe, y `features/rooms/` sólo tiene el listado (`Rooms.jsx`).

---

## 7. Otros documentos

| Documento | Para qué |
|---|---|
| [`AGENTS.md`](../AGENTS.md) | Reglas de arquitectura y convención de nombres. **La fuente de verdad** del proyecto |
| [`CONTEXT.md`](CONTEXT.md) | Snapshot del estado actual del repo, pensado para inyectar a agentes IA |
| [`PENDIENTES.md`](PENDIENTES.md) | Backlog vivo: qué está migrado, qué falta y las decisiones abiertas |
| [`REQUERIMIENTOS-BACKEND.md`](REQUERIMIENTOS-BACKEND.md) | Requisitos por historia de usuario y estado de cada uno |
| [`ESPECIFICACIONES-BACKEND.md`](ESPECIFICACIONES-BACKEND.md) | Contratos vigentes de la API en detalle (canciones §1–5, resto §6–10), con comandos de `curl` (§5.2) |
| [`plan/sprint-*.md`](plan/sprint-1-plan.md) | Planes de sprint con el detalle de implementación |