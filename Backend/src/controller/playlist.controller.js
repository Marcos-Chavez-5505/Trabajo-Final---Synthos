const playlistService = require("../services/playlist.service");

function isFavoritesPlaylist(playlist) {
	return playlist.type === "favorites";
}

async function createPlaylist(req, res, next) {
	try {
		const userId = req.user.sub;
		const { name, description, isPublic } = req.body || {};

		if (typeof name !== "string" || name.trim().length === 0) {
			return res.status(400).json({
				status: "error",
				message: "El nombre es obligatorio.",
			});
		}

		const playlist = await playlistService.createPlaylist(userId, {
			name: name.trim(),
			description,
			isPublic,
		});

		return res.status(201).json({ status: "success", playlist });
	} catch (error) {
		next(error);
	}
}

async function getPlaylistById(req, res, next) {
	try {
		const id = Number(req.params.id);
		if (!Number.isInteger(id) || id <= 0) {
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
		const id = Number(req.params.id);

		if (!Number.isInteger(id) || id <= 0) {
			return res.status(400).json({
				status: "error",
				message: "Id inválido.",
			});
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

		const { name, addSongs, removeSongs, reorder } = req.body || {};

		const playlist = await playlistService.updatePlaylist(id, {
			name,
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
		const id = Number(req.params.id);

		if (!Number.isInteger(id) || id <= 0) {
			return res.status(400).json({
				status: "error",
				message: "Id inválido.",
			});
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

module.exports = {
	createPlaylist,
	getPlaylistById,
	getUserPlaylists,
	updatePlaylist,
	deletePlaylist,
};