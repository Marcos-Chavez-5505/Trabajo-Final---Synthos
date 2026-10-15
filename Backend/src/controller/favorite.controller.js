const favoriteService = require("../services/favorite.service");
const { httpError } = require("../utils/errors");

async function addFavorite(req, res, next) {
	try {
		const userId = req.user.sub;
		const songId = Number(req.body?.songId ?? req.body?.idSong);

		if (!Number.isInteger(songId) || songId <= 0) {
			throw httpError(
				400,
				"El id de la canción es inválido.",
				"INVALID_SONG_ID",
			);
		}

		const result = await favoriteService.addFavorite(userId, songId);

		if (result.notFound) {
			throw httpError(404, "La canción no existe.", "SONG_NOT_FOUND");
		}

		if (result.conflict) {
			throw httpError(
				409,
				"La canción ya está en favoritos.",
				"FAVORITE_ALREADY_EXISTS",
			);
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
			throw httpError(
				400,
				"El id de la canción es inválido.",
				"INVALID_SONG_ID",
			);
		}

		const result = await favoriteService.removeFavorite(userId, songId);

		if (result.notFound) {
			throw httpError(
				404,
				"Esa canción no estaba en favoritos.",
				"FAVORITE_NOT_FOUND",
			);
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