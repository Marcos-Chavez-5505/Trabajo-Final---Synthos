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

const VALID_EXPRESSIONS = ["neutral", "happy", "sad", "angry"];
const RECOMMENDATIONS_LIMIT = 20;
const MIN_WEEKLY_FAVORITES = 3;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function currentWeekRange(now = new Date()) {
	const from = new Date(
		Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
	);
	const daysSinceMonday = (from.getUTCDay() + 6) % 7;

	from.setUTCDate(from.getUTCDate() - daysSinceMonday);

	return { from, to: new Date(from.getTime() + WEEK_MS) };
}

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

async function getWeeklyPopular() {
	const { from, to } = currentWeekRange();

	const rows = await prisma.$queryRaw`
		SELECT f.id_song AS "idSong", COUNT(DISTINCT f.id_user)::int AS "favoriteCount"
		FROM favorite f
		WHERE f.marked_date >= ${from} AND f.marked_date < ${to}
		GROUP BY f.id_song
		HAVING COUNT(DISTINCT f.id_user) >= ${MIN_WEEKLY_FAVORITES}
		ORDER BY "favoriteCount" DESC, f.id_song ASC
	`;

	const ids = rows.map((row) => row.idSong);

	if (ids.length === 0) {
		return {
			week: { from, to },
			minimumFavorites: MIN_WEEKLY_FAVORITES,
			songs: [],
		};
	}

	const songs = await prisma.song.findMany({
		where: { id: { in: ids } },
		include: SONG_INCLUDE,
	});
	const byId = new Map(songs.map((song) => [song.id, song]));

	return {
		week: { from, to },
		minimumFavorites: MIN_WEEKLY_FAVORITES,
		songs: rows.flatMap((row) => {
			const song = byId.get(row.idSong);

			return song ? [{ ...song, favoriteCount: row.favoriteCount }] : [];
		}),
	};
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
	getWeeklyPopular,
	searchSongs,
	getRecommendationsByExpression,
};
