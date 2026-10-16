import { get } from "./api.js";

// Contrato de la API real (ver docs/ESPECIFICACIONES-BACKEND.md):
//   GET /api/songs             -> { songs, nextCursor, hasMore }
//   GET /api/songs/search      -> { items, total, page, pageSize, totalPages }
//   GET /api/songs/:id         -> song
//
// La forma que consume la app (title, artist como string, audioUrl, coverUrl,
// genre, album) es un contrato del frontend: el backend devuelve la fila cruda de
// Prisma. El mapeo vive acá y no en los componentes, para que la app no dependa
// de cómo viene armado el payload (reglas 5 y 6 de AGENTS.md).

const SONGS_PATH = "/songs";

// Tamaño de página para búsquedas. Con backend real pasa a ser el `pageSize` de
// la query, que es lo que el endpoint espera.
export const SEARCH_PAGE_SIZE = 10;

/**
 * Convierte una canción del backend a la forma que usa la app.
 *
 * Diferencias que se traducen acá:
 * - `url` → `audioUrl`: el <audio> del PlayerContext lee `audioUrl`.
 * - `artist` viene anidado (`{ id, name }`) y la app lo usa como string suelto en
 *   las cards y el reproductor.
 * - `coverUrl`, `duration` y `releaseDate` tienen el mismo nombre, pero `duration`
 *   puede venir `null` y el reproductor lo usa como número.
 * - `genre` se arma con el primer nombre de `songGenres[].genre.name`. El backend
 *   anida la entidad en el include, así que hay nombre; si una canción no tuviera
 *   género queda en `null` y la card muestra la etiqueta vacía.
 * - `album` viene anidado (`{ id, name }`) y la app lo usa como string suelto, igual
 *   que `artist`: `PlayerBar` lo lee como `alt` de la carátula y la búsqueda ya
 *   filtra por nombre de álbum. El detalle de un álbum no lo incluye (allí la
 *   canción no necesita repetirlo), así que cae en `null`.
 * - `source` no existe en el esquema: es la línea "Reproduciéndose desde", que se
 *   oculta si no viene.
 */
export function toSong(raw) {
	if (!raw) return null;

	const genre =
		raw.songGenres?.find((entry) => entry.genre?.name)?.genre.name ?? null;

	return {
		id: raw.id,
		title: raw.title,
		artist: raw.artist?.name ?? null,
		album: raw.album?.name ?? null,
		genre,
		duration: raw.duration ?? 0,
		audioUrl: raw.url,
		coverUrl: raw.coverUrl ?? null,
		source: null,
	};
}

/**
 * Catálogo de canciones.
 *
 * El endpoint pagina por cursor, así que devuelve solo la primera tanda
 * (LIMIT 10 en el backend). Alcanza para la fila de novedades del Home y para la
 * cola inicial del reproductor.
 *
 * @returns {Promise<object[]>} Canciones mapeadas a la forma del frontend.
 */
export async function listSongs({ signal } = {}) {
	const data = await get(SONGS_PATH, { signal });

	return (data?.songs ?? []).map(toSong);
}

/**
 * Una canción por id.
 *
 * @param {number|string} id Id de la canción.
 * @param {AbortSignal} [signal]
 * @returns {Promise<object|null>} La canción mapeada, o `null` si no existe.
 * @throws {ApiError} 404 si el backend no la encuentra.
 */
export async function getSongById(id, { signal } = {}) {
	const data = await get(`${SONGS_PATH}/${id}`, { signal });

	return toSong(data);
}

/**
 * Busca canciones por título, artista, género o álbum, paginadas por número de página.
 *
 * El mismo endpoint sirve para los álbumes con `type=albums`; esa variante la
 * consume `albumsService`, que tiene su propio mapper.
 *
 * @param {string} query Texto a buscar. Vacío devuelve el catálogo paginado.
 * @param {number} [page] Página 1-based.
 * @param {number} [pageSize]
 * @param {AbortSignal} [signal]
 * @returns {Promise<{items: object[], total: number, page: number, pageSize: number, totalPages: number}>}
 */
export async function searchSongs(
	query,
	page = 1,
	pageSize = SEARCH_PAGE_SIZE,
	{ signal } = {},
) {
	const term = String(query ?? "").trim();

	const data = await get(`${SONGS_PATH}/search`, {
		params: { query: term, page, pageSize },
		signal,
	});

	return {
		items: (data?.items ?? []).map(toSong),
		total: data?.total ?? 0,
		page: data?.page ?? page,
		pageSize: data?.pageSize ?? pageSize,
		totalPages: data?.totalPages ?? 1,
	};
}

/**
 * Canciones para un estado de ánimo (TS-20, `GET /songs/recommendations`).
 *
 * El endpoint no pagina: devuelve hasta 20 canciones al azar del catálogo de ese
 * ánimo, o una lista vacía si no hay ninguna.
 *
 * @param {string} expression Uno de `MOODS`; el backend responde 400 con
 *   `INVALID_EXPRESSION` si no es un estado del catálogo.
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Promise<object[]>} Canciones ya mapeadas con `toSong`.
 */
export async function listSongsByMood(expression, { signal } = {}) {
	const data = await get(`${SONGS_PATH}/recommendations`, {
		params: { expression },
		signal,
	});

	return (data?.songs ?? []).map(toSong);
}
