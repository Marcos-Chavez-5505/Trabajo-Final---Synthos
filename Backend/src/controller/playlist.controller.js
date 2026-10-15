const playlistService = require("../services/playlist.service");
const { httpError } = require("../utils/errors");

function isFavoritesPlaylist(playlist) {
	return playlist.type === "favorites";
}

function parseId(raw) {
	const id = Number(raw);
	return Number.isInteger(id) && id > 0 ? id : null;
}

function requireId(raw) {
	const id = parseId(raw);
	if (!id) {
		throw httpError(400, "Id inválido.", "INVALID_ID");
	}
	return id;
}

async function createPlaylist(req, res, next) {
	try {
		const userId = req.user.sub;
		const { name, description, isPublic, type } = req.body || {};

		if (typeof name !== "string" || name.trim().length === 0) {
			throw httpError(
				400,
				"El nombre es obligatorio.",
				"PLAYLIST_NAME_REQUIRED",
			);
		}

		if (name.trim().length > 50) {
			throw httpError(
				400,
				"El nombre no puede superar los 50 caracteres.",
				"PLAYLIST_NAME_TOO_LONG",
			);
		}

		if (type !== "personal" && type !== "colab") {
			throw httpError(
				400,
				"El tipo debe ser 'personal' o 'colab'.",
				"PLAYLIST_TYPE_INVALID",
			);
		}

		const playlist = await playlistService.createPlaylist(userId, {
			name: name.trim(),
			description,
			isPublic,
			type,
		});

		return res.status(201).json({ status: "success", playlist });
	} catch (error) {
		next(error);
	}
}

async function getPlaylistById(req, res, next) {
	try {
		const id = requireId(req.params.id);

		const playlist = await playlistService.getPlaylistById(id);
		if (!playlist) {
			throw httpError(
				404,
				"La playlist no existe.",
				"PLAYLIST_NOT_FOUND",
			);
		}

		return res.status(200).json({ status: "success", playlist });
	} catch (error) {
		next(error);
	}
}

async function getUserPlaylists(req, res, next) {
	try {
		const userId = req.user.sub;
		const playlists = await playlistService.getUserPlaylists(userId);

		return res.status(200).json({ status: "success", playlists });
	} catch (error) {
		next(error);
	}
}

async function updatePlaylist(req, res, next) {
	try {
		const userId = req.user.sub;
		const id = requireId(req.params.id);

		const existing = await playlistService.getPlaylistById(id);
		if (!existing) {
			throw httpError(
				404,
				"La playlist no existe.",
				"PLAYLIST_NOT_FOUND",
			);
		}

		if (existing.idCreator !== userId) {
			throw httpError(
				403,
				"No sos el dueño de esta playlist.",
				"NOT_PLAYLIST_OWNER",
			);
		}

		if (isFavoritesPlaylist(existing)) {
			throw httpError(
				403,
				"La playlist de favoritos no se puede editar.",
				"FAVORITES_LOCKED",
			);
		}

		const { name, description, addSongs, removeSongs, reorder } = req.body || {};

		if (name !== undefined) {
			if (typeof name !== "string" || name.trim().length === 0) {
				throw httpError(
					400,
					"El nombre es obligatorio.",
					"PLAYLIST_NAME_REQUIRED",
				);
			}
			if (name.trim().length > 50) {
				throw httpError(
					400,
					"El nombre no puede superar los 50 caracteres.",
					"PLAYLIST_NAME_TOO_LONG",
				);
			}
		}

		const playlist = await playlistService.updatePlaylist(id, {
			name: name === undefined ? undefined : name.trim(),
			description,
			addSongs,
			removeSongs,
			reorder,
		});

		return res.status(200).json({ status: "success", playlist });
	} catch (error) {
		next(error);
	}
}

async function deletePlaylist(req, res, next) {
	try {
		const userId = req.user.sub;
		const id = requireId(req.params.id);

		const existing = await playlistService.getPlaylistById(id);
		if (!existing) {
			throw httpError(
				404,
				"La playlist no existe.",
				"PLAYLIST_NOT_FOUND",
			);
		}

		if (existing.idCreator !== userId) {
			throw httpError(
				403,
				"No sos el dueño de esta playlist.",
				"NOT_PLAYLIST_OWNER",
			);
		}

		if (isFavoritesPlaylist(existing)) {
			throw httpError(
				403,
				"La playlist de favoritos no se puede eliminar.",
				"FAVORITES_LOCKED",
			);
		}

		await playlistService.deletePlaylist(id);

		return res.status(200).json({
			status: "success",
			message: "Playlist eliminada.",
		});
	} catch (error) {
		next(error);
	}
}

async function addSong(req, res, next) {
	try {
		const userId = req.user.sub;
		const id = requireId(req.params.id);
		const songId = Number(req.body?.songId);

		if (!Number.isInteger(songId) || songId <= 0) {
			throw httpError(
				400,
				"El songId es obligatorio.",
				"SONG_ID_REQUIRED",
			);
		}

		const playlist = await playlistService.getPlaylistById(id);
		if (!playlist) {
			throw httpError(
				404,
				"La playlist no existe.",
				"PLAYLIST_NOT_FOUND",
			);
		}

		if (isFavoritesPlaylist(playlist)) {
			throw httpError(
				400,
				"La playlist de favoritos se gestiona desde /api/favorites.",
				"FAVORITES_MANAGED_ELSEWHERE",
			);
		}

		if (playlist.type === "personal") {
			if (playlist.idCreator !== userId) {
				throw httpError(
					403,
					"No sos el dueño de esta playlist.",
					"NOT_PLAYLIST_OWNER",
				);
			}
		} else {
			const isMember = playlist.members.some((m) => m.idUser === userId);
			if (!isMember) {
				throw httpError(
					403,
					"No sos participante de esta playlist.",
					"NOT_PLAYLIST_MEMBER",
				);
			}
		}

		const exists = await playlistService.songExists(songId);
		if (!exists) {
			throw httpError(404, "La canción no existe.", "SONG_NOT_FOUND");
		}

		const result = await playlistService.addSongToPlaylist(id, songId, userId);

		if (result.alreadyAdded) {
			throw httpError(
				409,
				"La canción ya estaba en la playlist.",
				"SONG_ALREADY_IN_PLAYLIST",
			);
		}

		return res.status(201).json({
			status: "success",
			song: result.created,
		});
	} catch (error) {
		next(error);
	}
}

async function removeSong(req, res, next) {
	try {
		const userId = req.user.sub;
		const id = requireId(req.params.id);
		const songId = parseId(req.params.songId);

		if (!songId) {
			throw httpError(400, "Id inválido.", "INVALID_ID");
		}

		const playlist = await playlistService.getPlaylistById(id);
		if (!playlist) {
			throw httpError(
				404,
				"La playlist no existe.",
				"PLAYLIST_NOT_FOUND",
			);
		}

		if (isFavoritesPlaylist(playlist)) {
			throw httpError(
				400,
				"La playlist de favoritos se gestiona desde /api/favorites.",
				"FAVORITES_MANAGED_ELSEWHERE",
			);
		}

		if (playlist.idCreator !== userId) {
			throw httpError(
				403,
				"Solo el creador puede eliminar canciones.",
				"NOT_PLAYLIST_CREATOR",
			);
		}

		const result = await playlistService.removeSongFromPlaylist(id, songId);

		if (result.notFound) {
			throw httpError(
				404,
				"La canción no estaba en la playlist.",
				"SONG_NOT_IN_PLAYLIST",
			);
		}

		return res.status(200).json({
			status: "success",
			message: "Canción eliminada de la playlist.",
		});
	} catch (error) {
		next(error);
	}
}

async function generateInvitation(req, res, next) {
	try {
		const userId = req.user.sub;
		const id = requireId(req.params.id);

		const playlist = await playlistService.getPlaylistById(id);
		if (!playlist) {
			throw httpError(
				404,
				"La playlist no existe.",
				"PLAYLIST_NOT_FOUND",
			);
		}

		if (playlist.idCreator !== userId) {
			throw httpError(
				403,
				"No sos el creador de esta playlist.",
				"NOT_PLAYLIST_CREATOR",
			);
		}

		if (playlist.type !== "colab") {
			throw httpError(
				400,
				"Solo las playlists colaborativas permiten invitaciones.",
				"INVITATION_REQUIRES_COLLAB",
			);
		}

		const updated = await playlistService.generateInvitationToken(id);
		const link = `${process.env.FRONTEND_URL}/join/${updated.tokenInvitation}`;

		return res.status(201).json({
			status: "success",
			token: updated.tokenInvitation,
			link,
		});
	} catch (error) {
		next(error);
	}
}

async function previewInvitation(req, res, next) {
	try {
		const userId = req.user.sub;
		const { token } = req.params;

		const playlist = await playlistService.getPlaylistByToken(token);
		if (!playlist) {
			throw httpError(404, "Invitación inválida.", "INVALID_INVITATION");
		}

		const isMember = playlist.members.some((m) => m.idUser === userId);

		return res.status(200).json({
			status: "success",
			playlist: {
				id: playlist.id,
				name: playlist.name,
				description: playlist.description,
				creator: playlist.creator,
			},
			isMember,
		});
	} catch (error) {
		next(error);
	}
}

async function joinPlaylist(req, res, next) {
	try {
		const userId = req.user.sub;
		const { token } = req.params;

		const playlist = await playlistService.getPlaylistByToken(token);
		if (!playlist) {
			throw httpError(404, "Invitación inválida.", "INVALID_INVITATION");
		}

		const result = await playlistService.addCollaborator(playlist.id, userId);

		if (result.alreadyMember) {
			const updated = await playlistService.getPlaylistById(playlist.id);
			return res.status(200).json({
				status: "success",
				message: "Ya eras participante de esta playlist.",
				playlist: updated,
			});
		}

		const updated = await playlistService.getPlaylistById(playlist.id);
		return res.status(201).json({
			status: "success",
			playlist: updated,
		});
	} catch (error) {
		next(error);
	}
}

module.exports = {
	createPlaylist,
	getPlaylistById,
	getUserPlaylists,
	updatePlaylist,
	deletePlaylist,
	addSong,
	removeSong,
	generateInvitation,
	previewInvitation,
	joinPlaylist,
};