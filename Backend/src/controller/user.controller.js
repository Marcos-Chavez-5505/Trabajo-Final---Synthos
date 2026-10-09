const userService = require("../services/user.service");
const { getId } = require("../utils/validation");

async function searchUsers(req, res, next) {
	try {
		const { query = "", page, pageSize } = req.query;

		// `sub` viene del JWT y siempre es string: Prisma espera Int. Sin sesión
		// (optionalAuthenticate) la búsqueda sigue siendo pública, sin indicador.
		const viewerId = req.user ? Number(req.user.sub) : null;

		const results = await userService.searchUsers(query, page, pageSize, viewerId);

		res.status(200).json(results);
	} catch (error) {
		next(error);
	}
}

async function getMe(req, res, next) {
	try {
		// `sub` viene del JWT y siempre es string: Prisma espera Int.
		const user = await userService.getMe(Number(req.user.sub));

		if (!user) {
			return res.status(404).json({
				status: "error",
				message: "Usuario no encontrado.",
			});
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
			return res.status(404).json({
				status: "error",
				message: "Usuario no encontrado.",
			});
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

module.exports = { searchUsers, getMe, getUserById, updateMe };
