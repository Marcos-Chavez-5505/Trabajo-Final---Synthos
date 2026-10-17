const followService = require("../services/follow.service");
const { httpError } = require("../utils/errors");
const { requireId } = require("../utils/id");

async function follow(req, res, next) {
	try {
		const followerId = req.user.sub;
		const followedId = requireId(req.params.id);

		if (followerId === followedId) {
			throw httpError(400, "No podés seguirte a vos mismo.", "FOLLOW_SELF");
		}

		const exists = await followService.userExists(followedId);
		if (!exists) {
			throw httpError(404, "El usuario no existe.", "USER_NOT_FOUND");
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
		const followedId = requireId(req.params.id);

		const exists = await followService.userExists(followedId);
		if (!exists) {
			throw httpError(404, "El usuario no existe.", "USER_NOT_FOUND");
		}

		const result = await followService.unfollowUser(followerId, followedId);

		if (result.notFollowing) {
			throw httpError(404, "No seguías a este usuario.", "NOT_FOLLOWING");
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
		const userId = requireId(req.params.id);

		const exists = await followService.userExists(userId);
		if (!exists) {
			throw httpError(404, "El usuario no existe.", "USER_NOT_FOUND");
		}

		const followers = await followService.getFollowers(userId);

		return res.status(200).json({ status: "success", followers });
	} catch (error) {
		next(error);
	}
}

async function getFollowing(req, res, next) {
	try {
		const userId = requireId(req.params.id);

		const exists = await followService.userExists(userId);
		if (!exists) {
			throw httpError(404, "El usuario no existe.", "USER_NOT_FOUND");
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
