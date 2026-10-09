const prisma = require("../prisma/prismaClient");

const LIMIT = 10;

const SONG_INCLUDE = {
	songGenres: { include: { genre: true } },
	songMoods: { include: { mood: true } },
	artist: true,
};

const VALID_EXPRESSIONS = ["neutral", "happy", "sad"];
const RECOMMENDATIONS_LIMIT = 20;

const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

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


async function getRecommendationsByExpression(expression) {
	if (!VALID_EXPRESSIONS.includes(expression)) {
		const err = new Error("Expresión inválida.");
		err.status = 400;
		throw err;
	}

	// IDs aleatorios de canciones que tengan ese mood
	const rows = await prisma.$queryRaw`
		SELECT s.id
		FROM song s
		JOIN song_mood sm ON sm.id_song = s.id
		JOIN mood m ON m.id = sm.id_mood
		WHERE m.name = ${expression}
		ORDER BY RANDOM()
		LIMIT ${RECOMMENDATIONS_LIMIT}
	`;

	const ids = rows.map((r) => r.id);
	if (ids.length === 0) return [];

	return prisma.song.findMany({
		where: { id: { in: ids } },
		include: SONG_INCLUDE,
	});
}


module.exports = { getSongs, getSongById, searchSongs, getRecommendationsByExpression };
