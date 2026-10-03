const prisma = require("../prisma/prismaClient");

const LIMIT = 10;

// Los joins (songGenres/songMoods) vienen anidados con su entidad para que el
// payload traiga el nombre, no solo el id. Antes devolvian { idSong, idGenre } y el
// frontend no podia mostrar el genero en las cards.
const SONG_INCLUDE = {
	songGenres: { include: { genre: true } },
	songMoods: { include: { mood: true } },
	artist: true,
};

// Paginacion por offset: la pantalla /buscar dibuja numeros de pagina y permite
// saltar a cualquiera, asi que no alcanza con un cursor.
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

/**
 * Acota page/pageSize a valores utilizables.
 *
 * Devuelve strings corregidos para que el service no tenga que volver a
 * castearlos: page queda >= 1 y pageSize dentro de [1, MAX_PAGE_SIZE].
 */
function parsePagination({ page, pageSize }) {
	const parsedPage = Number.parseInt(page, 10);
	const parsedPageSize = Number.parseInt(pageSize, 10);

	return {
		page: Number.isInteger(parsedPage) && parsedPage >= 1 ? parsedPage : DEFAULT_PAGE,
		pageSize:
			Number.isInteger(parsedPageSize) && parsedPageSize >= 1
				? Math.min(parsedPageSize, MAX_PAGE_SIZE)
				: DEFAULT_PAGE_SIZE,
	};
}

/**
 * Busca canciones por titulo, artista o genero, paginadas por numero de pagina.
 *
 * Devuelve { items, total, page, pageSize, totalPages }. El `total` es el de todas
 * las coincidencias (no el de la pagina) y es lo que permite al frontend dibujar
 * la fila de numeros; por eso va con un count aparte.
 *
 * Si la pagina pedida queda fuera de rango se sirve la ultima con contenido y se
 * devuelve `page` ya corregido, para que el frontend no muestre un "sin
 * resultados" enganoso.
 */
async function searchSongs(query, pagination = {}) {
	const { page: rawPage, pageSize: rawPageSize } = pagination;
	const { page: requestedPage, pageSize } = parsePagination({
		page: rawPage,
		pageSize: rawPageSize,
	});

	const term = typeof query === "string" ? query.trim() : "";

	const where = term
		? {
				OR: [
					{ title: { contains: term, mode: "insensitive" } },
					{ artist: { name: { contains: term, mode: "insensitive" } } },
					{
						songGenres: {
							some: {
								genre: { name: { contains: term, mode: "insensitive" } },
							},
						},
					},
				],
			}
		: {};

	// El count va primero en la transaccion para que el destructuring siga el orden
	// de las promises: [total, items].
	const [total, items] = await prisma.$transaction([
		prisma.song.count({ where }),
		prisma.song.findMany({
			where,
			skip: (requestedPage - 1) * pageSize,
			take: pageSize,
			include: SONG_INCLUDE,
			orderBy: { id: "asc" },
		}),
	]);

	const totalPages = Math.max(1, Math.ceil(total / pageSize));
	const page = Math.min(requestedPage, totalPages);

	// Con el clamp la pagina corregida puede necesitar otra consulta: el skip se
	// calculo con la pagina pedida.
	const finalItems =
		page === requestedPage
			? items
			: await prisma.song.findMany({
					where,
					skip: (page - 1) * pageSize,
					take: pageSize,
					include: SONG_INCLUDE,
					orderBy: { id: "asc" },
				});

	return { items: finalItems, total, page, pageSize, totalPages };
}

async function getSongs(cursor = null) {
	const songs = await prisma.song.findMany({
		take: LIMIT,
		skip: cursor ? 1 : 0,
		cursor: cursor ? { id: cursor } : undefined,
		include: SONG_INCLUDE,
		orderBy: { id: "asc" },
	});

	const nextCursor = songs.length > 0 ? songs[songs.length - 1].id : null;
	const hasMore = songs.length === LIMIT;

	return { songs, nextCursor, hasMore };
}

async function getSongById(songId) {
	const song = await prisma.song.findUniqueOrThrow({
		where: { id: songId },
		include: SONG_INCLUDE,
	});

	return song;
}

module.exports = { getSongs, getSongById, searchSongs };
