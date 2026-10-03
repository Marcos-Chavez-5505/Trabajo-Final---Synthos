const roomService = require("../services/room.service");
const { validateSortType } = require("../utils/validation");

async function getSortedRoom(req, res, next) {
	try {
		const sort = validateSortType(req.query.sort || "alphabetical");

		const result = await roomService.getSortedRoom(sort);

		res.status(200).json(result);
	} catch (error) {
		next(error);
	}
}

module.exports = { getSortedRoom };
