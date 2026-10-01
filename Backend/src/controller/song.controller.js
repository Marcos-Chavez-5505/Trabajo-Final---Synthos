const songService = require("../services/song.service");
const { getId } = require("../utils/validation");

async function getSongs(req, res, next) {
	try {
		const cursor = req.query.cursor ? parseInt(req.query.cursor) : null;

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

module.exports = { getSongs, getSongById };