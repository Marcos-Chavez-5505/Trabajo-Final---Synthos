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

async function rateHost(req, res, next) {
	try {
		const result = await roomService.rateHost({
			roomId: Number(req.params.id),
			raterId: Number(req.user.sub),
			rating: req.body.rating,
		});

		return res.status(201).json({ result });
	} catch (error) {
		return next(error);
	}
}

module.exports = { getSortedRoom, rateHost };
