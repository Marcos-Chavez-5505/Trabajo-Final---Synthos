const prisma = require("../prisma/prismaClient");
const crypto = require("node:crypto");

const SONG_INCLUDE = {
	songArtists: true,
	songGenres: true,
	songMoods: true,
};

const USER_PREVIEW = {
	id: true,
	username: true,
	pictureUrl: true,
};

const PLAYLIST_INCLUDE = {
	creator: { select: USER_PREVIEW },
	members: {
		include: {
			user: { select: USER_PREVIEW },
		},
	},
	songs: {
		orderBy: { position: "asc" },
		include: {
			song: { include: SONG_INCLUDE },
			user: { select: USER_PREVIEW },
		},
	},
};

async function createPlaylist(userId, { name, description, isPublic, type }) {
	const finalType = type === "colab" ? "colab" : "personal";

	return prisma.$transaction(async (tx) => {
		const playlist = await tx.playlist.create({
			data: {
				name,
				description: description ?? null,
				idCreator: userId,
				type: finalType,
				isPublic: isPublic ?? false,
			},
		});

		if (finalType === "colab") {
			await tx.playlistMember.create({
				data: {
					idPlaylist: playlist.id,
					idUser: userId,
					role: "creator",
				},
			});
		}

		return tx.playlist.findUnique({
			where: { id: playlist.id },
			include: PLAYLIST_INCLUDE,
		});
	});
}

async function getPlaylistById(id) {
	const playlist = await prisma.playlist.findUnique({
		where: { id },
		include: PLAYLIST_INCLUDE,
	});

	if (!playlist) return null;

	if (playlist.type === "favorites") {
		const favorites = await prisma.favorite.findMany({
			where: { idUser: playlist.idCreator },
			orderBy: { markedDate: "desc" },
			include: { song: { include: SONG_INCLUDE } },
		});

		playlist.songs = favorites.map((f) => ({
			idPlaylist: playlist.id,
			idSong: f.idSong,
			position: 0,
			addedDate: f.markedDate,
			addedBy: null,
			user: null,
			song: f.song,
		}));
	}

	return playlist;
}

async function getUserPlaylists(userId) {
	const playlists = await prisma.playlist.findMany({
		where: {
			OR: [
				{ idCreator: userId },
				{ members: { some: { idUser: userId } } },
			],
		},
		orderBy: { creationDate: "desc" },
		include: PLAYLIST_INCLUDE,
	});

	if (!playlists.some((p) => p.type === "favorites")) {
		return playlists;
	}

	const favorites = await prisma.favorite.findMany({
		where: { idUser: userId },
		orderBy: { markedDate: "desc" },
		include: { song: { include: SONG_INCLUDE } },
	});

	return playlists.map((playlist) => {
		if (playlist.type !== "favorites") return playlist;

		return {
			...playlist,
			songs: favorites.map((f) => ({
				idPlaylist: playlist.id,
				idSong: f.idSong,
				position: 0,
				addedDate: f.markedDate,
				addedBy: null,
				user: null,
				song: f.song,
			})),
		};
	});
}

async function songExists(songId) {
	const song = await prisma.song.findUnique({
		where: { id: songId },
		select: { id: true },
	});
	return Boolean(song);
}

async function addSongToPlaylist(playlistId, songId, userId) {
	const existing = await prisma.playlistSong.findUnique({
		where: {
			idPlaylist_idSong: { idPlaylist: playlistId, idSong: songId },
		},
	});

	if (existing) return { alreadyAdded: true };

	const maxRow = await prisma.playlistSong.aggregate({
		where: { idPlaylist: playlistId },
		_max: { position: true },
	});

	const nextPosition = (maxRow._max.position ?? 0) + 1;

	const created = await prisma.playlistSong.create({
		data: {
			idPlaylist: playlistId,
			idSong: songId,
			position: nextPosition,
			addedBy: userId,
		},
		include: {
			song: { include: SONG_INCLUDE },
			user: { select: USER_PREVIEW },
		},
	});

	return { created };
}

async function removeSongFromPlaylist(playlistId, songId) {
	const existing = await prisma.playlistSong.findUnique({
		where: {
			idPlaylist_idSong: { idPlaylist: playlistId, idSong: songId },
		},
	});

	if (!existing) return { notFound: true };

	await prisma.playlistSong.delete({
		where: {
			idPlaylist_idSong: { idPlaylist: playlistId, idSong: songId },
		},
	});

	return { removed: true };
}

async function updatePlaylist(id, { name, description, addSongs, removeSongs, reorder }) {
	return prisma.$transaction(async (tx) => {
		const data = {};
		if (name !== undefined) data.name = name;
		if (description !== undefined) data.description = description;

		if (Object.keys(data).length > 0) {
			await tx.playlist.update({
				where: { id },
				data,
			});
		}

		if (Array.isArray(removeSongs) && removeSongs.length > 0) {
			await tx.playlistSong.deleteMany({
				where: { idPlaylist: id, idSong: { in: removeSongs } },
			});
		}

		if (Array.isArray(addSongs) && addSongs.length > 0) {
			const existing = await tx.playlistSong.findMany({
				where: { idPlaylist: id },
				select: { idSong: true, position: true },
			});
			const existingIds = new Set(existing.map((r) => r.idSong));
			const maxPos = existing.reduce((m, r) => Math.max(m, r.position), 0);

			const toAdd = addSongs.filter((sid) => !existingIds.has(sid));
			if (toAdd.length > 0) {
				await tx.playlistSong.createMany({
					data: toAdd.map((sid, i) => ({
						idPlaylist: id,
						idSong: sid,
						position: maxPos + 1 + i,
					})),
					skipDuplicates: true,
				});
			}
		}

		if (Array.isArray(reorder) && reorder.length > 0) {
			for (let i = 0; i < reorder.length; i++) {
				await tx.playlistSong.updateMany({
					where: { idPlaylist: id, idSong: reorder[i] },
					data: { position: i + 1 },
				});
			}
		}

		return tx.playlist.findUnique({
			where: { id },
			include: PLAYLIST_INCLUDE,
		});
	});
}

async function deletePlaylist(id) {
	return prisma.playlist.delete({ where: { id } });
}

async function generateInvitationToken(playlistId) {
	const token = crypto.randomBytes(32).toString("hex");

	return prisma.playlist.update({
		where: { id: playlistId },
		data: { tokenInvitation: token },
		select: { id: true, name: true, tokenInvitation: true },
	});
}

async function getPlaylistByToken(token) {
	return prisma.playlist.findFirst({
		where: { tokenInvitation: token, type: "colab" },
		include: {
			creator: { select: USER_PREVIEW },
			members: {
				select: { idUser: true },
			},
		},
	});
}

async function addCollaborator(playlistId, userId) {
	const existing = await prisma.playlistMember.findUnique({
		where: {
			idPlaylist_idUser: { idPlaylist: playlistId, idUser: userId },
		},
	});

	if (existing) return { alreadyMember: true };

	await prisma.playlistMember.create({
		data: { idPlaylist: playlistId, idUser: userId, role: "colaborator" },
	});

	return { joined: true };
}

module.exports = {
	createPlaylist,
	getPlaylistById,
	getUserPlaylists,
	updatePlaylist,
	deletePlaylist,
	songExists,
	addSongToPlaylist,
	removeSongFromPlaylist,
	generateInvitationToken,
	getPlaylistByToken,
	addCollaborator,
};