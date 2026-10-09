# Contratos de la API

> Alcance: contrato vigente de los endpoints montados en `Backend/src/app.js` (todo bajo `/api`).
> §1–5 documentan en detalle el endpoint de canciones (el primero implementado y verificado);
> §6–10 cubren auth, usuarios y follow, favoritos, playlists y salas.
>
> Lo que todavía no existe (salas CRUD, chat, recomendaciones, playlists colaborativas…) vive en
> `REQUERIMIENTOS-BACKEND.md`.

---

## 1. Endpoints y qué los consume

| Endpoint | Respuesta | Uso en el frontend |
| --- | --- | --- |
| `GET /api/songs` | `{ songs, nextCursor, hasMore }` | `listSongs()` → `PlayerContext` (cola inicial) y `HomeDesktop` (fila novedades) |
| `GET /api/songs/search` | `{ items, total, page, pageSize, totalPages }` | `searchSongs()` → `SearchSongs` (fila de páginas numeradas) |
| `GET /api/songs/:id` | objeto de la canción | `getSongById()` (sin consumidores por ahora) |

El frontend mapea el payload crudo a su propia forma en `Frontend/src/services/songsService.js`
(`url` → `audioUrl`, `artist.name` → `artist`, `songGenres[].genre.name` → `genre`), así que el backend
no expone campos con nombres pensados para el frontend.

`GET /api/songs` sigue con cursor a propósito: alimenta la cola inicial y la fila de novedades, que
consumen los primeros elementos y no necesitan saltar de página.

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
GET /api/songs/search?query=<texto>&page=<n>&pageSize=<n>
```

| Param | Tipo | Default | Notas |
| --- | --- | --- | --- |
| `query` | string | `''` | Ausente o vacío = catálogo completo, no error |
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

**Validación tolerante.** `parsePagination` usa `Number.parseInt` y cae al default si el valor no es un
entero ≥ 1; `pageSize` se limita a `MAX_PAGE_SIZE = 50` para que nadie pida la tabla entera. El
controller solo pasa `req.query` al service: la normalización vive en un único lugar.

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
| `PATCH /me` | `JWT` | body: `username`, `biography`, `pictureUrl` (sólo los presentes) | `user` actualizado. 400 si el username es inválido o ya está usado |
| `GET /:id` | — | — | `{ id, username, pictureUrl, biography, registrationDate, followers[], following[], followerCount, followingCount }`. 404 si no existe, 400 si el id no es un entero |
| `GET /:id/followers` | — | — | `{ status, followers: [{ id, username, pictureUrl }] }` — **array completo, sin paginar** |
| `GET /:id/following` | — | — | `{ status, following: [{ id, username, pictureUrl }] }` — ídem |
| `POST /:id/follow` | `JWT` | — | 200 `{ status, message }` (idempotente). 400 si el id es inválido o te seguís a vos mismo; 404 si el usuario no existe |
| `DELETE /:id/follow` | `JWT` | — | 200 `{ status, message }`. 404 si no lo seguías |

No existe un endpoint `isFollowing` directo para un perfil: el Frontend lo deriva de la lista de
seguidores. La búsqueda (`GET /search`) sí trae la relación completa por resultado cuando hay sesión
(`isFollowing` + `followsMe`, TS-10b); el perfil público sigue sin él.

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
| `GET /` | — | `{ status, playlists[] }` — las del usuario, con `creator` y `songs` ordenadas por posición |
| `GET /:id` | — | `{ status, playlist }`. **404 si no es del dueño** |
| `POST /` | body: `name` (obligatorio, ≤50), `description`, `isPublic` | 201 `{ status, playlist }` con `type: "personal"` |
| `PUT /:id` | body: `name?`, `description?`, `addSongs?`, `removeSongs?`, `reorder?` | 200 `{ status, playlist }`. 403 si no es el dueño o si es la de favoritos, 404 si no existe |
| `DELETE /:id` | — | 200 `{ status, message }`. 403 si no es el dueño o si es la de favoritos |

No hay sub-recursos `/songs`: las canciones llegan incluidas en `GET /` y `GET /:id`, y se agregan,
quitan o reordenan en lote a través de `PUT /:id` (`addSongs`/`removeSongs`/`reorder`).

---

## 10. Salas — `/api/rooms`

| Endpoint | Auth | Request | Response |
|---|---|---|---|
| `GET /` | — | query: `sort` = `alphabetical` (default) \| `rating` | **Array plano** (sin envelope) de filas con `room.*` + `avg_rating`, desde la vista `room_avg_rating` |
