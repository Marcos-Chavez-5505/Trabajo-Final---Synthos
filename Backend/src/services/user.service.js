const prisma = require("../prisma/prismaClient");
const { Prisma } = require("@prisma/client");
const followService = require("./follow.service");

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

const PUBLIC_USER_SELECT = {
	id: true,
	username: true,
	pictureUrl: true,
	biography: true,
	registrationDate: true,
};

const ME_USER_SELECT = {
	id: true,
	email: true,
	username: true,
	pictureUrl: true,
	biography: true,
	registrationDate: true,
};

const FOLLOW_USER_PREVIEW_SELECT = {
	id: true,
	username: true,
	pictureUrl: true,
};

async function getTopGenreByUser(userId) {
	return prisma.userTopGenre.findUnique({
		where: { idUser: userId },
	});
}

function toPage(value, fallback) {
	const parsed = Number.parseInt(value, 10);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function toPageSize(value) {
	return Math.min(toPage(value, DEFAULT_PAGE_SIZE), MAX_PAGE_SIZE);
}

async function searchUsers(query, page, pageSize) {
	const term = typeof query === "string" ? query.trim() : "";
	const currentPage = toPage(page, 1);
	const size = toPageSize(pageSize);
	const offset = (currentPage - 1) * size;

	const filter = term
		? Prisma.sql`WHERE ("user".username ILIKE ${`%${term}%`} OR user_top_genre.genre_name ILIKE ${`%${term}%`})`
		: Prisma.empty;

	const items = await prisma.$queryRaw`
		SELECT
			"user".id,
			"user".username,
			"user".picture_url,
			"user".biography,
			user_top_genre.genre_name
		FROM "user"
		LEFT JOIN user_top_genre ON user_top_genre.id_user = "user".id
		${filter}
		ORDER BY "user".id ASC
		LIMIT ${size} OFFSET ${offset}
	`;

	const countRows = await prisma.$queryRaw`
		SELECT COUNT(*)::int AS total
		FROM "user"
		LEFT JOIN user_top_genre ON user_top_genre.id_user = "user".id
		${filter}
	`;

	const total = countRows[0]?.total ?? 0;
	const totalPages = Math.max(1, Math.ceil(total / size));

	return { items, total, page: currentPage, pageSize: size, totalPages };
}

async function getUserById(id) {
	const user = await prisma.user.findUnique({
		where: { id },
		select: {
			...PUBLIC_USER_SELECT,
			followers: {
				select: { follower: { select: FOLLOW_USER_PREVIEW_SELECT } },
			},
			following: {
				select: { followed: { select: FOLLOW_USER_PREVIEW_SELECT } },
			},
		},
	});

	if (!user) return null;

	const followers = user.followers.map((f) => f.follower);
	const following = user.following.map((f) => f.followed);

	return {
		...user,
		followers,
		following,
		followerCount: followers.length,
		followingCount: following.length,
	};
}

async function getMe(id) {
	return prisma.user.findUnique({
		where: { id },
		select: ME_USER_SELECT,
	});
}

async function updateUser(id, { username, biography, pictureUrl }) {
	const data = {};

	if (username !== undefined) {
		const value = String(username).trim();

		if (value.length < 3 || value.length > 50) {
			const error = new Error(
				"El username debe tener entre 3 y 50 caracteres.",
			);
			error.code = 400;
			throw error;
		}

		const taken = await prisma.user.findFirst({
			where: { username: value, NOT: { id } },
			select: { id: true },
		});

		if (taken) {
			const error = new Error("Ese nombre de usuario ya está en uso.");
			error.code = 400;
			throw error;
		}

		data.username = value;
	}

	if (biography !== undefined) {
		data.biography = biography === null ? null : String(biography);
	}

	if (pictureUrl !== undefined) {
		data.pictureUrl = pictureUrl === null ? null : String(pictureUrl);
	}

	return prisma.user.update({
		where: { id },
		data,
		select: ME_USER_SELECT,
	});
}

module.exports = {
	getTopGenreByUser,
	searchUsers,
	getUserById,
	getMe,
	updateUser,
};
