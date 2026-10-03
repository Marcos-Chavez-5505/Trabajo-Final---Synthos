const prisma = require("../prisma/prismaClient");

const SONG_INCLUDE = {
	songArtists: true,
	songGenres: true,
	songMoods: true,
};

const PLAYLIST_INCLUDE = {
	creator: {
		select: { id: true, username: true, pictureUrl: true },
	},
	songs: {
		orderBy: { position: "asc" },
		include: {
			song: { include: SONG_INCLUDE },
		},
	},
};

async function createPlaylist(userId, { name, description, isPublic }) {
	return prisma.playlist.create({
		data: {
			name,
			description: description ?? null,
			idCreator: userId,
			type: "personal",
			isPublic: isPublic ?? false,
		},
		include: PLAYLIST_INCLUDE,
	});
}

async function getPlaylistById(id) {
	return prisma.playlist.findUnique({
		where: { id },
		include: PLAYLIST_INCLUDE,
	});
}

async function getUserPlaylists(userId) {
	return prisma.playlist.findMany({
		where: { idCreator: userId },
		orderBy: { creationDate: "desc" },
		include: PLAYLIST_INCLUDE,
	});
}

async function updatePlaylist(id, { name, addSongs, removeSongs, reorder }) {
	return prisma.$transaction(async (tx) => {
		if (name !== undefined) {
			await tx.playlist.update({
				where: { id },
				data: { name },
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

module.exports = {
	createPlaylist,
	getPlaylistById,
	getUserPlaylists,
	updatePlaylist,
	deletePlaylist,
};