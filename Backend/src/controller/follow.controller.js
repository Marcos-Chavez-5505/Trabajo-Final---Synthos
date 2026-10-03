const followService = require("../services/follow.service");

function parseId(raw) {
	const id = Number(raw);
	return Number.isInteger(id) && id > 0 ? id : null;
}

async function follow(req, res, next) {
	try {
		const followerId = req.user.sub;
		const followedId = parseId(req.params.id);

		if (!followedId) {
			return res.status(400).json({
				status: "error",
				message: "Id inválido.",
			});
		}

		if (followerId === followedId) {
			return res.status(400).json({
				status: "error",
				message: "No podés seguirte a vos mismo.",
			});
		}

		const exists = await followService.userExists(followedId);
		if (!exists) {
			return res.status(404).json({
				status: "error",
				message: "El usuario no existe.",
			});
		}

		const result = await followService.followUser(followerId, followedId);

		if (result.alreadyFollowing) {
			return res.status(200).json({
				status: "success",
				message: "Ya seguís a este usuario.",
			});
		}

		return res.status(200).json({
			status: "success",
			message: "Usuario seguido correctamente.",
		});
	} catch (error) {
		next(error);
	}
}

async function unfollow(req, res, next) {
	try {
		const followerId = req.user.sub;
		const followedId = parseId(req.params.id);

		if (!followedId) {
			return res.status(400).json({
				status: "error",
				message: "Id inválido.",
			});
		}

		const exists = await followService.userExists(followedId);
		if (!exists) {
			return res.status(404).json({
				status: "error",
				message: "El usuario no existe.",
			});
		}

		const result = await followService.unfollowUser(followerId, followedId);

		if (result.notFollowing) {
			return res.status(404).json({
				status: "error",
				message: "No seguías a este usuario.",
			});
		}

		return res.status(200).json({
			status: "success",
			message: "Dejaste de seguir al usuario.",
		});
	} catch (error) {
		next(error);
	}
}

async function getFollowers(req, res, next) {
	try {
		const userId = parseId(req.params.id);
		if (!userId) {
			return res.status(400).json({
				status: "error",
				message: "Id inválido.",
			});
		}

		const exists = await followService.userExists(userId);
		if (!exists) {
			return res.status(404).json({
				status: "error",
				message: "El usuario no existe.",
			});
		}

		const followers = await followService.getFollowers(userId);

		return res.status(200).json({ status: "success", followers });
	} catch (error) {
		next(error);
	}
}

async function getFollowing(req, res, next) {
	try {
		const userId = parseId(req.params.id);
		if (!userId) {
			return res.status(400).json({
				status: "error",
				message: "Id inválido.",
			});
		}

		const exists = await followService.userExists(userId);
		if (!exists) {
			return res.status(404).json({
				status: "error",
				message: "El usuario no existe.",
			});
		}

		const following = await followService.getFollowing(userId);

		return res.status(200).json({ status: "success", following });
	} catch (error) {
		next(error);
	}
}

module.exports = {
	follow,
	unfollow,
	getFollowers,
	getFollowing,
};