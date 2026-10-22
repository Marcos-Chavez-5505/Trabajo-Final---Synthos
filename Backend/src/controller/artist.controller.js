const artistService = require("../services/artist.service");
const { getId } = require("../utils/validation");
const { httpError } = require("../utils/errors");

async function searchArtists(req, res, next) {
	try {
		const { query = "", page, pageSize } = req.query;

		const results = await artistService.searchArtists(query, {
			page,
			pageSize,
		});

		res.status(200).json(results);
	} catch (error) {
		next(error);
	}
}

async function getArtistById(req, res, next) {
	try {
		const id = getId(req);

		const artist = await artistService.getArtistById(id);

		if (!artist) {
			throw httpError(404, "El artista no existe.", "ARTIST_NOT_FOUND");
		}

		return res.status(200).json({ status: "success", artist });
	} catch (error) {
		next(error);
	}
}

module.exports = { searchArtists, getArtistById };
