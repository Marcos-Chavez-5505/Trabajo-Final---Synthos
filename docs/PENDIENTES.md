# Pendientes

Backlog vivo: lo que **falta**. El estado actual del código está resumido en `CONTEXT.md` y la
estructura del repo en `ESTRUCTURA.md`.

Estado al 2026-10-08 (HEAD `419a5ac`, rama `dev`): `npm run build` compila y `npm run lint` solo
reporta 3 warnings preexistentes de `components/ui/*` (`only-export-components`) y
`hooks/use-mobile.ts` (`set-state-in-effect`).

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

## 2. `lucide-react` sigue en uso en cuatro archivos

**Contexto:** la regla 10 de `AGENTS.md` pide íconos solo desde `src/assets/*.svg` (set de diseño
propio, importados como URL y usados con `<img>`), nunca de librerías. `lucide-react` todavía se
importa en cuatro archivos:

- `components/layout/Sidebar.jsx` — un import con los ítems del nav: `Home`, `Flame`, `User`,
  `ListMusic`, `Disc3`, `Mic2`.
- `features/playlists/MisPlaylists.jsx` — `ListMusic`.
- `components/ui/sidebar.tsx` (`PanelLeftIcon`) y `components/ui/sheet.tsx` (`XIcon`) —
  componentes generados por shadcn.

**Qué hacer:** mapear cada ítem del `Sidebar` y de `MisPlaylists` a su SVG del set y cambiar el
render (hoy `<Icon />`, debe pasar a `<img src={...} alt="" aria-hidden="true" className="h-5 w-5" />`).
Decidir qué hacer con `ui/`: son componentes de shadcn y `npx shadcn add` los regenera con lucide,
así que o se dejan con la excepción escrita en la regla 10 o se editan sabiendo que el CLI los puede
pisar. Cuando no quede ningún import, sacar `lucide-react` de `package.json`.

---

## 3. Decisiones abiertas de `AGENTS.md` (sección 5)

- **WebSockets:** definir `services/socketService.js` para el chat de Salas y la sincronización de
  reproducción entre miembros.
- **Estado global:** evaluar si `Context` alcanza o conviene un gestor (p. ej. Zustand) cuando
  aparezcan las features que aún faltan.

*(La librería HTTP ya se definió: `fetch` nativo dentro de `services/api.js`, con helpers
`get/post/patch/put/del`.)*

---

## 4. Opcional: garantía de "no repetir hasta agotar la lista" en shuffle

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

## 5. Conectar el frontend con `/api/songs`

**Estado:** la integración quedó completa. `listSongs()`, `getSongById()` y `searchSongs()` van contra
el backend real, y el backend se ajustó para el paginado por offset y los nombres de género.
Contrato en `ESPECIFICACIONES-BACKEND.md` (`docs/`).

Lo que queda son decisiones de producto y casos sin cubrir (5.4–5.7).

### 5.1 Paginación de `/buscar` — resuelto en backend

**Qué se hizo:** `song.service.js::searchSongs` pasó de cursor a offset (`skip: (page - 1) * pageSize`,
`take: pageSize`) con `prisma.song.count({ where })` en la misma transacción, y devuelve
`{ items, total, page, pageSize, totalPages }`. El controller pasa `page`/`pageSize` sin castear y
`parsePagination` los acota (≥ 1, tope `50`). Página fuera de rango → se sirve la última con contenido
y se devuelve `page` corregido.

**Por qué no se degradó la pantalla:** se evaluó reescribir `SearchSongs.jsx` a anterior/siguiente con
cursor, pero se perdía la fila de números y el salto directo.

### 5.2 Etiqueta de género — resuelto

`SONG_INCLUDE` ahora usa `songGenres: { include: { genre: true } }` (idem `songMoods`), así que el
payload trae el nombre y `songsService.toSong()` lo mapea a `song.genre`. Las cards de `/home` y
`/buscar` vuelven a mostrar la etiqueta.

### 5.3 La búsqueda por álbum se eliminó del contrato

**Qué pasa:** el catálogo mock tenía `album` y `searchSongs()` mock filtraba por `title`, `artist`,
`album` y `genre`. El backend no tiene columna `album` en el esquema (`song` es título/artista/
release_date/cover_url/duration/url) y su filtro cubre título, artista y género.

Por eso se **quitó "álbumo" del copy** de `SearchSongs.jsx`: la pantalla ya no promete algo que el
backend no cumple. Si más adelante se agrega la columna `album` y su filtro, hay que devolver el
nombre en el payload y reponer la palabra en el copy.

### 5.4 `album` y `source` no existen en el esquema

`PlayerBar` usaba `song.album` como `alt` de la carátula y `song.source` para la línea
"Reproduciéndose desde". Con el payload real ambos son `null`:

- `album`: no rompe, el `alt` ya cae a `song.title`.
- `source`: la línea se oculta sola (el render está guardado con `song?.source ?`).

**Qué hace falta para `source`:** decidir de dónde sale. "Reproduciéndose desde" debería ser el origen
real de la canción (nombre de playlist o sala), que requiere saber de qué playlist o sala se pidió
reproducir. El frontend ya lleva el origen de la cola (`queueSourceRef = { playlistId, isFavorites }`
y `playSongs(songs, startIndex, source)`), falta decidir el label y pintarlo.

### 5.5 Bugs de backend encontrados al conectar — corregidos

- `song.controller.js` hacía `query.trim()` sin guarda: `/api/songs/search` **sin** `?query=` lanzaba
  `TypeError` → 500. Ahora el service normaliza a `""` y devuelve el catálogo paginado.
- `Number(cursor)` daba `NaN` si faltaba el cursor. Sin efecto al pasar a offset, pero ya no se castea.

### 5.6 `mocks/songs.js` quedó sin uso

Ningún módulo lo importa más. **No se borró**, a propósito y esperando poder validar contra el
endpoint real con la base conectada. Cuando se borre, también se puede reducir `SEARCH_PAGE_SIZE` y la
lógica de normalización de acentos de `songsService.js`, que ya no aplican.

### 5.7 Verificación contra la base real — mayormente cubierta

**Estado (2026-10-08): la base está levantada.** Existe `Backend/.env`, los contenedores
`SYNTHOS_POSTGRES`/`SYNTHOS_PGADMIN` están corriendo, `npx prisma migrate status` informa
`6 migrations found` y `Database schema is up to date!`, y el seed cargó 97 canciones.

Además de eso, la **lógica de paginación** se había verificado antes con un script temporal que
intercepta el `require` de `prismaClient` y usa un catálogo sintético de 137 canciones: `skip`,
clamping de página fuera de rango, última página parcial, defaults, tope de `pageSize` y recorrido
completo de las 14 páginas. Todas pasaron; el script se eliminó después.

**Suite de humo por HTTP contra la base real (2026-10-08): 41 de 42 chequeos pasaron:**

- `GET /health`, `GET /songs` (cursor), `GET /songs/:id` (200 y 404), `GET /songs/search`
  (offset, clamping `page=999` → última página, query vacía = catálogo completo, 97 canciones).
- `GET /rooms?sort=rating` (trae `avg_rating`) y `sort` inválido → 400.
- `GET /users/search` (envelope offset, claves `picture_url`/`biography`/`genre_name` en snake_case,
  query vacía → 200 con todos los usuarios).
- Auth: `login` 200 con token / password malo 401; `register` 201 con token, 400 con `errors[]`,
  email repetido 400; `GET /users/me` con `email` y 401 sin token.
- Playlists: crear 201 (`type: personal`), name vacío o >50 → 400, `addSongs` idempotente (200,
  no 409), `GET /:id` con las canciones incluidas, playlist ajena → 404 (GET) / 403 (DELETE),
  borrar → 200 y 404 después.
- Favoritos: `GET /songs/ids`, agregar 201, repetir 409, quitar 200, quitar algo que no estaba 404.
- Follow: `followers`/`following`, contadores en `GET /users/:id`, seguir 200 idempotente,
  dejar de seguir 200 y otra vez → 404. `GET /users/abc` → 400.

**Bug encontrado y aún abierto:** `PUT /api/playlists/:id` con `addSongs` de un id **no numérico**
responde **500** (`P2023` de Prisma sin mapear en `errorHandler`); con un id numérico inexistente
responde 409 (FK `P2003`). Anotado en `REQUERIMIENTOS-BACKEND.md` §2 (avisos de errores).

**Queda sin cubrir:** `PATCH /users/me`, `PUT /playlists/:id` con `name`/`description`/
`removeSongs`/`reorder`, `POST /auth/logout`, y la prueba visual en navegador (§1). La suite dejó un
usuario de prueba (`verifdocs`) porque no hay endpoint para dar de baja usuarios; el resto de las
escrituras (playlist, favorito, follow) se revirtieron.

---

## 6. Seguimiento migrado al backend

**Estado:** migrado. Auth y edición de perfil van contra el backend desde PR #20/#21; el seguimiento
(TS-10) también, sobre `POST`/`DELETE /api/users/:id/follow` y `GET /api/users/:id/followers|following`.

### 6.1 Qué se conectó

- `usersService.js`: `followUser`, `unfollowUser`, `getFollowCounts`, `isFollowing`, `listFollowing` y
  `listFollowers` contra el backend real. Se eliminó el mock de follow (`synthos_mock_follows`) y el
  contenedor de usuarios mock que sólo servía para resolverlo.
- `getFollowCounts` usa `GET /api/users/:id` (`followerCount`/`followingCount`, agregados en `f48a224`).
- `isFollowing` no tiene endpoint directo: se deriva de `GET /api/users/:id/followers`.
- `subscribeToFollow` avisa a `useFollow` (y desde ahí al `ProfileSummary` del Sidebar, `ProfileView` y
  `ProfilePublic`) para que contadores y listas se refresquen al seguir/dejar de seguir desde otra vista.
- `FollowList` ya resuelve `listFollowers`/`listFollowing` contra la base, así que las listas de
  seguidores/seguidos muestran usuarios reales.

### 6.2 Lo que queda pendiente

1. **Listas sin paginar:** `GET /users/:id/followers|following` devuelven el array completo, no un envelope
   con `page`/`total`.
2. **`isFollowing` en `GET /users/:id`:** hoy el perfil público hace dos llamadas (contadores + relación).
   Incluir `isFollowing` para el usuario del token lo dejaría en una sola.
3. **Respuesta de `follow`/`unfollow`:** sigue siendo `{ status, message }`, así que `useFollow` re-consulta
   el estado (`relationState`).

---

## 7. La foto de perfil se guarda como base64 dentro de una columna de texto

**Estado:** la edición de perfil sí conecta con el backend de punta a punta — `ProfileEdit.jsx` →
`useAuth().updateProfile()` → `usersService.updateProfile()` → `PATCH /api/users/me` →
`userController.updateMe` → `userService.updateUser`. El service traduce los nombres de la UI a los del
backend (`bio`→`biography`, `avatarUrl`→`pictureUrl`), valida username (3-50 caracteres, no tomado) y
persiste con un `update` parcial: solo toca los campos que llegan definidos. Devuelve con
`ME_USER_SELECT`, que incluye justo los campos que `toUser` necesita, así que `setUser` actualiza
sidebar, header y perfil sin recargar.

Lo que queda mal es el trato de la foto.

**Contexto:** `ProfileEdit.jsx` lee el archivo con `FileReader.readAsDataURL()` y manda el data URI
completo dentro del `PATCH` JSON. El backend lo acepta sin límite de tamaño ni validar que sea una
imagen, y `prisma.user.pictureUrl` es un `String?`, o sea lo escribe tal cual. Un JPEG de 2 MB produce
un body de ~2.7 MB contra una columna de texto: funciona, pero es lo que revienta en cuanto alguien
suba una foto de un celular moderno. Además, cuando el username está tomado,
`Backend/src/services/user.service.js` lanza `"Ese nombre de usuario ya está en uso."` con
`error.code = 400` y el frontend lo pinta tal cual.

**Qué hacer:** mover la foto a un upload real —endpoint de multipart en el backend que guarde el binario
y devuelva una URL— y mandar solo esa URL en `pictureUrl`. Si el proyecto no va a sumar almacenamiento de
archivos todavía, el arreglo barato es al menos acotar tamaño y tipo en ambos lados, para que la columna no
reciba un data URI arbitrario.

**Verificación:** subir una imagen de tamaño realista y confirmar que el `PATCH` pesa kilobytes y no
megabytes. La base real ya está levantada (§5.7), así que no hay excusa para no probarlo.

### 7.1 Feedback y validación de la edición de perfil

Menor, va junto con lo anterior:

- `ProfileEdit.jsx:86` deshabilita el botón Guardar con `loading`, que es el flag de carga de la sesión
  (`AuthContext`), no un estado de submit. Mientras guardás no se bloquea nada, así que un doble click
  manda dos PATCH. Le falta un `saving` propio.
- El error de username tomado se muestra crudo desde el service. Hoy coincide porque los dos textos
  están en español, pero es acoplamiento por coincidencia; conviene un mapa de errores o un `code`
  estable que el frontend pueda traducir.
- `ProfileEdit.jsx:79` tiene un `TODO: falta token de color para placeholder` que es deuda de la regla 11
  (los literales solo viven en `styles/tokens.css`); de paso el `placeholder` está hardcodeado a
  `placeholder-neutral-500` en los inputs.
