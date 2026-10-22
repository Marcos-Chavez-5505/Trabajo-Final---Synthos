const prisma = require("../prisma/prismaClient");
const { httpError } = require("../utils/errors");
const { paginatedSearch } = require("../utils/pagination");

const LIMIT = 10;

const SONG_INCLUDE = {
	songGenres: { include: { genre: true } },
	songMoods: { include: { mood: true } },
	artist: true,
	album: { select: { id: true, name: true } },
	lyrics: true,
};

const VALID_EXPRESSIONS = ["neutral", "happy", "sad"];
const RECOMMENDATIONS_LIMIT = 20;

async function searchSongs(query, pagination = {}) {
	const term = typeof query === "string" ? query.trim() : "";

	const where = term
		? {
				OR: [
					{ title: { contains: term, mode: "insensitive" } },
					{ artist: { name: { contains: term, mode: "insensitive" } } },
					{ album: { name: { contains: term, mode: "insensitive" } } },
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

	return paginatedSearch({
		delegate: prisma.song,
		where,
		include: SONG_INCLUDE,
		pagination,
	});
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
		throw httpError(
			400,
			`"${expression}" no es un estado de ánimo válido.`,
			"INVALID_EXPRESSION",
			{ allowed: VALID_EXPRESSIONS },
		);
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

module.exports = {
	getSongs,
	getSongById,
	searchSongs,
	getRecommendationsByExpression,
};
