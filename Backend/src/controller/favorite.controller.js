const favoriteService = require("../services/favorite.service");

async function addFavorite(req, res, next) {
	try {
		const userId = req.user.sub;
		const songId = Number(req.body?.songId ?? req.body?.idSong);

		if (!Number.isInteger(songId) || songId <= 0) {
			return res.status(400).json({
				status: "error",
				message: "El id de la canción es inválido.",
			});
		}

		const result = await favoriteService.addFavorite(userId, songId);

		if (result.notFound) {
			return res.status(404).json({
				status: "error",
				message: "La canción no existe.",
			});
		}

		if (result.conflict) {
			return res.status(409).json({
				status: "error",
				message: "La canción ya está en favoritos.",
			});
		}

		return res.status(201).json({
			status: "success",
			favorite: {
				song: result.favorite.song,
				markedDate: result.favorite.markedDate,
			},
		});
	} catch (error) {
		next(error);
	}
}

async function removeFavorite(req, res, next) {
	try {
		const userId = req.user.sub;
		const songId = Number(req.params.songId);

		if (!Number.isInteger(songId) || songId <= 0) {
			return res.status(400).json({
				status: "error",
				message: "El id de la canción es inválido.",
			});
		}

		const result = await favoriteService.removeFavorite(userId, songId);

		if (result.notFound) {
			return res.status(404).json({
				status: "error",
				message: "Esa canción no estaba en favoritos.",
			});
		}

		return res.status(200).json({
			status: "success",
			message: "Canción eliminada de favoritos.",
		});
	} catch (error) {
		next(error);
	}
}

async function getFavorites(req, res, next) {
	try {
		const userId = req.user.sub;
		const result = await favoriteService.getFavorites(userId);

		return res.status(200).json({
			status: "success",
			playlist: result.playlist,
			songs: result.songs,
		});
	} catch (error) {
		next(error);
	}
}

async function getFavoriteSongIds(req, res, next) {
	try {
		const userId = req.user.sub;
		const ids = await favoriteService.getFavoriteSongIds(userId);

		return res.status(200).json({
			status: "success",
			songIds: ids,
		});
	} catch (error) {
		next(error);
	}
}

module.exports = {
	addFavorite,
	removeFavorite,
	getFavorites,
	getFavoriteSongIds,
};