const albumService = require("../services/album.service");
const { getId } = require("../utils/validation");
const { httpError } = require("../utils/errors");

async function getAlbumById(req, res, next) {
	try {
		const id = getId(req);

		const album = await albumService.getAlbumById(id);

		if (!album) {
			throw httpError(404, "El álbum no existe.", "ALBUM_NOT_FOUND");
		}

		return res.status(200).json({ status: "success", album });
	} catch (error) {
		next(error);
	}
}

module.exports = { getAlbumById };
