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

> **Actualizado 2026-10-14:** el layout mobile ya no existe (ver §8), así que las líneas que hablaban de
> `MiniPlayerBar`, `BottomNav` y del responsive alternado quedaron sin sentido y se sacaron de la lista.
> `CONTEXT.md` §4.6 sigue describiendo el layout viejo y hay que corregirlo cuando se retome mobile.

**Qué verificar:**

- Reproducción real: play/pause y que suene audio; que `currentTime`/`duration` se actualicen.
- Al terminar una canción (`ended`): con `repeat: 'off'` detiene, con `'list'` vuelve al inicio,
  con `'track'` repite.
- `next`/`previous` (incluido el "si pasaron más de 3s, reinicia" de `previous`) y el wrap de la cola.
- Shuffle y repeat mantienen estado durante la sesión; los botones activos se ven sobre `Fucsia`.
- `ProgressBar`: click, arrastre (`setPointerCapture`) y teclado (←/→ 5s, `Home`).
- Que los SVG se vean en `PlayerBar`.
- Que las clases del design system (`Wall`, `Surface`, `Fucsia`, `Volume`, `SurfaceLight`,
  `TextRegluar`, `TextMedium`, `Elevation1`…) sigan pintando bien: ahora viven en
  `@layer components`, así que una utilidad Tailwind las puede sobrescribir
  (`className="Wall bg-red-500"` ya no manda la clase del design system).
- Los deltas visuales de la centralización de tokens: fondo `body` `#0a0713` → `#1e1e1e` (`Surface`),
  texto `#f2eefb` → `#f4f0f9` (`Lighter`), muted `#a89dc4` → `#b0a4b5` (`LightMuted`), texto sobre
  `Fucsia` `#1a0711` → `#1e1e1e` (`Surface`, 4.85:1 → 4.17:1), `ring`/`text-accent` `#e91e63` →
  `#ef2f62` (`Fucsia`) y `::selection` ahora en `Fucsia`.
- En un viewport angosto: que no se rompa nada, aunque hoy no haya experiencia mobile (§8).

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

- **WebSockets:** resuelto para la sincronización de salas (2026-10-18). `services/socketService.js`
  + Socket.IO, con handshake por JWT. **El chat de salas sigue sin existir**: no hay tabla
  `room_message` ni eventos que lo transmitan.
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

### 5.3 La búsqueda por álbum — resuelta (2026-10-15)

**Qué pasaba:** el catálogo mock tenía `album` y `searchSongs()` mock filtraba por `title`, `artist`,
`album` y `genre`. El backend no tenía columna `album`, así que se quitó la palabra del copy de
`SearchSongs.jsx` para no prometer lo que el endpoint no cumplía.

**Cómo quedó:** el feature de álbumes trajo el modelo `Album` (migración `20261015215159_add_album`) con
`Song.idAlbum`. `SONG_INCLUDE` ahora trae `album: { id, name }`, el filtro de `searchSongs` matchea también
el nombre del álbum y el copy volvió a decir "Buscá por título, artista, género o álbum". Verificado contra
la base real: `?query=Woods` devuelve las 3 canciones del álbum "Woods of Chaos".

### 5.4 `source` sigue sin existir (el álbum ya no)

`PlayerBar` usaba `song.album` como `alt` de la carátula y `song.source` para la línea
"Reproduciéndose desde":

- `album`: **resuelto**, ahora llega el nombre real y el `alt` lo usa de verdad.
- `source`: la línea se oculta sola (el render está guardado con `song?.source ?`).

**Qué hace falta para `source`:** decidir de dónde sale. "Reproduciéndose desde" debería ser el origen
real de la canción (nombre de playlist o sala), que requiere saber de qué playlist o sala se pidió
reproducir. El frontend ya lleva el origen de la cola (`queueSourceRef = { playlistId, isFavorites }`
y `playSongs(songs, startIndex, source)`), falta decidir el label y pintarlo.

### 5.5 Bugs de backend encontrados al conectar — corregidos

- `song.controller.js` hacía `query.trim()` sin guarda: `/api/songs/search` **sin** `?query=` lanzaba
  `TypeError` → 500. Ahora el service normaliza a `""` y devuelve el catálogo paginado.
- `Number(cursor)` daba `NaN` si faltaba el cursor. Sin efecto al pasar a offset, pero ya no se castea.

### 5.6 `mocks/` — resuelto y eliminado (2026-10-18)

Se borraron `mocks/songs.js`, `mocks/playlists.js` y `mocks/users.js` el 2026-10-14, y con las salas
entregadas se borró la carpeta entera: `mocks/rooms.js` era el último que quedaba, importado solo
por `roomsService`. **Ya no queda ningún mock en el repo**: toda la app habla con la API.

### 5.6b Salas — entregados los cuatro bloques (2026-10-18)

Plan: `docs/plan/sprint-2-salas-plan.md` (B11–B21 + F8, F11–F14). **No queda nada pendiente de
salas salvo el chat.** Verificado contra la base real: 80 chequeos de API y 9 de socket.

- **Fase 1** `GET /rooms?query=&sort=name|rating&order=asc|desc` con `members_count`/`songs_count`,
  filtrando privadas y cerradas. **Fuga corregida:** antes la query proyectaba `room.*` y el
  endpoint **público** devolvía `password_hash` de cada sala; ahora las columnas van una por una y
  los endpoints que devuelven la sala entera (crear, unirse, detalle) la filtran con `safeRoom`.
- **Fase 2** crear por playlist propia **o de una colaborativa** (D19), unirse por código, salir
  (el anfitrión que sale cierra la sala, D16), detalle con miembros y canciones, y
  `GET /rooms/mine` para el grupo "Mis Salas" del Sidebar.
- **Fase 3** Socket.IO: handshake por JWT, canal `room:<id>` solo para miembros, eventos
  `room:playback` / `room:members` / `room:skip-votes` / `room:rating` / `room:kicked` /
  `room:closed`, control de reproducción del anfitrión, expulsión y cierre. En el frontend, "modo
  sala" del `PlayerContext` (apaga aleatorio y repetición, y el `onEnded` del anfitrión pide el
  `next` al servidor) más corrección de deriva cada 2 s.
- **Fase 4** votar para saltar (mayoría sobre no-anfitriones, D17) y calificar al anfitrión (TS-11),
  con el promedio visible en su perfil.

**Bugs corregidos de paso:**

- `pause` guardaba `positionMs` sin sumarle el tiempo transcurrido, así que **pausar reiniciaba la
  canción para todo el mundo**. Ahora congela la posición real y `play` reanuda desde ahí.
- `deleteRoomState` estaba definido pero **nunca se llamaba**: el estado de reproducción en memoria
  sobrevivía al cierre de la sala. Ahora se limpia en `DELETE /rooms/:id` y cuando sale el anfitrión.
- `socket.io` estaba en `package.json` y en el lockfile pero **no en `node_modules`**: el backend no
  arrancaba hasta correr `npm install`.

**Deuda que dejó el bloque:**

- `POST /api/rooms/:id/playback` con dos ingresos simultáneos al mismo tiempo no garantiza el tope
  de 10: la transacción de `joinRoom` relee el cupo, pero con el nivel de aislamiento por defecto de
  Postgres (`ReadCommitted`) dos transacciones pueden pasar el chequeo a la vez. Para que sea
  estricto hace falta aislamiento `Serializable` o un lock.
- El rating del anfitrión es una escala 1–5 en el esquema, pero `POST /:id/rating` recibe el valor
  en el body y la UI todavía **no lo manda**: el botón está implemented en `RoomView.jsx` y envía
  `1`. Con la escala unificada, ordenar por calificación se reduce en la práctica a "calificada
  antes que no calificada". Ver **D21** del plan de salas.
- La barra de progreso de la sala es de solo lectura para los miembros: no hay endpoint para
  buscar dentro de la canción, así que la posición es del servidor.

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

**Bug encontrado y ya resuelto (2026-10-14):** `PUT /api/playlists/:id` con `addSongs` de un id **no
numérico** respondía 500 (`P2023` sin mapear). Ahora `errorHandler.js` mapea `P2023 → 400`.

**Sigue sin cubrir:** `PATCH /users/me` (ya verificado a mano en TS-21), `PUT /playlists/:id` con
`name`/`description`/`removeSongs`/`reorder`, `POST /auth/logout`, y la prueba visual en navegador
(§1). La suite dejó un usuario de prueba (`verifdocs`) porque no hay endpoint para dar de baja
usuarios; el resto de las escrituras se revirtieron.

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
- `searchUsers` suma la relación **completa** por resultado cuando hay sesión (TS-10b): el backend
  la resuelve en la misma query de búsqueda con dos `EXISTS` (`isFollowing` y `followsMe`);
  `SearchPersonRow` usa ambos para el botón y la etiqueta mutua.

### 6.2 Lo que queda pendiente

1. **Listas sin paginar:** `GET /users/:id/followers|following` devuelven el array completo, no un envelope
   con `page`/`total`.
2. ~~**`isFollowing` en `GET /users/:id`**~~ → **resuelto por otra vía (2026-10-14):** el perfil público
   ya no deriva la relación de dos llamadas. `useFollow` consulta `GET /users/:id/follow-status`, que
   devuelve los dos sentidos y `isMutual` en un solo request, y `usersService.isFollowing` (que bajaba
   la lista completa de seguidores para mirar un id) se eliminó. Lo que **queda** es puramente cosmético:
   `GET /users/:id` se pide 2-3 veces por visita al perfil (el perfil, los contadores de `useFollow` y la
   relación), porque no hay un endpoint que devuelva usuario + contadores + relación juntos.
3. **Respuesta de `follow`/`unfollow`:** sigue siendo `{ status, message }`, así que `useFollow` re-consulta
   el estado (`relationState` → `follow-status` + contadores). Con los códigos de error (§9) el mensaje ya
   no es lo único que la UI puede usar.

---

## 7. La foto de perfil se guardaba como base64 dentro de una columna de texto

**Estado: cerrado (2026-10-13, TS-21).** La foto ya no viaja en el JSON ni entra a la base: va por
`POST /api/users/me/picture` (multipart) a ImageKit y lo que se persiste es la URL pública. Contrato
completo en `ESPECIFICACIONES-BACKEND.md` §7.1; resumen de la tarea en `plan/sprint-2-plan.md` (TS-21).

**Lo que había:** `ProfileEdit.jsx` leía el archivo con `FileReader.readAsDataURL()` y mandaba el data
URI completo dentro del `PATCH`. El backend lo aceptaba sin límite de tamaño ni validar que fuera una
imagen y lo escribía tal cual en `prisma.user.pictureUrl` (`String?`): un JPEG de 2 MB producía un body
de ~2,7 MB contra una columna de texto.

**Lo que hay ahora:**

- `POST /api/users/me/picture` con `multer` (memoria + `fileFilter`), tope de 2 MB, JPG/PNG/WEBP, y
  `PATCH /users/me` rechaza con 400 cualquier data URL. `express.json()` volvió a su límite por defecto.
- Recorte (1024 px) y compresión (≤1 MB) en el navegador, antes de subir: el body de una serverless
  function de Vercel corta ~4,5 MB, así que el archivo crudo no era viable.
- Un archivo por usuario en ImageKit (nombre determinista + `useUniqueFileName: false`), sin huérfanos.
  Known: cambiar de formato (JPG → PNG) deja el archivo viejo.
- Cliente de ImageKit perezoso: sin `IMAGEKIT_PRIVATE_KEY` el server arranca igual y el upload responde
  500 en español.

**Verificación:** con `curl` contra la base real y contra ImageKit (200 con la URL servible, 400 sin
archivo / tipo no permitido / 3 MB, 401 sin token, 400 con data URL en el `PATCH`, `?v=` rompiendo caché
y el contador de archivos en `/avatars` sin crecer al resubir), y con un smoke en Chrome real (5,9 MB →
757 KB en el navegador, upload + guardado, avatar cargado en perfil y sidebar). Quedó un `PATCH` de
kilobytes, como pedía este pendiente.

### 7.1 Feedback y validación de la edición de perfil

Los tres primeros puntos quedaron resueltos el 2026-10-13/14 y ya no hacen falta como recordatorio:

- Estado de submit propio (`saving`) con `finally` (TS-21).
- Error de validación por **`code` estable** y no por texto: el backend responde
  `{ status, message, code }` (ver §9) y el frontend traduce con `utils/mapError.js`, así que cambiar
  la redacción de un mensaje ya no rompe ninguna pantalla.
- Token de placeholder: `--ds-placeholder` en `styles/tokens.css` y la clase `.Placeholder` en
  `utilities.css` reemplazaron a `placeholder-neutral-500` (deuda de la regla 11).

Lo que sigue abierto:

- Barra de progreso real en la subida: `services/api.js` tiene que pasar de `fetch` a
  `XMLHttpRequest` (no hay `upload.onprogress`). Hoy es estado textual, suficiente con ≤1 MB.

---

## 8. Mobile desmantelado — se rehará con React Native

**Estado (2026-10-11):** se sacaron del código las piezas dedicadas a mobile. `AppLayout` ya no ramifica
por breakpoint: renderiza siempre el layout de desktop (`SidebarProvider` + `Sidebar` + `TopBar` +
contenido + `PlayerBar`). `Home` también dejó de alternar y renderiza `HomeDesktop`. Se eliminaron todas
las **importaciones** a: `components/layout/BottomNav.jsx`, `components/layout/MiniPlayerBar.jsx`,
`features/home/HomeMobile.jsx` y el hook `hooks/useBreakpoint.js`.

**Contexto (por qué se hizo):** mantener dos layouts en el mismo codebase web (desktop con shadcn + un
shell mobile a mano) venía quedando a medias: `BottomNav` sin íconos, `MiniPlayerBar` atado a la altura
del `BottomNav`, `HomeMobile` como shell, breakpoints y padding duplicados (`pb-28` en el `main` mobile).
Se decidió dejar de parchar esa vía en lugar de seguir sumando excepciones.

**Qué queda a medias (a propósito):** la app web hoy no tiene experiencia mobile real. En un viewport
chico muestra el layout de desktop, sin navegación inferior ni mini reproductor. Los archivos
`BottomNav.jsx`, `MiniPlayerBar.jsx`, `HomeMobile.jsx` y `hooks/useBreakpoint.js` **siguen en disco,
sin uso** (no se borraron para conservarlos como referencia histórica); `use-mobile.ts` de shadcn sigue
siendo consumido internamente por `ui/sidebar.tsx`.

**Qué hacer (decisión):** rehacer mobile, cuando se retome, con **React Native** (app nativa/APK propia),
no con soluciones a medias dentro de la web. El layout y la interacción de mobile son distintos de los
de desktop y merecen su propia base, en vez de duplicar componentes y parchear breakpoints en el
codebase de Vite. Al encarar eso, revisar si conviene borrar los archivos mobile sin uso de arriba.

**Verificación:** `npm run lint` + `npm run build` en verde sin las importaciones mobile; confirmar que
ningún módulo referencia `BottomNav`, `MiniPlayerBar`, `HomeMobile` ni `useBreakpoint`.

**Docs desactualizados por este cambio:** `CONTEXT.md` §4.6 (Layout) y `PENDIENTES.md` §1 (smoke test,
líneas sobre `MiniPlayerBar`/`BottomNav`/responsive) todavía describen el mobile viejo; actualizar
cuando se cierre la decisión.

---

## 9. Códigos de error estables (nuevo, 2026-10-14)

**Estado: implementado.** Los errores de validación ya no dependen del texto en español para que la UI
sepa qué pasó.

- `Backend/src/utils/errors.js` expone `httpError(status, message, code, extra)`. El `code` es una cadena
  estable (`USERNAME_TAKEN`, `IMAGE_TOO_LARGE`, `FOLLOW_REQUIRED`…) y viaja en el body; el status va en
  `error.httpStatus`, así que ya no se confunde con el `code` de Prisma.
- Todos los controllers lanzan `httpError` en vez de armar el JSON a mano, y el catch-all de `app.js`
  responde `{ status, message, code }` (más `extra` si lo hay, como el `errors[]` del registro). Los 4xx ya
  no ensucian el log: solo se loguea lo que es 500 o más.
- `Frontend/src/utils/mapError.js` traduce **por `code`**, con el `message` del servidor como último
  recurso. Los 13 lugares que pintaban `cause.message` crudo usan `mapApiError`.
- `P2023` quedó mapeado a 400 en `errorHandler.js` (el bug de §5.7).

**Lo que sigue:** el `message` todavía viene del backend y se muestra tal cual para los `code`
desconocidos, así que un mensaje nuevo en inglés se vería en pantalla. La regla de la casa es
español, pero no hay lint que lo proteja.

## 10. Playlists colaborativas e invitaciones (nuevo, 2026-10-15)

**Estado: implementado de punta a punta** (TS-12 y TS-13), verificado contra la base real con dos
usuarios.

- **Crear:** `POST /api/playlists` con `type: "colab"`; el controller valida el tipo (`400
  PLAYLIST_TYPE_INVALID`) e inserta la fila `playlist_member` con rol `creator`. El frontend tenía un bug
  abierto: no mandaba `type` y **toda creación devolvía 400**; ahora `playlistsService.createPlaylist`
  manda el tipo y `PlaylistCreateForm` ofrece "Solo vos / Colaborativa".
- **Permisos:** en una `colab` cualquier participante **agrega y quita** canciones
  (`POST|DELETE /playlists/:id/songs`); editar, borrar, invitar y echar son del creador. `GET /:id` pide
  sesión y responde `404` si no sos creador, ni miembro, ni es pública.
- **Invitación dirigida (redefine TS-13):** no hay link. Se invita a una persona que ya existe
  (`POST /:id/invitation` con `{ userId }`), la invitación queda pendiente en la tabla nueva
  `playlist_invitation` y se acepta o rechaza desde la sub-pestaña **Invitaciones** de `/playlists`.
  `DELETE /:id/members/:userId` saca a un participante. Migración `20261015203304_playlist_invitation`.
- **Invitar convierte la playlist en colaborativa:** si la playlist era `personal`, la misma transacción la pasa a
  `colab` e inserta la fila del creador; la respuesta trae `converted: true` y el detalle se recarga. No existe
  el concepto de "miembro de una playlist personal"; la de favoritos es la única que no se puede invitar.
- **Reparto de pantallas:** `toPlaylist` expone `type`, `role`, `creator` y `members`, así que el Sidebar y
  `/playlists` separan "Mis Playlists" (las que creaste) de "Colaborativas" (donde participás), y el
  detalle muestra participantes e invitados con su estado.

**Lo que sigue:**

- El buscador para invitar pide **2 letras** antes de pegarle a `GET /users/search`: con la query vacía ese
  endpoint devuelve el catálogo completo. El backend sí pagina (`LIMIT`/`OFFSET`), pero el `ILIKE '%texto%'`
  no puede usar un índice; con muchos usuarios, el arreglo es un índice trigram (`pg_trgm`).
- `PUT /playlists/:id` sigue aceptando `addSongs`/`removeSongs` en lote y siendo del creador. El frontend
  ya no lo usa para canciones, así que se puede dejar hasta que aparezca un caso en lote que lo necesite.
- Sin E2E: el flujo se verificó con `curl` contra la base real, no en navegador (ver §1).


## 11. Álbumes: endpoints y pantalla (nuevo, 2026-10-15)

**Estado: implementado.** La pantalla `/albums` del Sidebar dejó de ser un placeholder, y los álbumes
también se buscan desde la pestaña nueva de `/buscar`.

- **Lo que estaba roto:** el PR de álbumes había dejado `GET /api/songs/search` devolviendo 500 en dos de
  sus tres ramas. El service usaba un `ALBUM_INCLUDE` que no estaba definido y lo exportaba como función
  suelta; el controller lo importaba con un nombre y lo usaba con otro; y el `type` sin reconocer caía en
  un `res.json({ songs, albums })` con dos variables inexistentes. Todo eso está corregido.
- **Listado:** `GET /api/songs/search?type=albums`, que reutiliza la paginación por offset de las
  canciones. `type` inválido responde `400 SEARCH_TYPE_INVALID`. Cada item trae `artist` y `_count.songs`.
- **Detalle:** `GET /api/albums/:id` → `{ status, album }` con `artist` y `songs[]`; `404 ALBUM_NOT_FOUND`.
- **Frontend:** `albumsService.js` (con su `toAlbum`), grilla paginada del catálogo (`?page=`) y
  `AlbumDetail` con "Reproducir" sobre la cola del `PlayerContext`.
- **Búsqueda:** `SearchAlbums` es la tercera pestaña de `/buscar` (`?tipo=albumes`), entre Canciones y
  Personas. Comparte `?q=` y `?page=` con las otras dos; la card lleva al detalle del disco. La página
  `/albums` **no** tiene input: solo lista y enlaza a esa pestaña.
- **Efecto colateral:** `songsService.toSong()` dejó de hardcodear `album: null`, así que el `alt` de la
  carátula del `PlayerBar` ahora es el nombre real del álbum, y el copy de `/buscar` recuperó "álbumo".

**Lo que sigue:**

- **El orden de las pistas es por `id`**: el esquema no tiene número de track. Si alguna vez importa el
  orden real del disco, hace falta una columna de posición.
- El ícono de Albums en el Sidebar sigue siendo `Disc3` de lucide-react, aunque existe
  `src/assets/album.svg`. Se deja así para no mezclar el set; migrar los cinco íconos juntos es lo que
  cierra la deuda de `lucide-react` (§2).
- Sin E2E: verificado con `curl` contra la base real (104 álbumes, 134 canciones), no en navegador.

---

## 12. Artistas: endpoints y pantalla (nuevo, 2026-10-22)

**Estado: implementado.** La pantalla `/artistas` del Sidebar dejó de ser un placeholder: lista el
catálogo paginado, permite buscar por nombre y abre el detalle con los álbumes del artista.

- **Listado:** `GET /api/artists?query=&page=&pageSize=` devuelve el mismo envelope paginado que las
  búsquedas (`{ items, total, page, pageSize, totalPages }`), ordenado por `name` asc. Cada item trae
  `_count.albums` y `_count.songs`. Es público.
- **Detalle:** `GET /api/artists/:id` → `{ status, artist }` con `_count` y `albums[]`; `404
  ARTIST_NOT_FOUND` y `400 INVALID_ID`. Cada álbum conserva la forma del listado de discos, así que el
  frontend reutiliza `toAlbum()` y `MiniMediaCard`.
- **Frontend:** `artistsService.js` con `toArtist()`/`toArtistDetail()`, `ArtistCard` (foto redonda,
  nombre y cantidad de álbumes) y las pantallas `Artists`/`ArtistDetail`. La query y la página viven en
  `?q=`/`?page=` y el input usa `useDebounce(300)`. El clic en un disco navega a `/albums/:id`.
- **Sin migración:** el modelo `Artist` y su relación con `Album` ya existían.
- **Verificación:** `curl` contra la base real y pantalla probada en navegador (listado, búsqueda y
  detalle); `npm run lint` y `npm run build` en verde.

**Lo que sigue:**

- Sin E2E automatizado: la prueba fue manual, contra el backend local.
- Los artistas se ordenan por nombre, no por popularidad ni por cantidad de álbumes. Si se pide un
  ranking de artistas, hace falta definir la métrica y probablemente un endpoint nuevo.
- El avatar del artista cae al `blobatar` determinístico solo cuando falta `pictureUrl`; si Jamendo
  devuelve una URL rota, no hay fallback de imagen (mismo comportamiento que `UserRow`).

---

## 13. Reducir la dependencia de Base UI (nuevo, 2026-10-22)

**Estado: migración completa (pasos 1–5), verificada en Chrome.** La opción elegida fue reimplementar
localmente el comportamiento que aportaba `@base-ui/react@^1.8.0` (MIT), primitiva por primitiva y
con paridad verificada. Los pasos 1–5 se hicieron sobre `dev` (sin rama ni commit, por decisión
explícita de esa tanda) porque `Button` consume `render` en la mayoría de sus call sites y el resto
del trabajo ya estaba sin commitear en el árbol. `@base-ui/react` ya no está instalado.

**Por qué.** El objetivo es **reducir dependencia**, no bajar el bundle ni "arreglar" estabilidad.
Antes de la migración, Base UI sostenía el comportamiento de ocho componentes de `components/ui/`:

| Archivo             | Módulo de Base UI            | Qué aporta                                                  |
| ------------------- | ---------------------------- | ----------------------------------------------------------- |
| `button.tsx`        | `button`                     | botón nativo + polimorfismo (`render`)                      |
| `input.tsx`         | `input`                      | input nativo + polimorfismo (`render`)                      |
| `separator.tsx`     | `separator`                  | `role`/`aria-orientation` según orientación                 |
| `tooltip.tsx`       | `tooltip`                    | trigger + popup, delay, posicionamiento, `aria-describedby` |
| `sheet.tsx`         | `dialog`                     | modal, portal, backdrop, focus trap, Escape                 |
| `alert-dialog.jsx`  | `dialog`                     | lo mismo + `role="alertdialog"` e `initialFocus`            |
| `dropdown-menu.tsx` | `menu`                       | trigger, portal, posicionamiento, teclado, submenús         |
| `sidebar.tsx`       | `merge-props`, `use-render` | composición de props y polimorfismo (`render`)              |

**Por qué reimplementar y no vendorizar.** Se evaluó copiar Base UI al repo y se descartó: son ~250
archivos `.mjs` para menú + diálogo + tooltip (más `floating-ui-react`, `internals` y `utils`) y
seguiría dependiendo de `@floating-ui/react-dom`, `@floating-ui/utils`, `use-sync-external-store` y
`@babel/runtime`. Copiar no reduce superficie: la esconde y agrega el mantenimiento de un fork. Si
alguna vez se adapta código de Base UI en lugar de reescribirlo, hay que conservar el aviso de
licencia MIT.

**Qué hacer.** El plan original era migrar en este orden, de menor a mayor riesgo, con una rama
`feat/` desde `dev` (AGENTS.md §12.1) por paso y paridad verificada **antes** de tocar el siguiente.
En esta tanda los pasos 1–5 se hicieron sobre `dev`, sin rama ni commit (ver reglas):

| Paso | Primitiva                       | Reemplazo local                                             | Estimación           | Riesgo | Estado |
| ---- | ------------------------------- | ----------------------------------------------------------- | -------------------- | ------ | ------ |
| 1    | `button`, `input`, `separator`  | nativos + `useRender` local (`src/lib/render.ts`)           | 50–100 líneas        | Bajo   | Hecho  |
| 2    | `merge-props`, `use-render`     | `mergeProps` + `useRender` propios (`src/lib/render.ts`)    | 150–250 líneas       | Medio  | Hecho  |
| 3    | `tooltip`                       | trigger/popup sobre `@floating-ui/react-dom`                | 150–250 líneas       | Medio  | Hecho  |
| 4    | `dialog` (alert dialog + sheet) | portal + focus trap + scroll lock + retorno de foco         | 300–400 líneas       | Medio  | Hecho  |
| 5    | `menu`                          | trigger, portal, posicionamiento y teclado propios          | 600–800 líneas + CSS | Alto   | Hecho  |

Notas por paso:

- **1 y 2 se tocan** y por eso se resolvieron juntos: `Button` es el que más consume `render` (la
  mayoría de los 30 usos de `render=` en 16 archivos son `Button`, `PaginationLink`,
  `SidebarMenuButton` y `TooltipTrigger`). El polimorfismo local entró primero y los primitivos se
  apoyaron en él. `sidebar.tsx` ya importa `mergeProps`/`useRender` desde `@/lib/render`.
- **Verificación de los pasos 1–2:** build verde con Base UI todavía instalado (2714 módulos,
  859,93 kB / 263,84 kB gzip) y lint sin warnings nuevos. En Chrome: inputs de login con `data-slot` y valor controlado; 12 botones del
  sidebar renderizados como `<a>` con `data-slot`/`data-size`/`data-active` y navegación real;
  trigger `<button type="button">` que alterna `expanded`→`collapsed`; tooltip del trigger abre por
  foco (`data-popup-open`, contenido "Alternar sidebar"); paginación de `/albums` con 6 links,
  `aria-current="page"` y click a `?page=3`; menú de perfil abre con `aria-expanded="true"` e ítems
  con `href`; consola sin errores. Markup SSR de `Separator` (role/aria/data-orientation), `Button`
  (default, `disabled`, `render={<a>}`) e `Input` verificado con `vite.ssrLoadModule`.
- **Verificación de los pasos 3–5:** build verde (2493 módulos, 748,93 kB / 226,95 kB gzip) y lint
  sin warnings nuevos en los archivos migrados. En Chrome: AlertDialog con `role`/`aria-modal`,
  `aria-labelledby`/`aria-describedby`, foco inicial en Cancelar (incluida la variante 9), Tab y
  Shift+Tab atrapados, Escape/backdrop cierran y devuelven foco al trigger; `JoinRoomDialog` enfoca
  el input y al cerrar vuelve a "Unirme con código"; Sheet mobile oculta el sidebar de escritorio
  al asentarse y lo restaura al cerrar (`onOpenChangeComplete`); menús con `aria-expanded`/
  `aria-controls`, roving tabindex, flechas, typeahead, checkbox que no cierra, cierre y foco al
  trigger; tooltip con delay de 600 ms, flip, arrow, `aria-describedby`, cierre al salir y `hidden`
  en sidebar expandido; consola sin errores. En Dialog y Menu el cierre se verificó por
  `data-ending-style` y desmontaje posterior; la apertura aplica `data-starting-style` durante los
  dos primeros frames. Tooltip también conserva el montaje hasta el final de su transición, pero esa
  transición mide 0s porque el proyecto no define `tailwindcss-animate`: su salida es inmediata,
  igual que antes.
- **Tooltip** (`components/ui/tooltip.tsx`) usa `@floating-ui/react-dom` directo, ya declarado en
  `package.json` en lugar de venir transitivo por Base UI. Conserva delay por proveedor/trigger,
  apertura por hover y foco, `aria-describedby`, `hidden` y el flip/arrow. El contenido oculto no se
  monta ni deja `aria-describedby`. No implementa popup hoverable ni `keepMounted`; la app no los usa.
- **Dialog** (`components/ui/dialog.jsx`) se resolvió con portal, focus trap, scroll lock, Escape,
  clic en backdrop y retorno de foco; no se usó `<dialog>` nativo. `Sheet` y `AlertDialog` se
  apoyan en el mismo núcleo. El foco inicial se resuelve con `initialFocus` (en AlertDialog va a
  Cancelar) y el retorno usa un historial de `focusin` para sobrevivir al `autoFocus` que mueve el
  foco dentro del popup antes de los efectos. Los diálogos anidados se apilan y solo el superior
  atiende Escape/Tab.
- **Menu** (`components/ui/dropdown-menu.tsx`) cubre solo la API usada por la app: trigger, portal,
  backdrop modal, positioner, popup, group/label, item, link item, checkbox item y separator.
  Quedaron afuera submenús y radio items; si una pantalla futura los necesita, se extiende el
  primitivo y se vuelve a verificar. Tiene roving tabindex, flechas/Home/End, typeahead, cierre y
  foco al trigger, y los checkbox no cierran el menú.

**Reglas de la migración:**

- Una primitiva por rama `feat/` desde `dev`; nada de big bang ni de mezclar dos pasos en un commit.
  (Los pasos 1–5 fueron la excepción: se hicieron sobre `dev` por decisión explícita de esa tanda,
  para no arrastrar el trabajo sin commitear que ya estaba en el árbol.)
- `@base-ui/react` se borró recién cuando `rg "@base-ui/react" src` no devolvió nada y el build
  quedó en verde. `npm ls @base-ui/react` sale vacío.
- Paridad antes de borrar: mismo teclado, mismos roles/atributos ARIA, mismo foco, misma animación.
  Si algo no se puede igualar, se documenta la diferencia y se decide ahí, no después. Las
  diferencias de alcance conscientes son que el menú no implementa submenús ni radio items, y que el
  tooltip no implementa popup hoverable ni `keepMounted`; la app no usa ninguna de esas partes.
- Ante la duda, no migrar: la dependencia es aceptable y el costo de un menú o un diálogo con bugs es
  mucho más alto que el de mantener Base UI.

**Verificación:** build y lint de `Frontend` en cada paso; en navegador, checklist por primitiva
(foco inicial y al cerrar, Tab/Shift+Tab, Escape, click en backdrop, flechas/Home/End, typeahead,
submenús/radio items solo si se implementan, roles y `aria-*` en el DOM, consola sin warnings nuevos,
animación de entrada y salida).
Hoy la verificación es solo en Chrome: Safari/Firefox y lectores de pantalla quedan como riesgo
abierto. `npm ls @base-ui/react` sale vacío. El bundle quedó en 748,93 kB / 226,95 kB gzip (frente a
748,24 kB / 226,63 kB de los pasos 1–2): subió apenas por el código local, no se tomó como criterio
de éxito.

**Qué falta definir:** el polimorfismo se quedó como `render` (API actual, 30 call sites), sin migrar
a `asChild`; `tooltip` conserva `@floating-ui/react-dom` como dependencia directa; y si una pantalla
necesita submenús o radio items, hay que extender `dropdown-menu.tsx` y volver a verificar esa parte.
