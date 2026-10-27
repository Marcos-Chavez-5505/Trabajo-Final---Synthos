# Pendientes

Backlog vivo: lo que **falta**. El estado actual del cÃ³digo estÃ¡ resumido en `CONTEXT.md` y la
estructura del repo en `ESTRUCTURA.md`.

Estado al 2026-10-08 (HEAD `419a5ac`, rama `dev`): `npm run build` compila y `npm run lint` solo
reporta 3 warnings preexistentes de `components/ui/*` (`only-export-components`) y
`hooks/use-mobile.ts` (`set-state-in-effect`).

---

## 0. Reestructura monorepo (completada)

Se completó la reestructura a monorepo con workspaces (`frontend`, `shared`, `mobile`; `backend` fuera).
La lógica de negocio vive en `shared/` (`@synthos/shared`) y la UI web en `frontend/`. App mobile (Expo) en `mobile/` (scaffold + login).
Ver `AGENTS.md` (estructura del monorepo y adaptadores) y `docs/plan/restructure-plan.md`.


## 1. Prueba funcional en navegador (smoke test)

**Contexto:** el build verifica que compila, no que funciona. El reproductor usa audio real
(MP3 de SoundHelix) y eventos del `<audio>` (`timeupdate`, `loadedmetadata`, `ended`), que solo
se ejercitan a mano.

> **Actualizado 2026-10-14:** el layout mobile ya no existe (ver Â§8), asÃ­ que las lÃ­neas que hablaban de
> `MiniPlayerBar`, `BottomNav` y del responsive alternado quedaron sin sentido y se sacaron de la lista.
> `CONTEXT.md` Â§4.6 sigue describiendo el layout viejo y hay que corregirlo cuando se retome mobile.

**QuÃ© verificar:**

- ReproducciÃ³n real: play/pause y que suene audio; que `currentTime`/`duration` se actualicen.
- Al terminar una canciÃ³n (`ended`): con `repeat: 'off'` detiene, con `'list'` vuelve al inicio,
  con `'track'` repite.
- `next`/`previous` (incluido el "si pasaron mÃ¡s de 3s, reinicia" de `previous`) y el wrap de la cola.
- Shuffle y repeat mantienen estado durante la sesiÃ³n; los botones activos se ven sobre `Fucsia`.
- `ProgressBar`: click, arrastre (`setPointerCapture`) y teclado (â†/â†’ 5s, `Home`).
- Que los SVG se vean en `PlayerBar`.
- Que las clases del design system (`Wall`, `Surface`, `Fucsia`, `Volume`, `SurfaceLight`,
  `TextRegluar`, `TextMedium`, `Elevation1`â€¦) sigan pintando bien: ahora viven en
  `@layer components`, asÃ­ que una utilidad Tailwind las puede sobrescribir
  (`className="Wall bg-red-500"` ya no manda la clase del design system).
- Los deltas visuales de la centralizaciÃ³n de tokens: fondo `body` `#0a0713` â†’ `#1e1e1e` (`Surface`),
  texto `#f2eefb` â†’ `#f4f0f9` (`Lighter`), muted `#a89dc4` â†’ `#b0a4b5` (`LightMuted`), texto sobre
  `Fucsia` `#1a0711` â†’ `#1e1e1e` (`Surface`, 4.85:1 â†’ 4.17:1), `ring`/`text-accent` `#e91e63` â†’
  `#ef2f62` (`Fucsia`) y `::selection` ahora en `Fucsia`.
- En un viewport angosto: que no se rompa nada, aunque hoy no haya experiencia mobile (Â§8).

---

## 2. `lucide-react` sigue en uso en cuatro archivos

**Contexto:** la regla 10 de `AGENTS.md` pide Ã­conos solo desde `src/assets/*.svg` (set de diseÃ±o
propio, importados como URL y usados con `<img>`), nunca de librerÃ­as. `lucide-react` todavÃ­a se
importa en cuatro archivos:

- `components/layout/Sidebar.jsx` â€” un import con los Ã­tems del nav: `Home`, `Flame`, `User`,
  `ListMusic`, `Disc3`, `Mic2`.
- `features/playlists/MisPlaylists.jsx` â€” `ListMusic`.
- `components/ui/sidebar.tsx` (`PanelLeftIcon`) y `components/ui/sheet.tsx` (`XIcon`) â€”
  componentes generados por shadcn.

**QuÃ© hacer:** mapear cada Ã­tem del `Sidebar` y de `MisPlaylists` a su SVG del set y cambiar el
render (hoy `<Icon />`, debe pasar a `<img src={...} alt="" aria-hidden="true" className="h-5 w-5" />`).
Decidir quÃ© hacer con `ui/`: son componentes de shadcn y `npx shadcn add` los regenera con lucide,
asÃ­ que o se dejan con la excepciÃ³n escrita en la regla 10 o se editan sabiendo que el CLI los puede
pisar. Cuando no quede ningÃºn import, sacar `lucide-react` de `package.json`.

---

## 3. Decisiones abiertas de `AGENTS.md` (secciÃ³n 5)

- **WebSockets:** resuelto para la sincronizaciÃ³n de salas (2026-10-18). `services/socketService.js`
  + Socket.IO, con handshake por JWT. **El chat de salas sigue sin existir**: no hay tabla
  `room_message` ni eventos que lo transmitan.
- **Estado global:** evaluar si `Context` alcanza o conviene un gestor (p. ej. Zustand) cuando
  aparezcan las features que aÃºn faltan.

*(La librerÃ­a HTTP ya se definiÃ³: `fetch` nativo dentro de `services/api.js`, con helpers
`get/post/patch/put/del`.)*

---

## 4. Opcional: garantÃ­a de "no repetir hasta agotar la lista" en shuffle

**Prioridad:** opcional. No estÃ¡ asignado a ningÃºn sprint; queda registrado como posible adiciÃ³n.
**Estado:** no implementado. El reproductor hoy funciona con una ventana de 10 canciones previas.

**Contexto:** en aleatorio, `next()` (`PlayerContext.jsx`) excluye la canciÃ³n actual y las Ãºltimas
10 del historial (`SHUFFLE_MEMORY`). Eso garantiza "no repetir dentro de las Ãºltimas 10", que no es
lo mismo que "no repetir hasta agotar la lista": con la ventana quedan fuera 11 Ã­ndices como mÃ¡ximo,
asÃ­ que a partir de **12 canciones** en la cola un tema puede volver a sonar mientras quedan otros
sin tocar. El caso favorable (cola â‰¤ 11) es justamente el que muestra el mock, que tiene 8
canciones, por eso el defecto no se ve en el navegador. Con el backend (playlist de 30, cola de una
sala, catÃ¡logo completo) aparece solo.

**QuÃ© hacer:** reemplazar la ventana por una *shuffle bag* â€”una bolsa con los Ã­ndices restantes de
la pasada actual, barajada con Fisherâ€“Yates al reponerseâ€”, de modo que cada canciÃ³n suene
exactamente una vez por pasada y el repeat solo pueda ocurrir al reponer. Encaja en un mÃ³dulo puro
nuevo `src/lib/shuffle.js` (crear/reponer bolsa, tomar el siguiente, quitar un Ã­ndice) para que la
lÃ³gica no viva en el provider y sea testeable. En `PlayerContext.jsx`: reemplazar `SHUFFLE_MEMORY` y
el bloque `visited`/`fresh` por la bolsa, refonerla al quedar vacÃ­a en `next()`, vaciarla en
`playSongs()` y en cada cambio de `toggleShuffle()`, y **sacarle el Ã­ndice destino cuando se usa
`previous()`**, para no repetir la canciÃ³n a la que se acaba de volver. `nextFromShuffleBag()` toma
el Ãºltimo elemento de la bolsa ya barajada, asÃ­ que no hace falta un paso de selection aparte.

**VerificaciÃ³n:** agregar **vitest** al Frontend (la 5.0.3 declara `vite: ^6.4 || ^7 || ^8` en sus
peerDependencies, compatible con el Vite 8.3.0 del proyecto) con scripts `test` / `test:watch` y
config `environment: 'node'` â€”la lÃ³gica es pura, no hace falta `jsdom` ni testing-libraryâ€”. Con un
PRNG sembrado (mulberry32) como `random` inyectable, testear que: la bolsa inicial es una permutaciÃ³n
de `0..n-1`; en dos pasadas sobre n = 30 cada Ã­ndice aparece exactamente una vez antes de cualquier
repeticiÃ³n; una bolsa no vacÃ­a no se re-baraja; al reponer se excluye la canciÃ³n en reproducciÃ³n; y
tras un `previous()` el Ã­ndice destino no puede volver a salir. Ojo: `npm i -D vitest` modifica
`package-lock.json`.

**Nota:** el historial de `previous()` y la bolsa son estado de cliente, asÃ­ que nada de esto depende
del backend; el endpoint solo cambia de dÃ³nde viene la cola.

---

## 5. Conectar el frontend con `/api/songs`

**Estado:** la integraciÃ³n quedÃ³ completa. `listSongs()`, `getSongById()` y `searchSongs()` van contra
el backend real, y el backend se ajustÃ³ para el paginado por offset y los nombres de gÃ©nero.
Contrato en `ESPECIFICACIONES-BACKEND.md` (`docs/`).

Lo que queda son decisiones de producto y casos sin cubrir (5.4â€“5.7).

### 5.1 PaginaciÃ³n de `/buscar` â€” resuelto en backend

**QuÃ© se hizo:** `song.service.js::searchSongs` pasÃ³ de cursor a offset (`skip: (page - 1) * pageSize`,
`take: pageSize`) con `prisma.song.count({ where })` en la misma transacciÃ³n, y devuelve
`{ items, total, page, pageSize, totalPages }`. El controller pasa `page`/`pageSize` sin castear y
`parsePagination` los acota (â‰¥ 1, tope `50`). PÃ¡gina fuera de rango â†’ se sirve la Ãºltima con contenido
y se devuelve `page` corregido.

**Por quÃ© no se degradÃ³ la pantalla:** se evaluÃ³ reescribir `SearchSongs.jsx` a anterior/siguiente con
cursor, pero se perdÃ­a la fila de nÃºmeros y el salto directo.

### 5.2 Etiqueta de gÃ©nero â€” resuelto

`SONG_INCLUDE` ahora usa `songGenres: { include: { genre: true } }` (idem `songMoods`), asÃ­ que el
payload trae el nombre y `songsService.toSong()` lo mapea a `song.genre`. Las cards de `/home` y
`/buscar` vuelven a mostrar la etiqueta.

### 5.3 La bÃºsqueda por Ã¡lbum â€” resuelta (2026-10-15)

**QuÃ© pasaba:** el catÃ¡logo mock tenÃ­a `album` y `searchSongs()` mock filtraba por `title`, `artist`,
`album` y `genre`. El backend no tenÃ­a columna `album`, asÃ­ que se quitÃ³ la palabra del copy de
`SearchSongs.jsx` para no prometer lo que el endpoint no cumplÃ­a.

**CÃ³mo quedÃ³:** el feature de Ã¡lbumes trajo el modelo `Album` (migraciÃ³n `20261015215159_add_album`) con
`Song.idAlbum`. `SONG_INCLUDE` ahora trae `album: { id, name }`, el filtro de `searchSongs` matchea tambiÃ©n
el nombre del Ã¡lbum y el copy volviÃ³ a decir "BuscÃ¡ por tÃ­tulo, artista, gÃ©nero o Ã¡lbum". Verificado contra
la base real: `?query=Woods` devuelve las 3 canciones del Ã¡lbum "Woods of Chaos".

### 5.4 `source` sigue sin existir (el Ã¡lbum ya no)

`PlayerBar` usaba `song.album` como `alt` de la carÃ¡tula y `song.source` para la lÃ­nea
"ReproduciÃ©ndose desde":

- `album`: **resuelto**, ahora llega el nombre real y el `alt` lo usa de verdad.
- `source`: la lÃ­nea se oculta sola (el render estÃ¡ guardado con `song?.source ?`).

**QuÃ© hace falta para `source`:** decidir de dÃ³nde sale. "ReproduciÃ©ndose desde" deberÃ­a ser el origen
real de la canciÃ³n (nombre de playlist o sala), que requiere saber de quÃ© playlist o sala se pidiÃ³
reproducir. El frontend ya lleva el origen de la cola (`queueSourceRef = { playlistId, isFavorites }`
y `playSongs(songs, startIndex, source)`), falta decidir el label y pintarlo.

### 5.5 Bugs de backend encontrados al conectar â€” corregidos

- `song.controller.js` hacÃ­a `query.trim()` sin guarda: `/api/songs/search` **sin** `?query=` lanzaba
  `TypeError` â†’ 500. Ahora el service normaliza a `""` y devuelve el catÃ¡logo paginado.
- `Number(cursor)` daba `NaN` si faltaba el cursor. Sin efecto al pasar a offset, pero ya no se castea.

### 5.6 `mocks/` â€” resuelto y eliminado (2026-10-18)

Se borraron `mocks/songs.js`, `mocks/playlists.js` y `mocks/users.js` el 2026-10-14, y con las salas
entregadas se borrÃ³ la carpeta entera: `mocks/rooms.js` era el Ãºltimo que quedaba, importado solo
por `roomsService`. **Ya no queda ningÃºn mock en el repo**: toda la app habla con la API.

### 5.6b Salas â€” entregados los cuatro bloques (2026-10-18)

Plan: `docs/plan/sprint-2-salas-plan.md` (B11â€“B21 + F8, F11â€“F14). **No queda nada pendiente de
salas salvo el chat.** Verificado contra la base real: 80 chequeos de API y 9 de socket.

- **Fase 1** `GET /rooms?query=&sort=name|rating&order=asc|desc` con `members_count`/`songs_count`,
  filtrando privadas y cerradas. **Fuga corregida:** antes la query proyectaba `room.*` y el
  endpoint **pÃºblico** devolvÃ­a `password_hash` de cada sala; ahora las columnas van una por una y
  los endpoints que devuelven la sala entera (crear, unirse, detalle) la filtran con `safeRoom`.
- **Fase 2** crear por playlist propia **o de una colaborativa** (D19), unirse por cÃ³digo, salir
  (el anfitriÃ³n que sale cierra la sala, D16), detalle con miembros y canciones, y
  `GET /rooms/mine` para el grupo "Mis Salas" del Sidebar.
- **Fase 3** Socket.IO: handshake por JWT, canal `room:<id>` solo para miembros, eventos
  `room:playback` / `room:members` / `room:skip-votes` / `room:rating` / `room:kicked` /
  `room:closed`, control de reproducciÃ³n del anfitriÃ³n, expulsiÃ³n y cierre. En el frontend, "modo
  sala" del `PlayerContext` (apaga aleatorio y repeticiÃ³n, y el `onEnded` del anfitriÃ³n pide el
  `next` al servidor) mÃ¡s correcciÃ³n de deriva cada 2 s.
- **Fase 4** votar para saltar (mayorÃ­a sobre no-anfitriones, D17) y calificar al anfitriÃ³n (TS-11),
  con el promedio visible en su perfil.

**Bugs corregidos de paso:**

- `pause` guardaba `positionMs` sin sumarle el tiempo transcurrido, asÃ­ que **pausar reiniciaba la
  canciÃ³n para todo el mundo**. Ahora congela la posiciÃ³n real y `play` reanuda desde ahÃ­.
- `deleteRoomState` estaba definido pero **nunca se llamaba**: el estado de reproducciÃ³n en memoria
  sobrevivÃ­a al cierre de la sala. Ahora se limpia en `DELETE /rooms/:id` y cuando sale el anfitriÃ³n.
- `socket.io` estaba en `package.json` y en el lockfile pero **no en `node_modules`**: el backend no
  arrancaba hasta correr `npm install`.

**Deuda que dejÃ³ el bloque:**

- `POST /api/rooms/:id/playback` con dos ingresos simultÃ¡neos al mismo tiempo no garantiza el tope
  de 10: la transacciÃ³n de `joinRoom` relee el cupo, pero con el nivel de aislamiento por defecto de
  Postgres (`ReadCommitted`) dos transacciones pueden pasar el chequeo a la vez. Para que sea
  estricto hace falta aislamiento `Serializable` o un lock.
- El rating del anfitriÃ³n es una escala 1â€“5 en el esquema, pero `POST /:id/rating` recibe el valor
  en el body y la UI todavÃ­a **no lo manda**: el botÃ³n estÃ¡ implemented en `RoomView.jsx` y envÃ­a
  `1`. Con la escala unificada, ordenar por calificaciÃ³n se reduce en la prÃ¡ctica a "calificada
  antes que no calificada". Ver **D21** del plan de salas.
- La barra de progreso de la sala es de solo lectura para los miembros: no hay endpoint para
  buscar dentro de la canciÃ³n, asÃ­ que la posiciÃ³n es del servidor.

### 5.7 VerificaciÃ³n contra la base real â€” mayormente cubierta

**Estado (2026-10-08): la base estÃ¡ levantada.** Existe `Backend/.env`, los contenedores
`SYNTHOS_POSTGRES`/`SYNTHOS_PGADMIN` estÃ¡n corriendo, `npx prisma migrate status` informa
`6 migrations found` y `Database schema is up to date!`, y el seed cargÃ³ 97 canciones.

AdemÃ¡s de eso, la **lÃ³gica de paginaciÃ³n** se habÃ­a verificado antes con un script temporal que
intercepta el `require` de `prismaClient` y usa un catÃ¡logo sintÃ©tico de 137 canciones: `skip`,
clamping de pÃ¡gina fuera de rango, Ãºltima pÃ¡gina parcial, defaults, tope de `pageSize` y recorrido
completo de las 14 pÃ¡ginas. Todas pasaron; el script se eliminÃ³ despuÃ©s.

**Suite de humo por HTTP contra la base real (2026-10-08): 41 de 42 chequeos pasaron:**

- `GET /health`, `GET /songs` (cursor), `GET /songs/:id` (200 y 404), `GET /songs/search`
  (offset, clamping `page=999` â†’ Ãºltima pÃ¡gina, query vacÃ­a = catÃ¡logo completo, 97 canciones).
- `GET /rooms?sort=rating` (trae `avg_rating`) y `sort` invÃ¡lido â†’ 400.
- `GET /users/search` (envelope offset, claves `picture_url`/`biography`/`genre_name` en snake_case,
  query vacÃ­a â†’ 200 con todos los usuarios).
- Auth: `login` 200 con token / password malo 401; `register` 201 con token, 400 con `errors[]`,
  email repetido 400; `GET /users/me` con `email` y 401 sin token.
- Playlists: crear 201 (`type: personal`), name vacÃ­o o >50 â†’ 400, `addSongs` idempotente (200,
  no 409), `GET /:id` con las canciones incluidas, playlist ajena â†’ 404 (GET) / 403 (DELETE),
  borrar â†’ 200 y 404 despuÃ©s.
- Favoritos: `GET /songs/ids`, agregar 201, repetir 409, quitar 200, quitar algo que no estaba 404.
- Follow: `followers`/`following`, contadores en `GET /users/:id`, seguir 200 idempotente,
  dejar de seguir 200 y otra vez â†’ 404. `GET /users/abc` â†’ 400.

**Bug encontrado y ya resuelto (2026-10-14):** `PUT /api/playlists/:id` con `addSongs` de un id **no
numÃ©rico** respondÃ­a 500 (`P2023` sin mapear). Ahora `errorHandler.js` mapea `P2023 â†’ 400`.

**Sigue sin cubrir:** `PATCH /users/me` (ya verificado a mano en TS-21), `PUT /playlists/:id` con
`name`/`description`/`removeSongs`, `POST /auth/logout`, y la prueba visual en navegador
(Â§1). La suite dejÃ³ un usuario de prueba (`verifdocs`) porque no hay endpoint para dar de baja
usuarios; el resto de las escrituras se revirtieron.

---

## 6. Seguimiento migrado al backend

**Estado:** migrado. Auth y ediciÃ³n de perfil van contra el backend desde PR #20/#21; el seguimiento
(TS-10) tambiÃ©n, sobre `POST`/`DELETE /api/users/:id/follow` y `GET /api/users/:id/followers|following`.

### 6.1 QuÃ© se conectÃ³

- `usersService.js`: `followUser`, `unfollowUser`, `getFollowCounts`, `isFollowing`, `listFollowing` y
  `listFollowers` contra el backend real. Se eliminÃ³ el mock de follow (`synthos_mock_follows`) y el
  contenedor de usuarios mock que sÃ³lo servÃ­a para resolverlo.
- `getFollowCounts` usa `GET /api/users/:id` (`followerCount`/`followingCount`, agregados en `f48a224`).
- `isFollowing` no tiene endpoint directo: se deriva de `GET /api/users/:id/followers`.
- `subscribeToFollow` avisa a `useFollow` (y desde ahÃ­ al `ProfileSummary` del Sidebar, `ProfileView` y
  `ProfilePublic`) para que contadores y listas se refresquen al seguir/dejar de seguir desde otra vista.
- `FollowList` ya resuelve `listFollowers`/`listFollowing` contra la base, asÃ­ que las listas de
  seguidores/seguidos muestran usuarios reales.
- `searchUsers` suma la relaciÃ³n **completa** por resultado cuando hay sesiÃ³n (TS-10b): el backend
  la resuelve en la misma query de bÃºsqueda con dos `EXISTS` (`isFollowing` y `followsMe`);
  `SearchPersonRow` usa ambos para el botÃ³n y la etiqueta mutua.

### 6.2 Lo que queda pendiente

1. **Listas sin paginar:** `GET /users/:id/followers|following` devuelven el array completo, no un envelope
   con `page`/`total`.
2. ~~**`isFollowing` en `GET /users/:id`**~~ â†’ **resuelto por otra vÃ­a (2026-10-14):** el perfil pÃºblico
   ya no deriva la relaciÃ³n de dos llamadas. `useFollow` consulta `GET /users/:id/follow-status`, que
   devuelve los dos sentidos y `isMutual` en un solo request, y `usersService.isFollowing` (que bajaba
   la lista completa de seguidores para mirar un id) se eliminÃ³. Lo que **queda** es puramente cosmÃ©tico:
   `GET /users/:id` se pide 2-3 veces por visita al perfil (el perfil, los contadores de `useFollow` y la
   relaciÃ³n), porque no hay un endpoint que devuelva usuario + contadores + relaciÃ³n juntos.
3. **Respuesta de `follow`/`unfollow`:** sigue siendo `{ status, message }`, asÃ­ que `useFollow` re-consulta
   el estado (`relationState` â†’ `follow-status` + contadores). Con los cÃ³digos de error (Â§9) el mensaje ya
   no es lo Ãºnico que la UI puede usar.

---

## 7. La foto de perfil se guardaba como base64 dentro de una columna de texto

**Estado: cerrado (2026-10-13, TS-21).** La foto ya no viaja en el JSON ni entra a la base: va por
`POST /api/users/me/picture` (multipart) a ImageKit y lo que se persiste es la URL pÃºblica. Contrato
completo en `ESPECIFICACIONES-BACKEND.md` Â§7.1; resumen de la tarea en `plan/sprint-2-plan.md` (TS-21).

**Lo que habÃ­a:** `ProfileEdit.jsx` leÃ­a el archivo con `FileReader.readAsDataURL()` y mandaba el data
URI completo dentro del `PATCH`. El backend lo aceptaba sin lÃ­mite de tamaÃ±o ni validar que fuera una
imagen y lo escribÃ­a tal cual en `prisma.user.pictureUrl` (`String?`): un JPEG de 2 MB producÃ­a un body
de ~2,7 MB contra una columna de texto.

**Lo que hay ahora:**

- `POST /api/users/me/picture` con `multer` (memoria + `fileFilter`), tope de 2 MB, JPG/PNG/WEBP, y
  `PATCH /users/me` rechaza con 400 cualquier data URL. `express.json()` volviÃ³ a su lÃ­mite por defecto.
- Recorte (1024 px) y compresiÃ³n (â‰¤1 MB) en el navegador, antes de subir: el body de una serverless
  function de Vercel corta ~4,5 MB, asÃ­ que el archivo crudo no era viable.
- Un archivo por usuario en ImageKit (nombre determinista + `useUniqueFileName: false`), sin huÃ©rfanos.
  Known: cambiar de formato (JPG â†’ PNG) deja el archivo viejo.
- Cliente de ImageKit perezoso: sin `IMAGEKIT_PRIVATE_KEY` el server arranca igual y el upload responde
  500 en espaÃ±ol.

**VerificaciÃ³n:** con `curl` contra la base real y contra ImageKit (200 con la URL servible, 400 sin
archivo / tipo no permitido / 3 MB, 401 sin token, 400 con data URL en el `PATCH`, `?v=` rompiendo cachÃ©
y el contador de archivos en `/avatars` sin crecer al resubir), y con un smoke en Chrome real (5,9 MB â†’
757 KB en el navegador, upload + guardado, avatar cargado en perfil y sidebar). QuedÃ³ un `PATCH` de
kilobytes, como pedÃ­a este pendiente.

### 7.1 Feedback y validaciÃ³n de la ediciÃ³n de perfil

Los tres primeros puntos quedaron resueltos el 2026-10-13/14 y ya no hacen falta como recordatorio:

- Estado de submit propio (`saving`) con `finally` (TS-21).
- Error de validaciÃ³n por **`code` estable** y no por texto: el backend responde
  `{ status, message, code }` (ver Â§9) y el frontend traduce con `utils/mapError.js`, asÃ­ que cambiar
  la redacciÃ³n de un mensaje ya no rompe ninguna pantalla.
- Token de placeholder: `--ds-placeholder` en `styles/tokens.css` y la clase `.Placeholder` en
  `utilities.css` reemplazaron a `placeholder-neutral-500` (deuda de la regla 11).

Lo que sigue abierto:

- Barra de progreso real en la subida: `services/api.js` tiene que pasar de `fetch` a
  `XMLHttpRequest` (no hay `upload.onprogress`). Hoy es estado textual, suficiente con â‰¤1 MB.

---

## 8. Mobile desmantelado â€” se reharÃ¡ con React Native

**Estado (2026-10-11):** se sacaron del cÃ³digo las piezas dedicadas a mobile. `AppLayout` ya no ramifica
por breakpoint: renderiza siempre el layout de desktop (`SidebarProvider` + `Sidebar` + `TopBar` +
contenido + `PlayerBar`). `Home` tambiÃ©n dejÃ³ de alternar y renderiza `HomeDesktop`. Se eliminaron todas
las **importaciones** a: `components/layout/BottomNav.jsx`, `components/layout/MiniPlayerBar.jsx`,
`features/home/HomeMobile.jsx` y el hook `hooks/useBreakpoint.js`.

**Contexto (por quÃ© se hizo):** mantener dos layouts en el mismo codebase web (desktop con shadcn + un
shell mobile a mano) venÃ­a quedando a medias: `BottomNav` sin Ã­conos, `MiniPlayerBar` atado a la altura
del `BottomNav`, `HomeMobile` como shell, breakpoints y padding duplicados (`pb-28` en el `main` mobile).
Se decidiÃ³ dejar de parchar esa vÃ­a en lugar de seguir sumando excepciones.

**QuÃ© queda a medias (a propÃ³sito):** la app web hoy no tiene experiencia mobile real. En un viewport
chico muestra el layout de desktop, sin navegaciÃ³n inferior ni mini reproductor. Los archivos
`BottomNav.jsx`, `MiniPlayerBar.jsx`, `HomeMobile.jsx` y `hooks/useBreakpoint.js` **siguen en disco,
sin uso** (no se borraron para conservarlos como referencia histÃ³rica); `use-mobile.ts` de shadcn sigue
siendo consumido internamente por `ui/sidebar.tsx`.

**QuÃ© hacer (decisiÃ³n):** rehacer mobile, cuando se retome, con **React Native** (app nativa/APK propia),
no con soluciones a medias dentro de la web. El layout y la interacciÃ³n de mobile son distintos de los
de desktop y merecen su propia base, en vez de duplicar componentes y parchear breakpoints en el
codebase de Vite. Al encarar eso, revisar si conviene borrar los archivos mobile sin uso de arriba.

**VerificaciÃ³n:** `npm run lint` + `npm run build` en verde sin las importaciones mobile; confirmar que
ningÃºn mÃ³dulo referencia `BottomNav`, `MiniPlayerBar`, `HomeMobile` ni `useBreakpoint`.

**Docs desactualizados por este cambio:** `CONTEXT.md` Â§4.6 (Layout) y `PENDIENTES.md` Â§1 (smoke test,
lÃ­neas sobre `MiniPlayerBar`/`BottomNav`/responsive) todavÃ­a describen el mobile viejo; actualizar
cuando se cierre la decisiÃ³n.

---

## 9. CÃ³digos de error estables (nuevo, 2026-10-14)

**Estado: implementado.** Los errores de validaciÃ³n ya no dependen del texto en espaÃ±ol para que la UI
sepa quÃ© pasÃ³.

- `Backend/src/utils/errors.js` expone `httpError(status, message, code, extra)`. El `code` es una cadena
  estable (`USERNAME_TAKEN`, `IMAGE_TOO_LARGE`, `FOLLOW_REQUIRED`â€¦) y viaja en el body; el status va en
  `error.httpStatus`, asÃ­ que ya no se confunde con el `code` de Prisma.
- Todos los controllers lanzan `httpError` en vez de armar el JSON a mano, y el catch-all de `app.js`
  responde `{ status, message, code }` (mÃ¡s `extra` si lo hay, como el `errors[]` del registro). Los 4xx ya
  no ensucian el log: solo se loguea lo que es 500 o mÃ¡s.
- `Frontend/src/utils/mapError.js` traduce **por `code`**, con el `message` del servidor como Ãºltimo
  recurso. Los 13 lugares que pintaban `cause.message` crudo usan `mapApiError`.
- `P2023` quedÃ³ mapeado a 400 en `errorHandler.js` (el bug de Â§5.7).

**Lo que sigue:** el `message` todavÃ­a viene del backend y se muestra tal cual para los `code`
desconocidos, asÃ­ que un mensaje nuevo en inglÃ©s se verÃ­a en pantalla. La regla de la casa es
espaÃ±ol, pero no hay lint que lo proteja.

## 10. Playlists colaborativas e invitaciones (nuevo, 2026-10-15)

**Estado: implementado de punta a punta** (TS-12 y TS-13), verificado contra la base real con dos
usuarios.

- **Crear:** `POST /api/playlists` con `type: "colab"`; el controller valida el tipo (`400
  PLAYLIST_TYPE_INVALID`) e inserta la fila `playlist_member` con rol `creator`. El frontend tenÃ­a un bug
  abierto: no mandaba `type` y **toda creaciÃ³n devolvÃ­a 400**; ahora `playlistsService.createPlaylist`
  manda el tipo y `PlaylistCreateForm` ofrece "Solo vos / Colaborativa".
- **Permisos:** en una `colab` cualquier participante **agrega y quita** canciones
  (`POST|DELETE /playlists/:id/songs`); editar, borrar, invitar y echar son del creador. `GET /:id` pide
  sesiÃ³n y responde `404` si no sos creador, ni miembro, ni es pÃºblica.
- **InvitaciÃ³n dirigida (redefine TS-13):** no hay link. Se invita a una persona que ya existe
  (`POST /:id/invitation` con `{ userId }`), la invitaciÃ³n queda pendiente en la tabla nueva
  `playlist_invitation` y se acepta o rechaza desde la sub-pestaÃ±a **Invitaciones** de `/playlists`.
  `DELETE /:id/members/:userId` saca a un participante. MigraciÃ³n `20261015203304_playlist_invitation`.
- **Invitar convierte la playlist en colaborativa:** si la playlist era `personal`, la misma transacciÃ³n la pasa a
  `colab` e inserta la fila del creador; la respuesta trae `converted: true` y el detalle se recarga. No existe
  el concepto de "miembro de una playlist personal"; la de favoritos es la Ãºnica que no se puede invitar.
- **Reparto de pantallas:** `toPlaylist` expone `type`, `role`, `creator` y `members`, asÃ­ que el Sidebar y
  `/playlists` separan "Mis Playlists" (las que creaste) de "Colaborativas" (donde participÃ¡s), y el
  detalle muestra participantes e invitados con su estado.

**Lo que sigue:**

- El buscador para invitar pide **2 letras** antes de pegarle a `GET /users/search`: con la query vacÃ­a ese
  endpoint devuelve el catÃ¡logo completo. El backend sÃ­ pagina (`LIMIT`/`OFFSET`), pero el `ILIKE '%texto%'`
  no puede usar un Ã­ndice; con muchos usuarios, el arreglo es un Ã­ndice trigram (`pg_trgm`).
- `PUT /playlists/:id` sigue aceptando `addSongs`/`removeSongs` en lote y siendo del creador. El frontend
  ya no lo usa para canciones, asÃ­ que se puede dejar hasta que aparezca un caso en lote que lo necesite.
- Sin E2E: el flujo se verificÃ³ con `curl` contra la base real, no en navegador (ver Â§1).


## 11. Ãlbumes: endpoints y pantalla (nuevo, 2026-10-15)

**Estado: implementado.** La pantalla `/albums` del Sidebar dejÃ³ de ser un placeholder, y los Ã¡lbumes
tambiÃ©n se buscan desde la pestaÃ±a nueva de `/buscar`.

- **Lo que estaba roto:** el PR de Ã¡lbumes habÃ­a dejado `GET /api/songs/search` devolviendo 500 en dos de
  sus tres ramas. El service usaba un `ALBUM_INCLUDE` que no estaba definido y lo exportaba como funciÃ³n
  suelta; el controller lo importaba con un nombre y lo usaba con otro; y el `type` sin reconocer caÃ­a en
  un `res.json({ songs, albums })` con dos variables inexistentes. Todo eso estÃ¡ corregido.
- **Listado:** `GET /api/songs/search?type=albums`, que reutiliza la paginaciÃ³n por offset de las
  canciones. `type` invÃ¡lido responde `400 SEARCH_TYPE_INVALID`. Cada item trae `artist` y `_count.songs`.
- **Detalle:** `GET /api/albums/:id` â†’ `{ status, album }` con `artist` y `songs[]`; `404 ALBUM_NOT_FOUND`.
- **Frontend:** `albumsService.js` (con su `toAlbum`), grilla paginada del catÃ¡logo (`?page=`) y
  `AlbumDetail` con "Reproducir" sobre la cola del `PlayerContext`.
- **BÃºsqueda:** `SearchAlbums` es la tercera pestaÃ±a de `/buscar` (`?tipo=albumes`), entre Canciones y
  Personas. Comparte `?q=` y `?page=` con las otras dos; la card lleva al detalle del disco. La pÃ¡gina
  `/albums` **no** tiene input: solo lista y enlaza a esa pestaÃ±a.
- **Efecto colateral:** `songsService.toSong()` dejÃ³ de hardcodear `album: null`, asÃ­ que el `alt` de la
  carÃ¡tula del `PlayerBar` ahora es el nombre real del Ã¡lbum, y el copy de `/buscar` recuperÃ³ "Ã¡lbumo".

**Lo que sigue:**

- **El orden de las pistas es por `id`**: el esquema no tiene nÃºmero de track. Si alguna vez importa el
  orden real del disco, hace falta una columna de posiciÃ³n.
- El Ã­cono de Albums en el Sidebar sigue siendo `Disc3` de lucide-react, aunque existe
  `src/assets/album.svg`. Se deja asÃ­ para no mezclar el set; migrar los cinco Ã­conos juntos es lo que
  cierra la deuda de `lucide-react` (Â§2).
- Sin E2E: verificado con `curl` contra la base real (104 Ã¡lbumes, 134 canciones), no en navegador.

---

## 12. Artistas: endpoints y pantalla (nuevo, 2026-10-22)

**Estado: implementado.** La pantalla `/artistas` del Sidebar dejÃ³ de ser un placeholder: lista el
catÃ¡logo paginado, permite buscar por nombre y abre el detalle con los Ã¡lbumes del artista.

- **Listado:** `GET /api/artists?query=&page=&pageSize=` devuelve el mismo envelope paginado que las
  bÃºsquedas (`{ items, total, page, pageSize, totalPages }`), ordenado por `name` asc. Cada item trae
  `_count.albums` y `_count.songs`. Es pÃºblico.
- **Detalle:** `GET /api/artists/:id` â†’ `{ status, artist }` con `_count` y `albums[]`; `404
  ARTIST_NOT_FOUND` y `400 INVALID_ID`. Cada Ã¡lbum conserva la forma del listado de discos, asÃ­ que el
  frontend reutiliza `toAlbum()` y `MiniMediaCard`.
- **Frontend:** `artistsService.js` con `toArtist()`/`toArtistDetail()`, `ArtistCard` (foto redonda,
  nombre y cantidad de Ã¡lbumes) y las pantallas `Artists`/`ArtistDetail`. La query y la pÃ¡gina viven en
  `?q=`/`?page=` y el input usa `useDebounce(300)`. El clic en un disco navega a `/albums/:id`.
- **Sin migraciÃ³n:** el modelo `Artist` y su relaciÃ³n con `Album` ya existÃ­an.
- **VerificaciÃ³n:** `curl` contra la base real y pantalla probada en navegador (listado, bÃºsqueda y
  detalle); `npm run lint` y `npm run build` en verde.

**Lo que sigue:**

- Sin E2E automatizado: la prueba fue manual, contra el backend local.
- Los artistas se ordenan por nombre, no por popularidad ni por cantidad de Ã¡lbumes. Si se pide un
  ranking de artistas, hace falta definir la mÃ©trica y probablemente un endpoint nuevo.
- El avatar del artista cae al `blobatar` determinÃ­stico solo cuando falta `pictureUrl`; si Jamendo
  devuelve una URL rota, no hay fallback de imagen (mismo comportamiento que `UserRow`).

## 13. Reordenar canciones (completado 2026-10-27)

Implementado segun docs/features/reordenar-canciones.md y docs/plan/sprint-3-reordenar-canciones-plan.md. Endpoints PUT /api/favorites/order y PUT /api/playlists/:id/songs/order, migraciones 20261027160000_add_favorite_position y 20261027170000_add_reorder_event, hook useReorderSongs en shared/, drag con pointer events en PlaylistDetail.jsx. El campo legacy eorder de PUT /api/playlists/:id se retiro.

