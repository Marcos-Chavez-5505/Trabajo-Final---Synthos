const playlistService = require("../services/playlist.service");

function isFavoritesPlaylist(playlist) {
	return playlist.type === "favorites";
}

function parseId(raw) {
	const id = Number(raw);
	return Number.isInteger(id) && id > 0 ? id : null;
}

async function createPlaylist(req, res, next) {
	try {
		const userId = req.user.sub;
		const { name, description, isPublic, type } = req.body || {};

		if (typeof name !== "string" || name.trim().length === 0) {
			return res.status(400).json({
				status: "error",
				message: "El nombre es obligatorio.",
			});
		}

		if (name.trim().length > 50) {
			return res.status(400).json({
				status: "error",
				message: "El nombre no puede superar los 50 caracteres.",
			});
		}

		if (type !== "personal" && type !== "colab") {
			return res.status(400).json({
				status: "error",
				message: "El tipo debe ser 'personal' o 'colab'.",
			});
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
		const id = parseId(req.params.id);
		if (!id) {
			return res.status(400).json({
				status: "error",
				message: "Id inválido.",
			});
		}

		const playlist = await playlistService.getPlaylistById(id);
		if (!playlist) {
			return res.status(404).json({
				status: "error",
				message: "La playlist no existe.",
			});
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
		const id = parseId(req.params.id);

		if (!id) {
			return res.status(400).json({ status: "error", message: "Id inválido." });
		}

		const existing = await playlistService.getPlaylistById(id);
		if (!existing) {
			return res.status(404).json({
				status: "error",
				message: "La playlist no existe.",
			});
		}

		if (existing.idCreator !== userId) {
			return res.status(403).json({
				status: "error",
				message: "No sos el dueño de esta playlist.",
			});
		}

		if (isFavoritesPlaylist(existing)) {
			return res.status(403).json({
				status: "error",
				message: "La playlist de favoritos no se puede editar.",
			});
		}

		const { name, description, addSongs, removeSongs, reorder } = req.body || {};

		if (name !== undefined) {
			if (typeof name !== "string" || name.trim().length === 0) {
				return res.status(400).json({
					status: "error",
					message: "El nombre es obligatorio.",
				});
			}
			if (name.trim().length > 50) {
				return res.status(400).json({
					status: "error",
					message: "El nombre no puede superar los 50 caracteres.",
				});
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
		const id = parseId(req.params.id);

		if (!id) {
			return res.status(400).json({ status: "error", message: "Id inválido." });
		}

		const existing = await playlistService.getPlaylistById(id);
		if (!existing) {
			return res.status(404).json({
				status: "error",
				message: "La playlist no existe.",
			});
		}

		if (existing.idCreator !== userId) {
			return res.status(403).json({
				status: "error",
				message: "No sos el dueño de esta playlist.",
			});
		}

		if (isFavoritesPlaylist(existing)) {
			return res.status(403).json({
				status: "error",
				message: "La playlist de favoritos no se puede eliminar.",
			});
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
		const id = parseId(req.params.id);
		const songId = Number(req.body?.songId);

		if (!id) {
			return res.status(400).json({ status: "error", message: "Id inválido." });
		}

		if (!Number.isInteger(songId) || songId <= 0) {
			return res.status(400).json({
				status: "error",
				message: "El songId es obligatorio.",
			});
		}

		const playlist = await playlistService.getPlaylistById(id);
		if (!playlist) {
			return res.status(404).json({
				status: "error",
				message: "La playlist no existe.",
			});
		}

		if (isFavoritesPlaylist(playlist)) {
			return res.status(400).json({
				status: "error",
				message: "La playlist de favoritos se gestiona desde /api/favorites.",
			});
		}

		if (playlist.type === "personal") {
			if (playlist.idCreator !== userId) {
				return res.status(403).json({
					status: "error",
					message: "No sos el dueño de esta playlist.",
				});
			}
		} else {
			const isMember = playlist.members.some((m) => m.idUser === userId);
			if (!isMember) {
				return res.status(403).json({
					status: "error",
					message: "No sos participante de esta playlist.",
				});
			}
		}

		const exists = await playlistService.songExists(songId);
		if (!exists) {
			return res.status(404).json({
				status: "error",
				message: "La canción no existe.",
			});
		}

		const result = await playlistService.addSongToPlaylist(id, songId, userId);

		if (result.alreadyAdded) {
			return res.status(409).json({
				status: "error",
				message: "La canción ya estaba en la playlist.",
			});
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
		const id = parseId(req.params.id);
		const songId = parseId(req.params.songId);

		if (!id || !songId) {
			return res.status(400).json({ status: "error", message: "Id inválido." });
		}

		const playlist = await playlistService.getPlaylistById(id);
		if (!playlist) {
			return res.status(404).json({
				status: "error",
				message: "La playlist no existe.",
			});
		}

		if (isFavoritesPlaylist(playlist)) {
			return res.status(400).json({
				status: "error",
				message: "La playlist de favoritos se gestiona desde /api/favorites.",
			});
		}

		if (playlist.idCreator !== userId) {
			return res.status(403).json({
				status: "error",
				message: "Solo el creador puede eliminar canciones.",
			});
		}

		const result = await playlistService.removeSongFromPlaylist(id, songId);

		if (result.notFound) {
			return res.status(404).json({
				status: "error",
				message: "La canción no estaba en la playlist.",
			});
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
		const id = parseId(req.params.id);

		if (!id) {
			return res.status(400).json({ status: "error", message: "Id inválido." });
		}

		const playlist = await playlistService.getPlaylistById(id);
		if (!playlist) {
			return res.status(404).json({
				status: "error",
				message: "La playlist no existe.",
			});
		}

		if (playlist.idCreator !== userId) {
			return res.status(403).json({
				status: "error",
				message: "No sos el creador de esta playlist.",
			});
		}

		if (playlist.type !== "colab") {
			return res.status(400).json({
				status: "error",
				message: "Solo las playlists colaborativas permiten invitaciones.",
			});
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
			return res.status(404).json({
				status: "error",
				message: "Invitación inválida.",
			});
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
			return res.status(404).json({
				status: "error",
				message: "Invitación inválida.",
			});
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