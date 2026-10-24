const playlistService = require("../services/playlist.service");
const notificationService = require("../services/notification.service");
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

		const isMember = playlist.members.some((m) => m.idUser === userId);

		if (playlist.idCreator !== userId && !isMember && !playlist.isPublic) {
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

async function createInvitation(req, res, next) {
	try {
		const userId = req.user.sub;
		const id = requireId(req.params.id);
		const receiverId = parseId(req.body?.userId);

		if (!receiverId) {
			throw httpError(400, "Elegí a quién invitar.", "INVITATION_RECEIVER_REQUIRED");
		}

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

		if (playlist.type === "favorites") {
			throw httpError(
				400,
				"No podés invitar a la playlist de favoritos.",
				"INVITATION_FAVORITES_LOCKED",
			);
		}

		if (receiverId === userId) {
			throw httpError(
				400,
				"No podés invitarte a vos mismo.",
				"INVITATION_SELF",
			);
		}

		const receiver = await playlistService.findUserById(receiverId);
		if (!receiver) {
			throw httpError(
				404,
				"No encontramos a esa persona.",
				"INVITATION_USER_NOT_FOUND",
			);
		}

		const invitation = await playlistService.createInvitation(id, userId, receiverId);

		if (invitation.alreadyMember) {
			throw httpError(
				409,
				"Esa persona ya participa de la playlist.",
				"PLAYLIST_ALREADY_MEMBER",
			);
		}

		if (invitation.shouldNotify) {
			await notificationService.notifyUser(req.app.get("io"), {
				idUser: receiverId,
				idActor: userId,
				type: "playlist_invitation",
				idPlaylist: id,
			});
		}

		return res.status(201).json({
			status: "success",
			invitation: invitation.invitation,
			// `true` cuando la invitación convirtió una playlist personal en
			// colaborativa, para que el frontend la recargue.
			converted: invitation.converted,
		});
	} catch (error) {
		next(error);
	}
}

async function listPlaylistInvitations(req, res, next) {
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

		const invitations = await playlistService.listInvitationsByPlaylist(id);

		return res.status(200).json({ status: "success", invitations });
	} catch (error) {
		next(error);
	}
}

async function listReceivedInvitations(req, res, next) {
	try {
		const userId = req.user.sub;

		const invitations = await playlistService.listPendingInvitations(userId);

		return res.status(200).json({ status: "success", invitations });
	} catch (error) {
		next(error);
	}
}

async function acceptInvitation(req, res, next) {
	try {
		const userId = req.user.sub;
		const id = requireId(req.params.idPlaylist);

		const invitation = await playlistService.acceptInvitation(id, userId);
		if (!invitation) {
			throw httpError(
				404,
				"No tenés una invitación pendiente para esa playlist.",
				"INVITATION_NOT_FOUND",
			);
		}

		return res.status(201).json({ status: "success", invitation });
	} catch (error) {
		next(error);
	}
}

async function rejectInvitation(req, res, next) {
	try {
		const userId = req.user.sub;
		const id = requireId(req.params.idPlaylist);

		const invitation = await playlistService.rejectInvitation(id, userId);
		if (!invitation) {
			throw httpError(
				404,
				"No tenés una invitación pendiente para esa playlist.",
				"INVITATION_NOT_FOUND",
			);
		}

		return res.status(200).json({ status: "success", invitation });
	} catch (error) {
		next(error);
	}
}

async function removeMember(req, res, next) {
	try {
		const userId = req.user.sub;
		const id = requireId(req.params.id);
		const memberId = parseId(req.params.userId);

		if (!memberId) {
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

		if (playlist.idCreator !== userId) {
			throw httpError(
				403,
				"Solo el creador puede echar a alguien.",
				"NOT_PLAYLIST_CREATOR",
			);
		}

		if (memberId === userId) {
			throw httpError(
				400,
				"No podés echarte de tu propia playlist.",
				"CANNOT_REMOVE_CREATOR",
			);
		}

		const result = await playlistService.removeMember(id, memberId);
		if (!result.removed) {
			throw httpError(
				404,
				"Esa persona no participa de la playlist.",
				"PLAYLIST_MEMBER_NOT_FOUND",
			);
		}

		return res.status(200).json({ status: "success" });
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
	createInvitation,
	listPlaylistInvitations,
	listReceivedInvitations,
	acceptInvitation,
	rejectInvitation,
	removeMember,
};