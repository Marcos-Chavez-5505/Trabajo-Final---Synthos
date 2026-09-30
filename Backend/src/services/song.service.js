const prisma = require("../prisma/prismaClient");

const SONG_INCLUDE = {
	songArtists: true,
	songGenres: true,
	songMoods: true,
};

async function getSongs(cursor = null) {
	const LIMIT = 10;

	const songs = await prisma.song.findMany({
		take: LIMIT,
		skip: cursor ? 1 : 0,
		cursor: cursor ? { id: cursor } : undefined,
		include: SONG_INCLUDE,
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

module.exports = { getSongs, getSongById };
