const prisma = require("../prisma/prismaClient");

const SONG_INCLUDE = {
	songGenres: { include: { genre: true } },
	songMoods: { include: { mood: true } },
	artist: true,
};

const AUTHOR_PREVIEW = {
	id: true,
	username: true,
	pictureUrl: true,
};

const RECOMMENDATION_INCLUDE = {
	author: { select: AUTHOR_PREVIEW },
	song: { include: SONG_INCLUDE },
};

async function userExists(userId) {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: { id: true },
	});
	return Boolean(user);
}

async function songExists(songId) {
	const song = await prisma.song.findUnique({
		where: { id: songId },
		select: { id: true },
	});
	return Boolean(song);
}

async function hasMutualFollow(userA, userB) {
	const rows = await prisma.follow.findMany({
		where: {
			OR: [
				{ followerId: userA, followedId: userB },
				{ followerId: userB, followedId: userA },
			],
		},
	});
	return rows.length === 2;
}

async function createRecommendation({ idAuthor, idUser, songId, text }) {
	return prisma.$transaction(async (tx) => {
		const content = await tx.content.create({
			data: { idAuthor, idSong: songId, text },
		});

		await tx.contentPlayement.create({
			data: { idContent: content.id, idUser },
		});

		return tx.content.findUnique({
			where: { id: content.id },
			include: RECOMMENDATION_INCLUDE,
		});
	});
}

async function getRecommendationsForProfile(profileId, viewerId) {
	const where =
		viewerId === profileId
			? { playements: { some: { idUser: profileId } } }
			: {
					idAuthor: viewerId,
					playements: { some: { idUser: profileId } },
				};

	return prisma.content.findMany({
		where,
		orderBy: { date: "desc" },
		include: RECOMMENDATION_INCLUDE,
	});
}

async function getFollowStatus(viewerId, targetId) {
	const [viewerFollowsTarget, targetFollowsViewer] = await Promise.all([
		prisma.follow.findUnique({
			where: {
				followerId_followedId: { followerId: viewerId, followedId: targetId },
			},
		}),
		prisma.follow.findUnique({
			where: {
				followerId_followedId: { followerId: targetId, followedId: viewerId },
			},
		}),
	]);

	const viewerFollows = Boolean(viewerFollowsTarget);
	const targetFollows = Boolean(targetFollowsViewer);

	return {
		viewerFollows,
		targetFollows,
		isMutual: viewerFollows && targetFollows,
	};
}

module.exports = {
	userExists,
	songExists,
	hasMutualFollow,
	createRecommendation,
	getRecommendationsForProfile,
	getFollowStatus,
};