# Endpoint de canciones — contrato aplicado

> Alcance: se modificaron **frontend y backend**. La paginación por offset y los nombres de género ya
> están implementados; este documento queda como referencia del contrato final.
>
> Contradicción con `AGENTS.md`: la convención de rutas dice `/api/songs`, así que lo de abajo ya no
> incluye sugerencia de prefijo. Las rutas vigentes son las de `Backend/src/app.js`.

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

Esto sigue **sin ejecutarse**: el backend no responde en `localhost:3000`, Docker no está levantado y no
existe `Backend/.env` (solo `.env.example`, sin `DATABASE_URL`). Ver `PENDIENTES.md` §8.8.
