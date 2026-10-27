const prisma = require("../prisma/prismaClient");
const { parseSongIds, mergeOrder } = require("../utils/reorder");

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

	const minRow = await prisma.favorite.aggregate({
		where: { idUser: userId },
		_min: { position: true },
	});
	const hasAny = minRow._min.position !== null;
	const nextPosition = hasAny ? minRow._min.position - 1 : 0;

	const favorite = await prisma.favorite.create({
		data: { idUser: userId, idSong: songId, position: nextPosition },
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


	const favorites = await prisma.favorite.findMany({
		where: { idUser: userId },
		orderBy: [{ position: "asc" }, { idSong: "asc" }],
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
		orderBy: [{ position: "asc" }, { idSong: "asc" }],
		select: { idSong: true },
	});

	return rows.map((r) => r.idSong);
}

async function updateFavoritesOrder(userId, incomingIds) {
	const validated = parseSongIds(incomingIds);
	if (validated === null) {
		const err = new Error("Los ids de canciones son inválidos.");
		err.code = "INVALID_SONG_IDS";
		err.httpStatus = 400;
		throw err;
	}

	return prisma.$transaction(async (tx) => {
		const rows = await tx.$queryRaw`
			SELECT id_song FROM favorite
			WHERE id_user = ${userId}
			ORDER BY position ASC, id_song ASC
			FOR UPDATE
		`;

		const current = rows.map((r) => r.id_song);
		const { order, merged } = mergeOrder({
			mode: "favorites",
			current,
			incoming: validated,
		});

		if (order.length > 0) {
			const positions = order.map((_, i) => i);
			await tx.$executeRaw`
				UPDATE favorite AS f
				SET position = v.position
				FROM unnest(${order}::int[], ${positions}::int[]) AS v(id_song, position)
				WHERE f.id_user = ${userId} AND f.id_song = v.id_song
			`;
		}

		const reRead = await tx.favorite.findMany({
			where: { idUser: userId },
			orderBy: [{ position: "asc" }, { idSong: "asc" }],
			select: { idSong: true },
		});

		return { songIds: reRead.map((r) => r.idSong), merged };
	});
}

module.exports = {
	addFavorite,
	removeFavorite,
	getFavorites,
	getFavoriteSongIds,
	updateFavoritesOrder,
};
