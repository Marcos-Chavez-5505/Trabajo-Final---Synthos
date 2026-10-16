const songService = require("../services/song.service");
const albumService = require("../services/album.service");
const { getId, validateCursor, validateQuery } = require("../utils/validation");
const { httpError } = require("../utils/errors");

async function getSongs(req, res, next) {
	try {
		const cursor = validateCursor(req.query.cursor);

		const result = await songService.getSongs(cursor);

		res.status(200).json(result);
	} catch (error) {
		next(error);
	}
}

async function getSongById(req, res, next) {
	try {
		const songId = getId(req);
		const result = await songService.getSongById(songId);

		res.status(200).json(result);
	} catch (error) {
		next(error);
	}
}

async function searchSongs(req, res, next) {
	try {
		const { query, page, pageSize, type = "songs" } = req.query;

		if (type === "songs") {
			return res.json(await songService.searchSongs(query, { page, pageSize }));
		}

		if (type === "albums") {
			return res.json(await albumService.searchAlbums(query, { page, pageSize }));
		}

		throw httpError(
			400,
			"El tipo de búsqueda debe ser 'songs' o 'albums'.",
			"SEARCH_TYPE_INVALID",
		);
	} catch (error) {
		next(error);
	}
}

async function getRecommendations(req, res, next) {
	try {
		const { expression } = req.query;

		if (!expression) {
			throw httpError(
				400,
				"El parámetro expression es obligatorio.",
				"EXPRESSION_REQUIRED",
			);
		}

		const songs = await songService.getRecommendationsByExpression(expression);

		return res.status(200).json({ status: "success", songs });
	} catch (error) {
		next(error);
	}
}

module.exports = { getSongs, getSongById, searchSongs, getRecommendations };
