# Hoja de requerimientos — incorporación del backend

> Alcance: qué necesita el frontend para dejar los mocks y hablar contra la API real. No es un contrato
> de endpoints ya implementado (eso está en `ESPECIFICACIONES-BACKEND.md`); es la lista de lo que falta,
> en orden de incorporación, con lo que hay que decidir antes de escribir cada endpoint.
>
> Documentos relacionados: `ESPECIFICACIONES-BACKEND.md` (contrato ya aplicado de canciones),
> `PENDIENTES.md` (pendientes generales), `AGENTS.md` (convenciones),
> `Frontend/docs/plan/sprint-2-plan.md` (TS-10 a TS-20, que es quien va a consumir casi todo lo de acá).

**Cómo usar la hoja:** cada requerimiento tiene un id (`REQ-<dominio>-<n>`), una prioridad y una casilla.
Una casilla se tilda cuando el endpoint está implementado **y** verificado contra la base real, no cuando
compila. Las "decisiones a tomar" son bloqueantes: si no se resuelven, el endpoint se implementa de una
forma y después hay que romperlo.

---

## 1. Punto de partida

### 1.1 Lo que el backend ya tiene

| Pieza | Estado | Nota |
| --- | --- | --- |
| Esquema Prisma | **completo** | Hay modelos para `Playlist`, `PlaylistSong`, `PlaylistMember`, `Favorite`, `Follow`, `Room`, `RoomMember`, `HostRating`, `Content`, `ContentPlayement`, `Mood`. El schema llega bastante más lejos que los endpoints. |
| Migraciones y seed | **aplicadas** | `20260930171420_init` y `20260930183051_init`; 97 canciones, 35 géneros, 3 estados de ánimo. Los `CHECK` de `host_rating` (1–5) y de `follow` (no seguirse a uno mismo) están en la migración aplicada. |
| `GET /api/songs` | listo | Cursor, con `LIMIT = 10` fijo en `song.service.js`. |
| `GET /api/songs/search` | listo | Offset, contrato en `ESPECIFICACIONES-BACKEND.md` §2. |
| `GET /api/songs/:id` | listo | Usa `SONG_INCLUDE` (artista, géneros, estados de ánimo) y `findUniqueOrThrow`, así que un id inexistente cae en el `404` de `errorHandler`. |
| Auth | a medias | `register`, `login` y `logout` montados **dos veces** (`/api/auth` y `/api/v1/auth`). |
| `authenticate` | listo | JWT `Bearer`, deja el payload del token en `req.user`. |
| `GET /api/users/search` | parcial | Nuevo en `cf35f34`. Cursor (`{ users, nextCursor, hasMore }`), busca por `username` **y** por género vía las vistas `user_top_genre` / `user_genre_counts`. Devuelve solo `id`, `username`, `picture_url` y `genre_name`, a pelo. Ver REQ-USER-1. |
| Manejo de errores | con reparos | `errorHandler` mapea códigos Prisma a español. Además, `getId` y `validateQuery` lanzan con `error.code = 400` y el catch-all de `app.js` usa `res.status(err.code || 500)`. Ver los avisos de §2. |

### 1.2 Lo que el frontend tiene contra la API real

Solo `songsService.js`. El resto sigue en `mocks/`: `authService`/`usersService` (usuarios) y
`playlistsService` (TS-09, completo y verificado con 14 casos, pero contra `localStorage`).

### 1.3 Los huecos, de un vistazo

| # | Hueco | Impacto |
| --- | --- | --- |
| 1 | `services/api.js` solo tiene `get` y no manda `Authorization` | **Bloqueante absoluto**: ningún POST/PUT/DELETE es posible y nada privado se puede leer. |
| 2 | No hay endpoints de playlists ni de favoritos | TS-09 no puede pasar de mock |
| 3 | Auth mock, y `register` no devuelve token | No hay sesión real |
| 4 | No hay endpoints de usuarios, salvo la búsqueda | Perfil y "mi cuenta" quedan mock, y la búsqueda ya existente no es compatible con lo que espera el frontend |
| 5 | No hay lote de canciones por id | Hidratar una playlist son N requests |
| 6 | No hay endpoints de follow, salas, chat ni recomendaciones | Sprint 2 entero |
| 7 | El esquema no tiene dónde guardar votos de skip ni mensajes de chat | Dos features sin soporte de datos |

---

## 2. Convenciones transversales

Aplican a **todos** los endpoints nuevos. Si se cumple esto, el frontend migra sin tocar componentes
(regla 6 de `AGENTS.md`: al migrar a backend real solo se edita el contenido de `services/`).

| Tema | Regla |
| --- | --- |
| Prefijo | `/api`, sin versión. `API_BASE_URL` ya es `/api` en el frontend y el proxy de Vite apunta a `:3000`. Hay que **bajar el mount duplicado** `/api/v1/auth`. |
| Rutas | Plurales, minúsculas, sin verbos (`/api/playlists/:id/songs`, no `/api/playlists/addSong`). Las acciones que no son CRUD van como sub-recurso: `/api/rooms/:id/vote-skip`, `/api/users/:id/follow`. |
| Identidad | Sale de `req.user.sub` (el `jwt.sign` actual pone `{ sub: user.id, email, username }`), **nunca** del body ni de un query param. Ojo: en JWT `sub` es string, hay que castearlo a número para Prisma. |
| Auth | Todo lo privado exige `authenticate`. Lo público sigue abierto. |
| Ids | `Int` de Postgres (SERIAL). El backend debe tolerar que el cliente mande `"43886"` además de `43886`; conviene verificar que Prisma no rompa con un string en un campo `Int` en vez de asumirlo. |
| Errores | Dos mecanismos conviven: `prismaErrorHandler` mapea códigos Prisma a español, y los validadores de `utils/validation.js` lanzan un `Error` con `error.code = 400` que el catch-all de `app.js` traduce a `res.status(err.code || 500)`. El cuerpo es `{ status: "error", message, code?, errors? }`; la validación de body manda `400` con `errors: [{ field, message }]`. No encontrado, `404`. Conflicto, `409`. |
| Avisos de errores | Dos cosas a arreglar antes de que el frontend dependa de este contrato: (a) el catch-all devuelve `err.message` crudo, así que un error interno puede filtrar texto de Prisma o de SQL al cliente, cuando antes era un mensaje genérico; (b) `res.status(err.code)` asume que `code` es un número, pero Prisma y el driver de Postgres usan strings (`P2025`, `ECONNREFUSED`), y si alguno llegara al catch-all con `code` string, Express rompe al escribir la respuesta. Un `Number.isInteger(err.code) ? err.code : 500` lo evita. |
| Privacidad | Una playlist de otro usuario responde **`404`, no `403`**: un `403` confirma que el id existe. El mock ya hace eso y la UI depende de no filtrar existencia. |
| Paginación | **No hay una convención única todavía, y esto es un conflicto real.** `/api/songs/search` es offset (`{ items, total, page, pageSize, totalPages }`, ver `ESPECIFICACIONES-BACKEND.md` §2) pero `/api/users/search` es cursor (`{ users, nextCursor, hasMore }`). El frontend tiene dos pantallas distintas: `/buscar` de canciones dibuja la fila de páginas numeradas (necesita offset), mientras que `SearchPeople` usa `usersService.searchUsers`, que ya espera `{ items, total, page, pageSize, totalPages }`. Si `/users/search` queda en cursor, esa pantalla tiene que reescribirse a anterior/siguiente y pierde el salto directo. Ver D11. |
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

### [ ] REQ-HTTP-1 — Cliente HTTP con verbos y token

`Frontend/src/services/api.js` exporta únicamente `get`. Hay que agregar `post`, `put`, `patch` y `del`,
inyectar el `Authorization` desde la sesión y manejar el 401.

- [ ] Bearer automático. El token vive en el contexto de sesión, no en cada service.
- [ ] Un 401 dispara el cierre de sesión y la redirección a `/login`, **una sola vez**: si no, cada
      request en vuelo dispara su propio redirect.
- [ ] `buildUrl` ya descarta los params vacíos: se reutiliza tal cual.
- [ ] Mantener `ApiError` con `status` y `code`: las pantallas ya muestran el `message` del backend.

**Por qué va primero:** sin esto no se puede llamar a ningún endpoint de escritura, que es el 80% de lo
que falta.

### [ ] REQ-AUTH-1 — `register` tiene que devolver token

Hoy `POST /api/auth/register` responde `{ status, user }` sin token, y `login` sí devuelve
`{ status, token, user }`. El frontend registra e inicia sesión en el mismo paso, así que si el registro
no devuelve token hay que hacer un login extra o dejar al usuario en el login manual.

- [ ] `register` responde `{ status: "success", token, user }`, igual que `login`.
- [ ] Decidir `JWT_EXPIRES_IN`: hoy `7d` por defecto, sin revocación.
- [ ] `logout` es un no-op del lado del servidor. Con JWT sin blacklist, cerrar sesión no invalida el
      token: sigue vivo 7 días si alguien lo copió. Aceptable para el proyecto, pero **que sea una
      decisión escrita**, no un olvido. Si se quiere cerrar de verdad, hace falta lista de revocación.

### [ ] REQ-AUTH-2 — Endpoint del usuario actual

`AuthContext` y casi toda la UI necesitan saber "quién soy" al refrescar la página, no solo después del
login.

- [ ] `GET /api/users/me` → el usuario del token, **incluyendo** `email` (la UI lo muestra en el perfil).
- [ ] El `user` que devuelven `register` y `login` tiene que traer los mismos campos que `GET /users/me`,
      si no el perfil sale con huecos justo después de registrarse.

### [ ] REQ-USER-1 — Completar usuarios reales

`GET /api/users/search` ya existe (`Backend/src/routes/user.routes.js`), así que lo que queda no es
"armar el endpoint" sino **compatibilizarlo** y agregar el resto.

| Método | Ruta | Estado | Notas |
| --- | --- | --- | --- |
| `GET` | `/api/users/search?query=` | parcial | Devuelve `{ users, nextCursor, hasMore }` con `id`, `username`, `picture_url` y `genre_name`. |
| `GET` | `/api/users/:id` | falta | `getUserById` (perfil público, TS-08) |
| `GET` | `/api/users` | falta | `listUsers` |
| `PATCH` | `/api/users/me` | falta | `updateProfile` |

- [ ] **Paginación**: pasar de cursor a offset, con el mismo envelope que `/songs/search`, porque
      `usersService.searchUsers` y `SearchPeople` ya están construidos sobre `{ items, total, page,
      pageSize, totalPages }`. Es la decisión D11.
- [ ] **Campos**: el endpoint devuelve la fila de la vista a pelo. La UI espera el shape de
      `mocks/users.js`, que usa `avatarUrl` y `bio`; la base tiene `picture_url` y `biography`, y
      `email` no está expuesto. Definir si el backend devuelve esos nombres o si el mapeo vive en el
      service (regla 6 de `AGENTS.md`: el mapeo va en `services/`, no en los componentes).
- [ ] **Query vacía**: `validateQuery` hoy tira `400` si `query` viene vacío, mientras que
      `/songs/search` trata la query vacía como "catálogo completo". Unificar: `SearchPeople` muestra un
      se pide con una query vacía, no un error.
- [ ] Sacar el `console.log(query)` que quedó en `user.controller.js`.
- [ ] `PATCH /users/me` valida `username` único y de largo: el esquema tiene `VarChar(50)` para
      `username` y `VarChar(255)` para `email`.
- [ ] Los ids salen enteros. `updateProfile` mock hoy recibe el id del mock (`'u1'`); al migrar, la firma
      pasa a ser el id del token.

### [ ] REQ-AUTH-3 — Cuál es la ruta de auth

`app.js` monta `authRoutes` en `/api/auth` **y** en `/api/v1/auth`. Un mismo endpoint en dos prefijos
termina en que un cliente se pegue al prefix viejo y nadie lo note hasta que se rompe.

- [ ] Quedarse con `/api/auth` y sacar `/api/v1`.
- [ ] Dejar escrito por qué: la convención de `AGENTS.md` es `/api` sin versión.

---

## 4. Playlists y favoritos (P0)

Es la migración más delicada: el backend tiene `Playlist`, `PlaylistSong` y `Favorite` en el esquema,
pero **el mock y el esquema modelan los favoritos de forma distinta**.

### 4.1 Decisión a tomar: qué es "Mis Favoritos"

- **El esquema:** `Favorite` es una tabla N:M aparte (`idUser`, `idSong`, `markedDate`).
- **El mock de TS-09:** los favoritos son *una playlist* con `isFavorites`, que aparece en la biblioteca
  y se abre en el mismo detalle que las demás.

Si se implementan los favoritos como endpoints sobre la tabla `Favorite` y además se deja el
`isFavorites` del lado del cliente, quedan dos fuentes de verdad y se desincronizan.

**Recomendación:** la tabla `favorite` es la única fuente, y `GET /api/favorites` devuelve las canciones
favoritas ordenadas por `markedDate DESC`. El frontend arma la playlist virtual "Mis Favoritos" en
`playlistsService` a partir de esa respuesta, con el mismo objeto que ya devuelve hoy. O sea: **cambia el
almacenamiento, no la forma**. Es exactamente el punto de la regla 6 de `AGENTS.md`.

- [ ] Decidir y documentar. La alternativa (materializar la playlist en la tabla `playlist`) se descarta
      salvo que el producto pida compartir la colección de favoritos con otras personas.

### 4.2 [ ] REQ-PLAYLIST-1 — Endpoints de playlists

Todos exigen `authenticate`. El dueño **sale siempre del token**, nunca del body: es la misma garantía
que ya aplica el mock.

| Método | Ruta | Notas |
| --- | --- | --- |
| `GET` | `/api/playlists` | Las del usuario del token, orden `creationDate DESC`. Si `isPublic` se usa, va en otra ruta. |
| `POST` | `/api/playlists` | Body `{ name, description? }`. `type: personal`, `isPublic: false`, `idCreator` del token. `201` con la playlist creada. |
| `GET` | `/api/playlists/:id` | `404` si es de otro (no `403`). |
| `PATCH` | `/api/playlists/:id` | Solo nombre y descripción. Solo creador o `colaborator` (TS-12). |
| `DELETE` | `/api/playlists/:id` | Borrar la fuente de una sala tiene `onDelete: Restrict` en `Room`: devolver `409` con mensaje claro, no un 500 de Prisma. |
| `GET` | `/api/playlists/:id/songs` | Canciones en `position ASC`, con `artist` y `songGenres` incluidos. |
| `POST` | `/api/playlists/:id/songs` | Body `{ songId }`. **Idempotente**: ver §4.3. |
| `DELETE` | `/api/playlists/:id/songs/:songId` | Al borrar, renumerar `position` o dejar huecos: ver §4.3. |
| `GET` | `/api/playlists/:id/members` | Para las colaborativas (TS-12/TS-13). |

- [ ] `name` no vacío y de largo `<= 150` (`VarChar(150)`); si no, `400`, no un 500 de Prisma.
- [ ] `type` no lo manda el cliente: el service fuerza `personal` si no viene `colab`.

### 4.3 [ ] REQ-PLAYLIST-2 — Reglas que el esquema impone

`PlaylistSong` tiene PK compuesta `[idPlaylist, idSong]`. Eso implica tres cosas concretas:

1. **No se puede agregar dos veces la misma canción.** La segunda insertada revienta con `P2002`, que el
   `errorHandler` traduce a un 409 con "Ya existe un registro con el mismo valor para: idPlaylist,
   idSong": un mensaje inútil para el usuario. El mock ya es idempotente, así que el backend debería
   serlo también: si la fila existe, devolver `200` con la playlist, no `409`.
2. **`position` hay que calcularlo.** No hay default ni trigger: es `max(position) + 1` dentro de una
   transacción. Dos altas simultáneas pueden sacar el mismo `position` (no hay constraint único que lo
   impida), así que hay que decidir si alcanza con un desempate por `id_song`/`addedDate` o si hace
   falta serializar la transacción.
3. **Al quitar quedan huecos.** Si se borra la posición 2 de 5, quedan 1,3,4,5. Renumerar en la misma
   transacción es lo correcto y el volumen es bajo; la alternativa es ordenar y dejar los huecos.

### 4.4 [ ] REQ-PLAYLIST-3 — Forma de la respuesta

El frontend mapea en `playlistsService`, pero hay que saber qué campo trae cada cosa:

| En la UI | Del backend |
| --- | --- |
| `songIds` | `PlaylistSong[]` con `idSong` y `position` |
| `isFavorites` | **No viene del backend** (ver §4.1): lo arma el service del lado del cliente |
| `createdAt` | `creationDate` |
| `ownerId` | `idCreator` |

Las canciones llegan **completas** en `GET /playlists/:id/songs`, no como ids sueltos: si el endpoint
devuelve solo ids, el frontend tiene que hidratar con N requests (§5.1).

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
- [ ] Cerrar el ítem 8.4 de `PENDIENTES.md` con esa decisión.

### [ ] REQ-SONG-4 — `album`: columna o fuera del contrato

El esquema no tiene columna `album` y el filtro de búsqueda no la cubre. Por eso se quitó la palabra del
copy de `SearchSongs` (§8.3 de `PENDIENTES.md`).

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
      seguidores. Ver `PENDIENTES.md` §9.

---

## 7. Salas (P1 → P2)

Es lo más caro del proyecto, y el esquema tiene una restricción que condiciona todo: **`Room` exige
`idPlaylistSource`** (`onDelete: Restrict`). No hay sala sin playlist de origen, y borrar esa playlist con
una sala viva tiene que dar `409`.

| Método | Ruta | Notas |
| --- | --- | --- |
| `GET` | `/api/rooms` | Filtros `query` y `status`; para TS-17, orden por calificación del anfitrión. |
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

| # | Decisión | Afecta a | Bloquea |
| --- | --- | --- | --- |
| D1 | ¿Favoritos como tabla `favorite` o como playlist materializada? | §4.1 | Toda la API de favoritos |
| D2 | ¿"Mis Favoritos" es compartible? Si sí, hace falta la playlist de verdad | §4.1 | TS-12 |
| D3 | ¿`source` lo calcula el frontend? (recomendado: sí) | §5 | Cierra PENDIENTES 8.4 |
| D4 | ¿`album` entra al esquema o queda fuera? | §5 | Copy y filtro de búsqueda |
| D5 | ¿Dónde viven los votos de skip? | §7 | TS-18 entero |
| D6 | ¿El host que sale de una sala la deja o la cierra? | §7 | `POST /rooms/:id/leave` |
| D7 | ¿Se revocan los tokens al hacer logout? | §3 | `POST /auth/logout` real |
| D8 | ¿Chat por WebSocket, con mensajes persistentes o efímeros? | §8 | Tareas de salas y chat |
| D9 | ¿Librería de validación para los endpoints nuevos? Hoy `utils/validation.js` es a mano | §2, todos | Consistencia de los `400` |
| D10 | ¿CORS con lista explícita de orígenes para el APK? | §2 | Build de producción |
| D11 | ¿`/api/users/search` pasa a offset o el frontend se adapta al cursor? (recomendado: offset, igual que `/songs/search`) | §2, REQ-USER-1 | `SearchPeople` |

---

## 11. Orden sugerido de incorporación

Cada bloque se puede entregar solo. La regla es: al terminar uno, el mock que reemplaza se borra (o queda
sin imports, como pasó con `mocks/songs.js`) y se actualizan las casillas.

1. **REQ-HTTP-1 + REQ-AUTH-1/2/3 + REQ-USER-1** → la sesión y el perfil salen del mock. Es el bloque que
   desbloquea todo lo demás y el que más riesgo tiene (ids, tokens, forma del user).
2. **REQ-PLAYLIST-1/2/3 + D1** → TS-09 pasa de `localStorage` a la base.
3. **REQ-SONG-1/2** → hidratar playlists sin N requests.
4. **Follow + perfil** → TS-10.
5. **Salas** → cuando D5 y D6 estén resueltas. Es el bloque más grande.
6. **WebSocket + chat** → cuando D8 esté decidido.
7. **Recomendaciones** → al final, es lo más abierto a producto.

**Definition of done de cada bloque:**

- [ ] `npm run build` y `npm run lint` pasan en el frontend, sin warnings nuevos.
- [ ] Los endpoints verificados **contra la base real** con `curl`, no solo con un script que intercepta
      Prisma. El aprendizaje de §8.8 de `PENDIENTES.md`: la lógica se puede probar sin base, pero los
      includes anidados y el mapeo de tipos no.
- [ ] El service migrado no importa nada de `mocks/`.
- [ ] Los errores del backend (401/403/404/409) tienen una salida visible en la UI, no una pantalla en
      blanco.
- [ ] La pantalla se probó en navegador, porque no hay E2E en el repo.

---

## 12. Trazabilidad con los sprints

| Tarea | Requiere | Bloqueada por |
| --- | --- | --- |
| TS-10 Seguir personas | REQ-HTTP-1, REQ-USER-1, endpoints de follow | — |
| TS-11 Calificar anfitrión | §7, ratings | salas |
| TS-12 Playlist colaborativa | `PlaylistMember` + `tokenInvitation` | D1, D2 |
| TS-13 Invitar a colaborativa | endpoints de invitación | TS-12 |
| TS-14/15/16 Salas | §7 completo | D5, D6 |
| TS-17 Ordenar salas por calificación | `AVG(host_rating)` | TS-11 |
| TS-18 Votar skip | votos de skip | **D5** |
| TS-19/20 Recomendaciones | §9 completo | modelo de recomendación |

---

## 13. Verificación

Arranque (los mismos comandos de `ESPECIFICACIONES-BACKEND.md` §5.2):

```bash
cd Backend
docker compose up -d
# copiar .env.example a .env con DATABASE_URL y las POSTGRES_*
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

Chequeos de humo del bloque 1:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"email":"a@b.com","username":"ab","password":"Demo1234"}'
#    esperado: 201 con token (hoy NO lo devuelve)

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
