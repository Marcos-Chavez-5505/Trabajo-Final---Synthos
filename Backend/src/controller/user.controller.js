const userService = require("../services/user.service");
const { getId } = require("../utils/validation");
const { httpError } = require("../utils/errors");

async function searchUsers(req, res, next) {
	try {
		const { query = "", page, pageSize } = req.query;

		const viewerId = req.user ? Number(req.user.sub) : null;

		const results = await userService.searchUsers(
			query,
			page,
			pageSize,
			viewerId,
		);

		res.status(200).json(results);
	} catch (error) {
		next(error);
	}
}

async function getMe(req, res, next) {
	try {
		const user = await userService.getMe(Number(req.user.sub));

		if (!user) {
			throw httpError(404, "Usuario no encontrado.", "USER_NOT_FOUND");
		}

		res.status(200).json(user);
	} catch (error) {
		next(error);
	}
}

async function getUserById(req, res, next) {
	try {
		const id = getId(req);

		const user = await userService.getUserById(id);

		if (!user) {
			throw httpError(404, "Usuario no encontrado.", "USER_NOT_FOUND");
		}

		res.status(200).json(user);
	} catch (error) {
		next(error);
	}
}

async function updateMe(req, res, next) {
	try {
		const { username, biography, pictureUrl } = req.body || {};

		const user = await userService.updateUser(Number(req.user.sub), {
			username,
			biography,
			pictureUrl,
		});

		res.status(200).json(user);
	} catch (error) {
		next(error);
	}
}

async function uploadMyPicture(req, res, next) {
	try {
		if (!req.file) {
			throw httpError(
				400,
				"No se recibió ninguna imagen.",
				"MISSING_PICTURE",
			);
		}

		const user = await userService.updateUserPicture(
			Number(req.user.sub),
			req.file,
		);

		res.status(200).json(user);
	} catch (error) {
		next(error);
	}
}

module.exports = { searchUsers, getMe, getUserById, updateMe, uploadMyPicture };