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

module.exports = { getSongs, getSongById, searchSongs };
