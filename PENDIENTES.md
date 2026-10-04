# Pendientes

Estado al cerrar la cadena de ramas del Sprint 1. El trabajo está repartido en ramas apiladas
(`main` -> `chore/docs-plan` -> `chore/design-system-e-iconos` -> `feat/ts-06-player-core` ->
`feat/ts-03-auth` -> `feat/ts-04-auth-screens` -> `feat/ts-05-profile` -> `feat/ts-02-layout` ->
`feat/ts-01-app-wiring` -> `feat/ts-06-player-redesign`). `dev` apunta a la punta de esa cadena.

En ese punto: `npm run build` compila y `npm run lint` solo reporta 3 warnings preexistentes de
`components/ui/*` (`only-export-components`) y `hooks/use-mobile.ts` (`set-state-in-effect`).

---

## 1. Prueba funcional en navegador (smoke test)

**Contexto:** el build verifica que compila, no que funciona. El reproductor usa audio real
(MP3 de SoundHelix) y eventos del `<audio>` (`timeupdate`, `loadedmetadata`, `ended`), que solo
se ejercitan a mano.

**Qué verificar:**

- Reproducción real: play/pause y que suene audio; que `currentTime`/`duration` se actualicen.
- Al terminar una canción (`ended`): con `repeat: 'off'` detiene, con `'list'` vuelve al inicio,
  con `'track'` repite.
- `next`/`previous` (incluido el "si pasaron más de 3s, reinicia" de `previous`) y el wrap de la cola.
- Shuffle y repeat mantienen estado durante la sesión; los botones activos se ven sobre `Fucsia`.
- `ProgressBar`: click, arrastre (`setPointerCapture`) y teclado (←/→ 5s, `Home`).
- Que los SVG se vean en `PlayerBar` (desktop) y `MiniPlayerBar` (mobile), y que el mini quede por
  encima de `BottomNav` sin tapar contenido.
- Que las clases del design system (`Wall`, `Surface`, `Fucsia`, `Volume`, `SurfaceLight`,
  `TextRegluar`, `TextMedium`, `Elevation1`…) sigan pintando bien: ahora viven en
  `@layer components`, así que una utilidad Tailwind las puede sobrescribir
  (`className="Wall bg-red-500"` ya no manda la clase del design system).
- Los deltas visuales de la centralización de tokens: fondo `body` `#0a0713` → `#1e1e1e` (`Surface`),
  texto `#f2eefb` → `#f4f0f9` (`Lighter`), muted `#a89dc4` → `#b0a4b5` (`LightMuted`), texto sobre
  `Fucsia` `#1a0711` → `#1e1e1e` (`Surface`, 4.85:1 → 4.17:1), `ring`/`text-accent` `#e91e63` →
  `#ef2f62` (`Fucsia`) y `::selection` ahora en `Fucsia`.
- Responsive: alternar `Sidebar` (desktop) vs `BottomNav` + mini player (mobile).

---

## 2. `Sidebar.jsx` todavía usa `lucide-react`

**Contexto:** la regla 10 de `AGENTS.md` pide íconos solo desde `src/assets/*.svg` (set de diseño
propio, importados como URL y usados con `<img>`), nunca de librerías. El `Sidebar` es el único
lugar que quedó con `lucide-react` (`Home`, `Flame`, `User`, `ListMusic`, `Disc3`, `Mic2`).

**Qué hacer:** mapear cada ítem (Home, Populares, Perfil, Playlists, Albums, Artistas) a su SVG del
set, cambiar el render (hoy `<Icon />`, debe pasar a `<img src={...} alt="" aria-hidden="true" className="h-5 w-5" />`)
y quitar `lucide-react` de `package.json` si no queda ningún uso.

---

## 3. `pages/Landing/Landing.jsx` conserva "Grupos/#groups"

**Contexto:** la regla 1 de `AGENTS.md` prohíbe reintroducir el concepto "Grupos": fue reemplazado
por **Salas** (`rooms`). `Landing.jsx` sigue con ese copy/anclas.

**Qué hacer:** renombrar el texto y los anclas (`#groups` -> `#salas` o equivalente) a "Salas".
Revisar el resto del repo por otros restos de "Grupo/grupo".

---

## 4. Scaffolds borrados con `.gitkeep` (recrear cuando toque)

**Contexto:** para dejar el árbol limpio sin componentes vacíos, se borraron placeholders y se
dejó `.gitkeep` en las carpetas. No están en el build.

- `components/cards/`: se borraron `MediaCard.jsx`, `SectionCarousel.jsx` y `RoomListItem.jsx`.
  `HomeDesktop`/`HomeMobile` ya tienen un `TODO(agente, TS-06/TS-07)` y los imports comentados para
  reincorporarlos al armar el contenido de Home. `TS-07` del plan los reutiliza.
- `components/chat/`: se borraron `ChatList.jsx`, `ChatWindow.jsx`, `MessageBubble.jsx` (chat de Salas).
- `features/rooms`, `features/search`, `features/playlists`, `features/social`: placeholders vacíos.
- `services/`: se borraron `playlistsService.js`, `roomsService.js`, `recommendationsService.js`
  (se rehacen en sus tareas). `services/api.js` quedó solo con `export const API_BASE_URL = '/api/v1'`.

---

## 5. Decisiones abiertas de `AGENTS.md` (sección 5)

- **Librería HTTP:** definir `axios` vs `fetch` nativo dentro de `services/api.js`, más interceptores
  de auth. Hoy `authService`/`usersService`/`songsService` trabajan contra `mocks/` y no pasan por `api.js`.
- **WebSockets:** definir `services/socketService.js` para el chat de Salas y la sincronización de
  reproducción entre miembros.
- **Estado global:** evaluar si `Context` alcanza o conviene un gestor (p. ej. Zustand) cuando
  aparezcan las features que aún faltan.

---

## 6. `pages/Landing/Landing.css` tiene su propia paleta

**Contexto:** el landing (ruta `/`, fuera de `AppRoutes`) trae 660 líneas de CSS con 59 hex
propios — grises (`#f4f4f5`, `#8b8b96`, `#6b6b76`), violetas (`#8b5cf6`, `#a78bfa`, `#c4b5fd`),
cian `#22d3ee`, verde `#22c55e` — más 3 hex en `Landing.jsx`. Ninguno pertenece al design system
de `src/styles/`, así que es la única fuente de estilos que quedó fuera de la centralización de
tokens (se dejó así a propósito: mezclarla con la reorganización de estilos sin decidir el
rediseño).

**Qué hacer:** decidir si el landing se migra a los tokens del design system (reescribiendo su CSS
con `var(--ds-*)` o directamente con clases) o si se descarta por estar fuera del alcance del
Sprint 1. Recordar la regla 11 de `AGENTS.md`: los literales solo pueden vivir en
`styles/tokens.css`.
<<<<<<< Updated upstream
========================

---

## 7. Opcional: garantía de "no repetir hasta agotar la lista" en shuffle

**Prioridad:** opcional. No está asignado a ningún sprint; queda registrado como posible adición.
**Estado:** no implementado. El reproductor hoy funciona con una ventana de 10 canciones previas.

**Contexto:** en aleatorio, `next()` (`PlayerContext.jsx`) excluye la canción actual y las últimas
10 del historial (`SHUFFLE_MEMORY`). Eso garantiza "no repetir dentro de las últimas 10", que no es
lo mismo que "no repetir hasta agotar la lista": con la ventana quedan fuera 11 índices como máximo,
así que a partir de **12 canciones** en la cola un tema puede volver a sonar mientras quedan otros
sin tocar. El caso favorable (cola ≤ 11) es justamente el que muestra el mock, que tiene 8
canciones, por eso el defecto no se ve en el navegador. Con el backend (playlist de 30, cola de una
sala, catálogo completo) aparece solo.

**Qué hacer:** reemplazar la ventana por una *shuffle bag* —una bolsa con los índices restantes de
la pasada actual, barajada con Fisher–Yates al reponerse—, de modo que cada canción suene
exactamente una vez por pasada y el repeat solo pueda ocurrir al reponer. Encaja en un módulo puro
nuevo `src/lib/shuffle.js` (crear/reponer bolsa, tomar el siguiente, quitar un índice) para que la
lógica no viva en el provider y sea testeable. En `PlayerContext.jsx`: reemplazar `SHUFFLE_MEMORY` y
el bloque `visited`/`fresh` por la bolsa, refonerla al quedar vacía en `next()`, vaciarla en
`playSongs()` y en cada cambio de `toggleShuffle()`, y **sacarle el índice destino cuando se usa
`previous()`**, para no repetir la canción a la que se acaba de volver. `nextFromShuffleBag()` toma
el último elemento de la bolsa ya barajada, así que no hace falta un paso de selection aparte.

**Verificación:** agregar **vitest** al Frontend (la 5.0.3 declara `vite: ^6.4 || ^7 || ^8` en sus
peerDependencies, compatible con el Vite 8.3.0 del proyecto) con scripts `test` / `test:watch` y
config `environment: 'node'` —la lógica es pura, no hace falta `jsdom` ni testing-library—. Con un
PRNG sembrado (mulberry32) como `random` inyectable, testear que: la bolsa inicial es una permutación
de `0..n-1`; en dos pasadas sobre n = 30 cada índice aparece exactamente una vez antes de cualquier
repetición; una bolsa no vacía no se re-baraja; al reponer se excluye la canción en reproducción; y
tras un `previous()` el índice destino no puede volver a salir. Ojo: `npm i -D vitest` modifica
`package-lock.json`.

**Nota:** el historial de `previous()` y la bolsa son estado de cliente, así que nada de esto depende
del backend; el endpoint solo cambia de dónde viene la cola.

---

## 8. Conectar el frontend con `/api/songs`

**Estado:** la integración quedó completa. `listSongs()`, `getSongById()` y `searchSongs()` van contra
el backend real, y el backend se ajustó para el paginado por offset y los nombres de género.
Contrato en `ESPECIFICACIONES-BACKEND.md` (raíz).

Lo que queda son decisiones de producto y la validación contra la base real (8.4–8.8).

### 8.1 Paginación de `/buscar` — resuelto en backend

**Qué se hizo:** `song.service.js::searchSongs` pasó de cursor a offset (`skip: (page - 1) * pageSize`,
`take: pageSize`) con `prisma.song.count({ where })` en la misma transacción, y devuelve
`{ items, total, page, pageSize, totalPages }`. El controller pasa `page`/`pageSize` sin castear y
`parsePagination` los acota (≥ 1, tope `50`). Página fuera de rango → se sirve la última con contenido
y se devuelve `page` corregido.

**Por qué no se degradó la pantalla:** se evaluó reescribir `SearchSongs.jsx` a anterior/siguiente con
cursor, pero se perdía la fila de números y el salto directo.

### 8.2 Etiqueta de género — resuelto

`SONG_INCLUDE` ahora usa `songGenres: { include: { genre: true } }` (idem `songMoods`), así que el
payload trae el nombre y `songsService.toSong()` lo mapea a `song.genre`. Las cards de `/home` y
`/buscar` vuelven a mostrar la etiqueta.

### 8.3 La búsqueda por álbum se eliminó del contrato

**Qué pasa:** el catálogo mock tenía `album` y `searchSongs()` mock filtraba por `title`, `artist`,
`album` y `genre`. El backend no tiene columna `album` en el esquema (`song` es título/artista/
release_date/cover_url/duration/url) y su filtro cubre título, artista y género.

Por eso se **quitó "álbumo" del copy** de `SearchSongs.jsx`: la pantalla ya no promete algo que el
backend no cumple. Si más adelante se agrega la columna `album` y su filtro, hay que devolver el
nombre en el payload y reponer la palabra en el copy.

### 8.4 `album` y `source` no existen en el esquema

`PlayerBar` usaba `song.album` como `alt` de la carátula y `song.source` para la línea
"Reproduciéndose desde". Con el payload real ambos son `null`:

- `album`: no rompe, el `alt` ya cae a `song.title`.
- `source`: la línea se oculta sola (el render está guardado con `song?.source ?`).

**Qué hace falta para `source`:** decidir de dónde sale. "Reproduciéndose desde" debería ser el origen
real de la canción (nombre de playlist o sala), que requiere saber de qué playlist o sala se pidió
reproducir: o el endpoint lo recibe como query param, o el frontend lo calcula al armar la cola.

### 8.5 Bugs de backend encontrados al conectar — corregidos

- `song.controller.js` hacía `query.trim()` sin guarda: `/api/songs/search` **sin** `?query=` lanzaba
  `TypeError` → 500. Ahora el service normaliza a `""` y devuelve el catálogo paginado.
- `Number(cursor)` daba `NaN` si faltaba el cursor. Sin efecto al pasar a offset, pero ya no se castea.

### 8.6 Auth sigue en mocks, a propósito

**Desactualizado.** Auth, edición de perfil y seguimiento ya se migraron al backend (PR #20/#21 y la
migración de follow). Ver §9. Se conserva el texto original como registro.

`authService`/`usersService` quedaron con `mocks/users.js`. El backend ya expone
`POST /api/auth/register`, `/login` y `/logout` (montados dos veces en `app.js`, en `/api/auth` y
`/api/v1/auth`), pero conectar eso excede esta entrega y arrastra el manejo de JWT: `logout` requiere
token (`authenticate` middleware) y `api.js` todavía no manda `Authorization`. Queda para un sprint
aparte. Nota: `mocks/users.js` genera ids con `crypto.randomUUID()`, que **no** son los enteros
`SERIAL` de la base, así que al migrar hay que revisar `getUserById`.

### 8.7 `mocks/songs.js` quedó sin uso

Ningún módulo lo importa más. **No se borró**, a propósito y esperando poder validar contra el
endpoint real con la base conectada. Cuando se borre, también se puede reducir `SEARCH_PAGE_SIZE` y la
lógica de normalización de acentos de `songsService.js`, que ya no aplican.

### 8.8 Verificación pendiente contra la base real

La **lógica de paginación** sí se verificó: script temporal con Prisma interceptado y 137 canciones
sintéticas, cubriendo `skip`, clamping de página fuera de rango, última página parcial, defaults para
valores ausentes/`"0"`/`"abc"`, tope de `pageSize` y recorrido completo de las 14 páginas sin repetidos
ni saltos. Todas las comprobaciones pasaron; el script se eliminó después.

Lo que **no** se pudo probar es el fetch real: no responde en `localhost:3000`, Docker no está
levantado y no existe `Backend/.env` (solo `.env.example`, sin `DATABASE_URL`), así que Prisma no tiene
a qué conectarse. `npm run build` y `npm run lint` pasan (solo los 3 warnings preexistentes), pero eso no
ejercita la red ni el include anidado de género contra Postgres.

Para cerrar: `docker compose up -d` en `Backend/`, copiar `.env.example` a `.env` con las `POSTGRES_*` y
`DATABASE_URL`, `npx prisma migrate dev`, `npx prisma db seed`, `npm run dev`, y recién ahí levantar el
Frontend. Comandos de `curl` en `ESPECIFICACIONES-BACKEND.md` §5.2.

---

## 9. Seguimiento migrado al backend

**Estado:** migrado. Auth y edición de perfil van contra el backend desde PR #20/#21; el seguimiento
(TS-10) también, sobre `POST`/`DELETE /api/users/:id/follow` y `GET /api/users/:id/followers|following`.

### 9.1 Qué se conectó

- `usersService.js`: `followUser`, `unfollowUser`, `getFollowCounts`, `isFollowing`, `listFollowing` y
  `listFollowers` contra el backend real. Se eliminó el mock de follow (`synthos_mock_follows`) y el
  contenedor de usuarios mock que sólo servía para resolverlo.
- `getFollowCounts` usa `GET /api/users/:id` (`followerCount`/`followingCount`, agregados en `f48a224`).
- `isFollowing` no tiene endpoint directo: se deriva de `GET /api/users/:id/followers`.
- `subscribeToFollow` avisa a `useFollow` (y desde ahí al `ProfileSummary` del Sidebar, `ProfileView` y
  `ProfilePublic`) para que contadores y listas se refresquen al seguir/dejar de seguir desde otra vista.
- `FollowList` ya resuelve `listFollowers`/`listFollowing` contra la base, así que las listas de
  seguidores/seguidos muestran usuarios reales.

### 9.2 Lo que queda pendiente

1. **Listas sin paginar:** `GET /users/:id/followers|following` devuelven el array completo, no un envelope
   con `page`/`total`.
2. **`isFollowing` en `GET /users/:id`:** hoy el perfil público hace dos llamadas (contadores + relación).
   Incluir `isFollowing` para el usuario del token lo dejaría en una sola.
3. **Respuesta de `follow`/`unfollow`:** sigue siendo `{ status, message }`, así que `useFollow` re-consulta
   el estado (`relationState`).
