const songService = require("../services/song.service");
const { getId, validateCursor, validateQuery } = require("../utils/validation");

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
		const { query, page, pageSize } = req.query;

		const result = await songService.searchSongs(query, { page, pageSize });

		res.status(200).json(result);
	} catch (error) {
		next(error);
	}
}

async function getRecommendations(req, res, next) {
	try {
		const { expression } = req.query;

		if (!expression) {
			return res.status(400).json({
				status: "error",
				message: "El parámetro expression es obligatorio.",
			});
		}

		const songs = await songService.getRecommendationsByExpression(expression);

		return res.status(200).json({ status: "success", songs });
	} catch (error) {
		if (error.status === 400) {
			return res.status(400).json({
				status: "error",
				message: error.message,
			});
		}
		next(error);
	}
}

module.exports = { getSongs, getSongById, searchSongs, getRecommendations };
