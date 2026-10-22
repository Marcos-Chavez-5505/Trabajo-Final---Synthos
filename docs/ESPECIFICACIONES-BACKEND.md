# Contratos de la API

> Alcance: contrato vigente de los endpoints montados en `Backend/src/app.js` (todo bajo `/api`).
> §1–5 documentan en detalle el endpoint de canciones (el primero implementado y verificado);
> §6–10 cubren auth, usuarios y follow, favoritos, playlists y salas.
>
> Lo que todavía no existe (salas CRUD, chat, playlists colaborativas con rutas…) vive en
> `REQUERIMIENTOS-BACKEND.md`.

---

## 0. Forma de los errores

Todo endpoint responde los errores con el mismo cuerpo:

```json
{ "status": "error", "message": "Ese nombre de usuario ya está en uso.", "code": "USERNAME_TAKEN" }
```

- **`code` es un identificador estable** en mayúsculas y con guion bajo (`USERNAME_TAKEN`,
  `IMAGE_TOO_LARGE`, `FOLLOW_REQUIRED`…). Es el contrato con el frontend: la UI traduce por `code`
  (`Frontend/src/utils/mapError.js`) y **no debería depender del texto**. Cambiar la redacción de un
  mensaje no rompe ninguna pantalla.
- **`message`** es para el humano, siempre en español, y se muestra tal cual cuando el `code` no es
  conocido por la UI.
- **Campos extra:** algunos errores agregan datos al mismo body, como el `errors[]` de
  `POST /auth/register` (`code: "REGISTER_INVALID"`) o el `allowed` de `INVALID_EXPRESSION`.
- Los errores de Prisma viajan con su propio `code` (`P2002`, `P2023`…), ya que son la causa real.
- El status sale de `error.httpStatus`, nunca de `error.code`: si se usara el `code` para el status,
  un string como `P2023` haría revocar `res.status()` y devolvería un 500 en HTML.

---

## 1. Endpoints y qué los consume

| Endpoint | Respuesta | Uso en el frontend |
| --- | --- | --- |
| `GET /api/songs` | `{ songs, nextCursor, hasMore }` | `listSongs()` → `PlayerContext` (cola inicial) y `HomeDesktop` (fila novedades) |
| `GET /api/songs/search` | `{ items, total, page, pageSize, totalPages }` | `searchSongs()` → `SearchSongs` (fila de páginas numeradas). `type=albums` → `listAlbums()` → `/albums` |
| `GET /api/albums/:id` | `{ status, album }` con `artist` y `songs[]` | `getAlbumById()` → `/albums/:id` |
| `GET /api/artists` | `{ items, total, page, pageSize, totalPages }` con `_count.albums` y `_count.songs` | `listArtists()` → `/artistas` (catálogo paginado con `?q=`) |
| `GET /api/artists/:id` | `{ status, artist }` con `albums[]` | `getArtistById()` → `/artistas/:id` |
| `GET /api/songs/:id` | objeto de la canción | `getSongById()` (sin consumidores por ahora) |
| `GET /api/songs/recommendations` | `{ status, songs }` por estado de ánimo | `listSongsByMood(expression)` → `/animo` (TS-20). 400 `EXPRESSION_REQUIRED` / `INVALID_EXPRESSION` |
| `GET /api/songs/popular` | `{ status, week, minimumFavorites, songs[] }` con `favoriteCount` | `listPopularSongs()` → `/populares`. Ranking de la semana en curso por favoritos distintos |

El frontend mapea el payload crudo a su propia forma en `Frontend/src/services/songsService.js`
(`url` → `audioUrl`, `artist.name` → `artist`, `songGenres[].genre.name` → `genre`, `album.name` → `album`), así que el backend
no expone campos con nombres pensados para el frontend. Los álbumes y artistas tienen sus propios
mappers en `Frontend/src/services/albumsService.js` y `artistsService.js`.

`GET /api/songs` sigue con cursor a propósito: alimenta la cola inicial y la fila de novedades, que
consumen los primeros elementos y no necesitan saltar de página.

`GET /api/songs/recommendations?expression=<ánimo>` (TS-20/B9) devuelve canciones aleatorias del catálogo de ese
estado de ánimo, con `200 { status, songs }` o `[]` si no hay, y **400 "Expresión inválida."** si el `expression` no
es un mood del catálogo (`neutral`, `happy`, `sad`, `angry`). El plan lo pedía como `/api/songs/mood`: la ruta real es la canónica.

`GET /api/songs/popular` (público) devuelve el ranking de la **semana en curso** (lunes 00:00 a lunes 00:00 UTC,
para que el corte no dependa de la zona horaria del server). Cuenta `COUNT(DISTINCT id_user)` sobre
`favorite.marked_date` dentro de esa ventana: si la misma persona marcó la misma canción varias veces, cuenta una
sola vez, y solo entran las canciones con **al menos 3 personas distintas**. Se ordena por `favoriteCount` desc y
luego por id asc. `week.to` es exclusivo. La consulta se hace en cada request (ventana semanal, sin foto cacheada),
así que los favoritos de la semana se ven al recargar `/populares`.

```bash
curl "http://localhost:3000/api/songs/popular"
# 200 { status, week: { from, to }, minimumFavorites: 3, songs: [{ ...song, favoriteCount }] }
# songs: [] si ninguna llegó al mínimo; no es un error.
```

**Seed de prueba:** `seedUsers.js` incluye `POPULAR_SONGS`, un puñado de canciones que marcan 3 o 4 usuarios
distintos y cuyo `markedDate` se refresca a la fecha de la corrida, para que el ranking tenga datos en cualquier
semana. No hace falta migración: `favorite.marked_date` ya existía.

---

## 2. `GET /api/songs/search` — offset

### 2.1 Por qué se cambió

El endpoint devolvía `{ items, nextCursor }`, y un cursor no puede expresar la pantalla `/buscar`: esa
vista dibuja una fila de páginas numeradas (`1 2 3 4 …`, con elipsis), permite saltar a cualquier
página y pone el número en la URL (`?page=3`) para que el enlace sea compartible y funcione el botón
"atrás" del browser. Un cursor es un puntero "seguí desde acá", no un índice: no hay forma de pedir
"la página 7".

### 2.2 Contrato

**Request**

```
GET /api/songs/search?query=<texto>&type=<songs|albums>&page=<n>&pageSize=<n>
```

| Param | Tipo | Default | Notas |
| --- | --- | --- | --- |
| `query` | string | `''` | Ausente o vacío = catálogo completo, no error |
| `type` | string | `songs` | `songs` o `albums`. Cualquier otro valor: `400 SEARCH_TYPE_INVALID` |
| `page` | int ≥ 1 | `1` | 1-based |
| `pageSize` | int ≥ 1 | `10` | El frontend manda `10`; tope duro de `50` |

**Response 200**

```json
{
  "items": [ /* canciones */ ],
  "total": 137,
  "page": 3,
  "pageSize": 10,
  "totalPages": 14
}
```

| Campo | Tipo | Regla |
| --- | --- | --- |
| `items` | array | Máximo `pageSize` elementos |
| `total` | int | **Cantidad total de coincidencias**, no de la página. Es lo que permite dibujar los números |
| `page` | int | La página servida (ver clamping) |
| `pageSize` | int | El `pageSize` efectivamente aplicado, ya acotado |
| `totalPages` | int | `max(1, ceil(total / pageSize))` |

**`type=albums`** devuelve la misma envolvente, pero cada item es un **álbum**: `{ id, name, type, coverUrl,
releaseDate, artist: { id, name, pictureUrl }, _count: { songs } }`. El `query` busca por nombre de álbum o
de su artista. Es lo que consume la pantalla `/albums`.

### 2.3 Reglas de comportamiento

**Orden estable.** `orderBy: { id: "asc" }`. La paginación por offset exige un orden determinista: si
dos canciones cambian de posición entre requests, la página 2 repite o saltea filas.

**Conteo y página en la misma transacción.** `prisma.$transaction([count, findMany])` en
`song.service.js`, para que `total` y `items` describan el mismo estado de la tabla. El `count` es
indispensable: `items.length` no sirve, y sin él no hay forma de saber cuántas páginas hay.

**Clamping de página.** Si `page > totalPages`, se sirve la última con contenido y se devuelve `page`
ya corregido. Como el `skip` del `findMany` se calculó con la página pedida, el caso del clamp
repite la consulta con el `skip` correcto. El frontend lee ese valor y reescribe la URL con `replace`,
para no mostrar un "sin resultados" engañoso. `totalPages` nunca es `0`: con cero resultados es `1`.

**Query vacía es válida.** `?query=` y la ausencia de `query` devuelven el catálogo paginado.

**Filtro por álbum.** Con `type=songs`, el `query` también matchea el nombre del álbum de la canción
(`album: { name: { contains, insensitive } }`). Eso es lo que resuelve D4 y lo que habilita volver a decir
"álbumo" en el copy de `/buscar`.

**`type` validado.** `songs` (default) y `albums`; cualquier otro valor responde `400 SEARCH_TYPE_INVALID`
con su `code`. Antes caía en un 500 por una variable sin definir.

**Payload de canción.** Todas las respuestas de canciones (`/songs`, `/songs/:id`, `/songs/search`,
`/songs/recommendations`, `/songs/popular`) incluyen `album: { id, name }` vía `SONG_INCLUDE`.

### 2.4 Detalle de álbum - `GET /api/albums/:id`

Público, como el resto de canciones.

| Situación | Respuesta |
|---|---|
| Existe | 200 `{ status, album }` |
| Id no numérico | 400 `INVALID_ID` (viene de `getId`) |
| No existe | 404 `ALBUM_NOT_FOUND` |

El `album` trae `artist` y `songs[]`, con cada canción en la misma forma que devuelve el resto de la API
(`songGenres`, `songMoods`, `artist`). Las canciones **no** repiten `album`: ya están dentro de uno, así
que el include no lo agrega y el mapper del frontend las deja en `null`.

**Orden de las pistas:** `orderBy: { id: "asc" }`, porque el esquema no tiene número de track. El seed
guarda las canciones en el orden en que las trae la fuente, pero no está garantizado que sea el orden del
disco. Si alguna vez importa, hace falta una columna de posición.

**Validación tolerante.** `parsePagination` usa `Number.parseInt` y cae al default si el valor no es un
entero ≥ 1; `pageSize` se limita a `MAX_PAGE_SIZE = 50` para que nadie pida la tabla entera. El
controller solo pasa `req.query` al service: la normalización vive en un único lugar.

### 2.5 Artistas — `GET /api/artists` y `GET /api/artists/:id`

Públicos, como canciones y álbumes.

**Listado**

```
GET /api/artists?query=<texto>&page=<n>&pageSize=<n>
```

| Param | Tipo | Default | Notas |
| --- | --- | --- | --- |
| `query` | string | `''` | Filtra por nombre de artista; vacío = catálogo completo |
| `page` | int ≥ 1 | `1` | 1-based |
| `pageSize` | int ≥ 1 | `10` | Tope duro de `50`; el frontend manda `18` |

**Response 200** — misma envolvente que las búsquedas paginadas:

```json
{
  "items": [
    {
      "id": 501273,
      "name": "83Crutch",
      "pictureUrl": "https://usercontent.jamendo.com?type=artist&id=501273&width=300",
      "_count": { "albums": 3, "songs": 3 }
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 18,
  "totalPages": 1
}
```

Orden: `name` asc. El `query` usa `contains` con `mode: "insensitive"`. El listado **no** trae los
álbumes: eso queda para el detalle, así la respuesta no crece con el catálogo.

**Detalle**

```
GET /api/artists/:id
```

| Situación | Respuesta |
|---|---|
| Existe | 200 `{ status, artist }` |
| Id no numérico | 400 `INVALID_ID` (viene de `getId`) |
| No existe | 404 `ARTIST_NOT_FOUND` |

El `artist` incluye `_count: { albums, songs }` y `albums[]`, cada álbum con la misma forma del listado
de discos (`artist` y `_count.songs`). Los álbumes se ordenan por `name` asc. El frontend reutiliza
`toAlbum()` y `MiniMediaCard`; el detalle de cada disco sigue siendo `/albums/:id`.

```bash
curl "http://localhost:3000/api/artists?query=crutch&page=1&pageSize=18"
curl "http://localhost:3000/api/artists/501273"
```

---

## 3. Nombres de género en el payload

`SONG_INCLUDE` (`Backend/src/services/song.service.js`) ahora anida la entidad en los joins:

```js
const SONG_INCLUDE = {
  artist: true,
  songGenres: { include: { genre: true } },
  songMoods: { include: { mood: true } },
};
```

Antes `songGenres: true` devolvía solo las filas de unión (`{ idSong, idGenre }`) y el nombre del
género no viajaba, así que las cards de `/home` y `/buscar` salían con la etiqueta vacía. Con el
include anidado, `songsService.toSong()` toma `songGenres[].genre.name` y la pantalla muestra la
etiqueta.

Esto también cierra el desajuste del filtro por género, que siempre buscó sobre `genre.name` pero sin
exponer ese dato en las respuestas.

---

## 4. Bugs corregidos de paso

**`searchSongs` devolvía 500 si faltaba `query`.** El controller hacía `query.trim()` sobre `undefined`
→ `TypeError`. Ahora el service normaliza con `typeof query === "string" ? query.trim() : ""`.

**`Number(cursor)` daba `NaN`.** Irrelevante al pasar a offset, pero el `cursor` ya no se castea en el
controller.

---

## 5. Verificación

### 5.1 Lógica de paginación (sin base de datos)

La paginación se validó con un script temporal que intercepta el `require` de `prismaClient` y lo
sustituye por un catálogo sintético de 137 canciones. Comprobó, entre otras cosas:

- `skip` correcto en la página del medio (`(page - 1) * pageSize`).
- Página fuera de rango → `page` corregido a `totalPages`, con `skip` recalculado y contenido.
- Última página parcial (137 no es múltiplo de 10 → 7 elementos).
- Defaults con `page`/`pageSize` ausentes, `"0"`, `"-5"` y `"abc"`; tope de `pageSize`.
- Recorrer las 14 páginas: 137 ids, sin repetidos, orden ascendente.

Todas pasaron. El script era de un solo uso y se eliminó después.

### 5.2 Con la base de datos

```bash
# 1. Base + backend
cd Backend
docker compose up -d
# copiar .env.example a .env y completar DATABASE_URL y las POSTGRES_*
npx prisma migrate dev --name <nombre>
npx prisma db seed
npm run dev

# 2. Contrato: page/total/totalPages consistentes
curl "http://localhost:3000/api/songs/search?query=rock&page=1&pageSize=10"
curl "http://localhost:3000/api/songs/search?query=rock&page=999&pageSize=10"
#    esperado: page corregido a la última con contenido, no una lista vacía
curl "http://localhost:3000/api/songs/search?page=1&pageSize=10"
#    esperado: catálogo completo, sin 500
curl "http://localhost:3000/api/songs/popular"
#    esperado: 6 canciones del seed con favoriteCount 3 o 4, ordenadas de mayor a menor

# 3. Frontend
cd Frontend && npm run dev
```

En el frontend: `/home` muestra novedades con carátula, artista y género; `/buscar` pagina con números;
el reproductor reproduce audio real desde la fila de novedades.

La verificación contra la base real sigue pendiente (no hay `Backend/.env` ni base levantada):
ver `PENDIENTES.md` §5.7.

---

## 6. Auth — `/api/auth` (y `GET /api/health`)

**Auth**: `JWT` = requiere `Authorization: Bearer <jwt>`. Sólo `POST /api/auth/logout` y las rutas
de `me`/`playlists`/`favorites`/follow son privadas; el resto es público.

| Endpoint | Auth | Request | Response |
|---|---|---|---|
| `GET /api/health` | — | — | `{ status: "ok" }` |
| `POST /api/auth/register` | — | body: `email`, `username` (3–50), `password` (≥8, con letra y número) | 201 `{ status, token, user }`. 400 con `errors: []`; 400 si el email o el username ya existen |
| `POST /api/auth/login` | — | body: `email`, `password` | 200 `{ status, token, user }` (sin `passwordHash`). 401 si no coincide |
| `POST /api/auth/logout` | `JWT` | — | 200 `{ status, message }` |

El registro **deja la sesión iniciada**: devuelve token igual que `login`. El JWT lleva
`{ sub, email, username }` y `sub` es el id del usuario. El `user` de register/login trae los mismos
campos que `GET /api/users/me`.

---

## 7. Usuarios y follow — `/api/users`

| Endpoint | Auth | Request | Response |
|---|---|---|---|
| `GET /search` | opcional | query: `query`, `page`, `pageSize` | `{ items, total, page, pageSize, totalPages }`. `items` viene de un `$queryRaw`, así que trae **`picture_url` y `genre_name` en snake_case**; `query` vacío = todos los usuarios. **Con sesión** (Bearer) cada ítem suma la relación en los **dos sentidos**: `isFollowing` (el que busca ya lo sigue) y `followsMe` (esa persona ya lo sigue a él), resueltos con dos `EXISTS` en la misma query (jamás una consulta por resultado) |
| `GET /me` | `JWT` | — | `user` con `email`, o 404 |
| `PATCH /me` | `JWT` | body: `username`, `biography`, `pictureUrl` (sólo los presentes) | `user` actualizado. 400 si el username es inválido o ya está usado, si `pictureUrl` es una data URL (base64) o si no es una URL `http(s)` |
| `POST /me/picture` | `JWT` | `multipart/form-data`, campo `picture`: JPG, PNG o WEBP de hasta 2 MB | `user` actualizado (mismo shape que `PATCH /me`, con `pictureUrl` ya apuntando al CDN). 400 si no llega archivo / el tipo no está permitido / excede 2 MB, 401 sin sesión, 500 si falla la subida |
| `GET /:id` | — | — | `{ id, username, pictureUrl, biography, registrationDate, followers[], following[], followerCount, followingCount }`. 404 si no existe, 400 si el id no es un entero |
| `GET /:id/followers` | — | — | `{ status, followers: [{ id, username, pictureUrl }] }` — **array completo, sin paginar** |
| `GET /:id/following` | — | — | `{ status, following: [{ id, username, pictureUrl }] }` — ídem |
| `POST /:id/follow` | `JWT` | — | 200 `{ status, message }` (idempotente). 400 si el id es inválido o te seguís a vos mismo; 404 si el usuario no existe |
| `DELETE /:id/follow` | `JWT` | — | 200 `{ status, message }`. 404 si no lo seguías |
| `GET /:id/follow-status` | `JWT` | — | `{ status, viewerFollows, targetFollows, isMutual }`. 400 id inválido, 404 usuario inexistente. **Lo consume `useFollow`**: con un request resuelve los dos sentidos y la mutua |
| `GET /:id/recommendations` | `JWT` | — | `{ status, recommendations[] }` de más reciente a más antigua, con texto, fecha, canción y emisor. Ver §7.2 |
| `POST /:id/recommendations` | `JWT` | body: `songId`, `text` | 201 `{ status, recommendation }`. 400 si falta o viene vacío el texto o la canción, 404 si el usuario o la canción no existen, **403 si no hay follow mutuo**. Ver §7.2 |

No existe un endpoint `isFollowing` directo para un perfil: el Frontend lo deriva de la lista de
seguidores. La búsqueda (`GET /search`) sí trae la relación completa por resultado cuando hay sesión
(`isFollowing` + `followsMe`, TS-10b); el perfil público sigue sin él.

### 7.2 Recomendaciones entre personas (TS-19)

**Dónde se guarda el destinatario:** en `content_playement` (la tabla que liga contenido con usuario). `content`
guarda autor, texto, fecha y canción; cada recommendation es un `content` + una fila `content_playement` con el
receptor, creada en la misma transacción. No hay campo nuevo en el esquema.

**Visibilidad de `GET /users/:id/recommendations`:** el backend decide según quién pregunta.

| Quién pregunta | Qué ve |
| --- | --- |
| El dueño del perfil | Todas las que recibió, de más reciente a más antigua |
| Alguien que le recomendó | Solo las que él le envió (se filtra por `idAuthor`) |
| Cualquier otro | Lista vacía |

Orden `date: "desc"` en la consulta y también en el cliente (`useRecommendation`). La respuesta trae autor y
canción en el mismo `include`: no hay llamadas extra.

**Regla de envío (`POST /users/:id/recommendations`):** solo con **seguimiento mutuo**. Si seguís a la otra persona
pero ella no te sigue, responde `403`. Es lo que habilita el formulario: la UI lo renderiza solo cuando
`isMutual`.

```bash
curl -X POST localhost:3000/api/users/5/recommendations \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"songId":12,"text":"Esta va con todo lo que estabas escuchando"}'
```

**Contrato:** el plan de sprint 2 lo pedía como `POST /api/recommendations` (sin id en la ruta); quedó con el
destinatario en el path, que es lo que consume `recommendationService`. Las rutas reales son las canónicas.

### 7.1 Foto de perfil (`POST /me/picture`) — TS-21

**Almacenamiento:** ImageKit (servicio en nube; el despliegue es en Vercel y no hay disco). Requiere
`IMAGEKIT_PRIVATE_KEY` en el entorno. Sin esa variable el server **igual arranca** (el cliente de
ImageKit se instancia de forma perezosa, solo cuando alguien sube una foto) y el endpoint responde
500 con un mensaje en español; el resto de la API no se ve afectada.

**Tope de tamaño 2 MB**, aplicado por el middleware de multipart antes de tocar la red externa. El
Frontend recorta y recomprime en el navegador a ≤1 MB (`features/profile/profileImage.js`) porque el
body de una serverless function de Vercel corta ~4,5 MB: una foto de celular de 3-8 MB en base64 no
entraría. `express.json()` quedó con su límite por defecto de 100 KB: la foto ya no viaja en el JSON
del `PATCH`.

**Un archivo por usuario, cero huérfanos:** el upload va con `useUniqueFileName: false` y el nombre es
determinista (`avatars/avatar-<id de usuario>.<ext>`), así que ImageKit reemplaza el archivo del
usuario en sitio y no hay que borrar nada. La URL guardada suma `?v=<timestamp>` porque el nombre no
cambia entre subidas y sin ese query el navegador y la CDN seguirían sirviendo el avatar anterior.
Cambiar de formato (JPG → PNG) deja el archivo viejo en ImageKit hasta que el usuario vuelva a subir
una foto en ese formato.

**`pictureUrl` es una columna de texto:** `PATCH /me` rechaza con 400 cualquier data URL
(`data:image/...;base64,...`). La imagen entra solo por el endpoint multipart.

```bash
TOKEN=$(curl -s -X POST localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"host.rock@example.com","password":"Demo1234"}' | jq -r .token)

curl -X POST localhost:3000/api/users/me/picture \
  -H "Authorization: Bearer $TOKEN" \
  -F "picture=@foto.png"

curl -X PATCH localhost:3000/api/users/me \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"pictureUrl":null}'          # quita la foto (el archivo queda en ImageKit)
```

---

## 8. Favoritos — `/api/favorites` (todas `JWT`)

| Endpoint | Request | Response |
|---|---|---|
| `GET /` | — | `{ status, playlist: { id, name } \| null, songs[] }` |
| `GET /songs/ids` | — | `{ status, songIds: number[] }` — es lo que consume el hook de favoritos |
| `POST /songs` | body: `songId` (o `idSong`) | 201 `{ status, favorite: { song, markedDate } }`. 400 id inválido, 404 canción inexistente, 409 ya está en favoritos |
| `DELETE /songs/:songId` | — | 200 `{ status, message }`. 404 si no estaba en favoritos |

**Cómo funcionan los favoritos:** no son un estado aparte, sino una playlist con
`type: "favorites"`, que se crea sola (`"Favoritos"`, privada) al agregar el primer favorito. Las
canciones marcadas viven en la tabla `favorite`; `GET /` y `GET /:id` la sintetizan para que el
Frontend la trate como una playlist más. No se puede editar ni borrar (403).

---

## 9. Playlists — `/api/playlists` (todas `JWT`)

| Endpoint | Request | Response |
|---|---|---|
| `GET /` | — | `{ status, playlists[] }` — las que creó **y** las colaborativas donde es miembro, con `creator`, `members` y `songs` ordenadas por posición |
| `GET /:id` | — | `{ status, playlist }`. **404 si no es del creador, no es miembro y no es pública** |
| `POST /` | body: `name` (obligatorio, ≤50), `description`, `isPublic`, `type` (`colab` o `personal`, **obligatorio**) | 201 `{ status, playlist }` con `creator` y `type`. 400 `PLAYLIST_TYPE_INVALID` |
| `PUT /:id` | body: `name?`, `description?`, `addSongs?`, `removeSongs?`, `reorder?` | 200 `{ status, playlist }`. 403 si no es el dueño o si es la de favoritos, 404 si no existe |
| `DELETE /:id` | — | 200 `{ status, message }`. 403 si no es el dueño o si es la de favoritos |
| `POST /:id/songs` | body: `songId` | 201 `{ status, song }`. 403 `NOT_PLAYLIST_OWNER` (personal ajena) o `NOT_PLAYLIST_MEMBER` (colab sin membresía), 409 si ya estaba |
| `DELETE /:id/songs/:songId` | — | 200 `{ status, message }`. 404 si no estaba, 403 si no sos miembro |
| `POST /:id/invitation` | body: `userId` | 201 `{ status, invitation, converted }`. 400 id inválido / `INVITATION_SELF` / `INVITATION_FAVORITES_LOCKED`, 404 si no existe la playlist o la persona (`INVITATION_USER_NOT_FOUND`), 403 si no es el creador, 409 `PLAYLIST_ALREADY_MEMBER`. `converted: true` si la playlist era `personal` y pasó a `colab` |
| `GET /:id/invitations` | — | `{ status, invitations[] }`. Solo el creador (403 si no) |
| `DELETE /:id/members/:userId` | — | 200 `{ status }`. Solo el creador, 404 si no era miembro, 400 `CANNOT_REMOVE_CREATOR` |
| `GET /invitations` | — | `{ status, invitations[] }` — las **pendientes** recibidas |
| `POST /invitations/:idPlaylist/accept` | — | 201 `{ status, invitation }`. 404 `INVITATION_NOT_FOUND` si no hay pendiente |
| `POST /invitations/:idPlaylist/reject` | — | 200 `{ status, invitation }`. 404 `INVITATION_NOT_FOUND` |

Las canciones se agregan y quitan con `POST|DELETE /:id/songs`, que son las rutas que aplican los roles;
`PUT /:id` sigue siendo del creador y ya no se usa para tocar canciones.

### 9.1 Playlists colaborativas e invitaciones (TS-12/TS-13, backend)

**Crear una colaborativa** es `POST /` con `type: "colab"`, y el controller **valida el tipo**: sin `type`, o con uno
que no sea `personal` o `colab`, responde `400 PLAYLIST_TYPE_INVALID`. Cuando es `colab`, se inserta la fila
`PlaylistMember` con rol `creator` (el dueño se reconoce por `idCreator` y por esa fila).

**Permisos (D9):** `PUT /:id` y `DELETE /:id` validan `idCreator !== req.user.sub → 403`. Editar el nombre, borrar la
playlist, invitar y echar son del creador. **Las canciones no**: `POST /:id/songs` y `DELETE /:id/songs/:songId`
dejan que cualquier miembro de una `colab` agregue y quite; en una `personal`, solo el dueño.

**Invitaciones (redefinido el 2026-10-15):** no hay link. La invitación va **a una persona que ya existe**, con estado
pendiente, en la tabla `playlist_invitation` (clave primaria `[id_playlist, id_receiver]`, enum `invitation_status`
con `pendiente | aceptada | rechazada`).

- `POST /:id/invitation` solo para el creador y solo sobre `colab`. Invitar de nuevo a alguien que ya estaba invitado
  deja la fila en `pendiente` otra vez (D11); si ya es miembro, `409 PLAYLIST_ALREADY_MEMBER`.
- **Invitar convierte la playlist en colaborativa.** Si la playlist era `personal`, la misma transacción hace
  `UPDATE playlist SET type = 'colab'` e inserta la fila `playlist_member` del creador, así que no existe el
  concepto de "miembro de una playlist personal". La respuesta trae `converted: true`. La playlist de
  favoritos queda fuera (`400 INVITATION_FAVORITES_LOCKED`).
- `GET /invitations` lista solo las pendientes del usuario que pregunta; `POST /invitations/:idPlaylist/accept`
  inserta el `PlaylistMember` con rol `colaborator` y marca la invitación en la misma transacción; `reject` la marca
  como `rechazada`.
- `DELETE /:id/members/:userId` saca al participante y borra sus invitaciones.
- La columna `Playlist.tokenInvitation` **ya no existe** (migración `drop_token_invitation`): el flujo por token y
  `FRONTEND_URL` se eliminaron por completo.

---

## 10. Salas — `/api/rooms`

| Endpoint | Auth | Request | Response |
|---|---|---|---|
| `GET /` | opcional | query: `query` (texto libre), `sort` = `name` (default, alias `alphabetical`) \| `rating`, `order` = `asc` (default) \| `desc` | **Array plano** (sin envelope) de salas |
| `GET /mine` | **sí** | query: `query` opcional | Las salas activas de las que el usuario es miembro, mismas columnas. **Incluye las privadas** (a esas se entra con el código) |
| `POST /` | **sí** | body `{ name, description?, playlistId, isPrivate, password? }` | `201` con la sala: `id`, `code`, `name`, `description`, `isPrivate`, `maxCapacity` (**siempre 10**, lo fija el server), `status`, `hostAvgRating`, `viewerHasRated`, `members[]` (id, username, `pictureUrl`, rol), `playlistSource` con sus `songs` en orden por `position`. **Nunca devuelve `passwordHash`** |
| `POST /join` | **sí** | body `{ code, password? }` | `201` si se unió, `200` si ya era miembro. La misma sala que `POST /` |
| `GET /:id` | **sí** | — | `200` con la sala (igual que `POST /`, más `viewerHasRated` y `viewerRating`). `403` si no sos miembro, `404` si no existe |
| `POST /:id/leave` | **sí** | — | `204`. Si quien sale es el **anfitrión, la sala se cierra** |
| `DELETE /:id` | **sí** | — | `204`. Solo el anfitrión. Cierra la sala y emite `room:closed` |
| `DELETE /:id/members/:userId` | **sí** | — | `204`. Solo el anfitrión. `400` si se intenta sacar al anfitrión |
| `POST /:id/playback` | **sí** | body `{ action: "play" \| "pause" \| "next" \| "stop" }` | `200 { status, playback }`. **Solo el anfitrión** |
| `GET /:id/playback` | **sí** | — | `200 { status, playback, skipVotes }` |
| `POST /:id/skip-votes` | **sí** | — | `201 { status, skipVotes, approved }`. **403 para el anfitrión** |
| `POST /:id/rating` | **sí** | body `{ rating }` (entero 1–5) | `201 { status, rating }`. Califica al anfitrión (TS-11) |

**Forma de las salas del listado** (columnas explícitas, nunca `room.*`, para no filtrar
`password_hash`): `id`, `code`, `name`, `description`, `id_playlist_source`, `is_private`,
`max_capacity`, `status`, `creation_date`, `host_id`, `host_username`, `avg_rating`,
`members_count`, `songs_count`. El listado público devuelve **solo las públicas y activas**;
las privadas no aparecen (se entra con `code`, D14) y las cerradas tampoco. `avg_rating` es
`numeric` de Postgres y llega como **string**; cuando el anfitrión no tiene calificaciones el
backend lo coalescea a `0`.

**Orden:** `sort=name` ordena por nombre en el sentido de `order`; `sort=rating` ordena por
`avg_rating DESC` con desempate alfabético. `sort` u `order` inválidos devuelven `400` con
`INVALID_SORT` / `INVALID_ORDER` (`{ allowed: [...] }`).

**Origen de la playlist (D19):** `POST /rooms` acepta **cualquier playlist** a la que el
usuario tenga acceso, sea personal propia o colaborativa de la que participe: no se valida
`type`. Exige que exista (404), que sea suya o sea miembro (403) y que tenga al menos una
canción (400).

### 10.1 Sincronización (WebSocket)

Socket.IO sobre el mismo servidor HTTP. El handshake se autentica con el JWT en
`socket.handshake.auth.token`; sin token o con token inválido la conexión se rechaza. Cada
socket entra solo a su canal `user:<id>`; entrar a una sala es un `join-room` explícito que el
servidor valida contra `room_member` (un no miembro no entra al canal `room:<id>`).

| Evento | Cuándo | Payload |
|---|---|---|
| `joined-room` | Al entrar al canal (también en cada reconexión) | `{ roomId }` |
| `room:playback` | Cada acción de reproducción, y cuando se aprueba un voto de skip | `{ songId, status, positionMs, updatedAt }` |
| `room:members` | Entra o sale alguien, o se expulsa a alguien | `roomMember[]` (filas crudas con `user` anidado) |
| `room:skip-votes` | Cada voto, y al limpiarse la votación | `{ voters: number[], required }` (`required: 0` = ya no hay votación) |
| `room:rating` | Al calificar al anfitrión | `{ roomId, hostId, avgRating }` |
| `room:kicked` | Al expulsado, solo a su socket | `{ roomId }` |
| `room:closed` | Al cerrar la sala, y cuando sale el anfitrión | `{ roomId }` |

Los clientes **solo escuchan**: el estado cambia por REST y el servidor lo emite.

**Posición de reproducción:** el estado vive **en memoria del proceso**, una sola instancia, y
se pierde si el servidor se reinicia (tras un reinicio, `GET /:id/playback` responde
`stopped`). `positionMs` es la posición congelada en `updatedAt`, que es la **hora del
servidor**: mientras `status === "playing"`, la posición real es
`positionMs + (Date.now() - updatedAt)`. `pause` guarda la posición acumulada antes de
congelarla, así que reanudar no reinicia la canción.

**Votación de skip (D17):** se aprueba con más de la mitad de los miembros que **no** son
anfitrión (`floor(noHost/2) + 1`). Los votos son por canción, se limpian al cambiarla
(incluso si la playlist vuelve a la primera, D18) y `required` se recalcula si alguien sale o
es expulsado. `next` del anfitrión anula la votación en curso.

**Calificación del anfitrión (TS-11):** una por persona y sala, garantizada por la PK
`[idRoom, idRater, idHost]` (el `P2002` se traduce a `409 HOST_ALREADY_RATED`). Solo quien
participa califica y el anfitrión no califica a nadie (`403`). `GET /users/:id` y
`GET /users/me` devuelven además `hostRating` y `hostRatingsCount`, para que el perfil
muestre el promedio.
