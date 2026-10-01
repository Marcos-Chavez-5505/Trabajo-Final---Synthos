const prisma = require("../prisma/prismaClient");

const LIMIT = 10;

const SONG_INCLUDE = {
	songGenres: true,
	songMoods: true,
	artist: true,
};

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

async function searchSongs(query, cursor = null) {
	const where = query
		? {
				OR: [
					{ title: { contains: query, mode: "insensitive" } },
					{ artist: { name: { contains: query, mode: "insensitive" } } },
					{
						songGenres: {
							some: {
								genre: { name: { contains: query, mode: "insensitive" } },
							},
						},
					},
				],
			}
		: {};

	const songs = await prisma.song.findMany({
		where,
		take: LIMIT + 1,
		...(cursor && {
			cursor: { id: cursor },
			skip: 1,
		}),
		include: SONG_INCLUDE,
		orderBy: { id: "asc" },
	});

	const hasMore = songs.length > LIMIT;
	const items = hasMore ? songs.slice(0, -1) : songs;
	const nextCursor = hasMore ? items[items.length - 1].id : null;

	return {
		items,
		nextCursor,
	};
}

module.exports = { getSongs, getSongById, searchSongs };
