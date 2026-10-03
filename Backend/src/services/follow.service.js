const prisma = require("../prisma/prismaClient");

const USER_PREVIEW = {
	id: true,
	username: true,
	pictureUrl: true,
};

async function userExists(userId) {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { id: true },
	});
	return Boolean(user);
}

async function followUser(followerId, followedId) {
	const existing = await prisma.follow.findUnique({
		where: {
			followerId_followedId: { followerId, followedId },
		},
	});

	if (existing) return { alreadyFollowing: true };

	await prisma.follow.create({
		data: { followerId, followedId },
	});

	return { followed: true };
}

async function unfollowUser(followerId, followedId) {
	const existing = await prisma.follow.findUnique({
		where: {
			followerId_followedId: { followerId, followedId },
		},
	});

	if (!existing) return { notFollowing: true };

	await prisma.follow.delete({
		where: {
			followerId_followedId: { followerId, followedId },
		},
	});

	return { unfollowed: true };
}

async function getFollowers(userId) {
	const rows = await prisma.follow.findMany({
		where: { followedId: userId },
		orderBy: { followDate: "desc" },
		include: {
			follower: { select: USER_PREVIEW },
		},
	});

	return rows.map((r) => r.follower);
}

async function getFollowing(userId) {
	const rows = await prisma.follow.findMany({
		where: { followerId: userId },
		orderBy: { followDate: "desc" },
		include: {
			followed: { select: USER_PREVIEW },
		},
	});

	return rows.map((r) => r.followed);
}

module.exports = {
	userExists,
	followUser,
	unfollowUser,
	getFollowers,
	getFollowing,
};