const prisma = require("../prisma/prismaClient");

const FAVORITES_PLAYLIST_NAME = "Favoritos";

const SONG_INCLUDE = {
	songArtists: true,
	songGenres: true,
	songMoods: true,
};

async function ensureFavoritesPlaylist(userId) {
	const existing = await prisma.playlist.findFirst({
		where: { idCreator: userId, type: "favorites" },
		select: { id: true, name: true, idCreator: true },
	});

	if (existing) return existing;

	return prisma.playlist.create({
		data: {
			name: FAVORITES_PLAYLIST_NAME,
			idCreator: userId,
			type: "favorites",
			isPublic: false,
		},
		select: { id: true, name: true, idCreator: true },
	});
}

async function addFavorite(userId, songId) {
	const song = await prisma.song.findUnique({ where: { id: songId } });
	if (!song) return { notFound: true };

	const already = await prisma.favorite.findUnique({
		where: { idUser_idSong: { idUser: userId, idSong: songId } },
	});
	if (already) return { conflict: true };

	const favorite = await prisma.favorite.create({
		data: { idUser: userId, idSong: songId },
		include: { song: { include: SONG_INCLUDE } },
	});

	await ensureFavoritesPlaylist(userId);

	return { favorite };
}

async function removeFavorite(userId, songId) {
	const existing = await prisma.favorite.findUnique({
		where: { idUser_idSong: { idUser: userId, idSong: songId } },
	});
	if (!existing) return { notFound: true };

	await prisma.favorite.delete({
		where: { idUser_idSong: { idUser: userId, idSong: songId } },
	});

	return { removed: true };
}

async function getFavorites(userId) {
	const playlist = await prisma.playlist.findFirst({
		where: { idCreator: userId, type: "favorites" },
		select: { id: true, name: true },
	});

	//! PRUEBEN SI FUNCIONA ESTO
	// const playlist = await ensureFavoritesPlaylist(userId);

	const favorites = await prisma.favorite.findMany({
		where: { idUser: userId },
		orderBy: { markedDate: "desc" },
		include: { song: { include: SONG_INCLUDE } },
	});

	const songs = favorites.map((f) => ({
		...f.song,
		markedDate: f.markedDate,
	}));

	return { playlist, songs };
}

async function getFavoriteSongIds(userId) {
	const rows = await prisma.favorite.findMany({
		where: { idUser: userId },
		select: { idSong: true },
	});

	return rows.map((r) => r.idSong);
}

module.exports = {
	addFavorite,
	removeFavorite,
	getFavorites,
	getFavoriteSongIds,
};
