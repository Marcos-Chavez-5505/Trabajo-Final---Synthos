const prisma = require("../prisma/prismaClient");
const { Prisma } = require("@prisma/client");
const followService = require("./follow.service");

const DEFAULT_PAGE_SIZE = 10;
const MAX_PAGE_SIZE = 50;

// Campos del `user` que ve cualquiera: sin email ni hash.
const PUBLIC_USER_SELECT = {
	id: true,
	username: true,
	pictureUrl: true,
	biography: true,
	registrationDate: true,
};

// Campos que solo ve el dueño de la sesión (incluye email, que la UI muestra en
// el perfil propio).
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

/**
 * Busca personas por username o género, paginadas por número de página.
 *
 * Devuelve el mismo envelope que `/api/songs/search` ({ items, total, page,
 * pageSize, totalPages }) para que el frontend use la misma `Pagination` en las
 * dos pantallas. Query vacía = catálogo completo.
 */
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

/** Perfil público: sin email. `null` si no existe. */
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

/** Usuario de la sesión: incluye email. `null` si no existe. */
async function getMe(id) {
	return prisma.user.findUnique({
		where: { id },
		select: ME_USER_SELECT,
	});
}

/**
 * Edita el perfil del usuario del token.
 *
 * Solo toca los campos presentes en el body. Valida el largo del username y que
 * no lo tenga otra persona antes de llamar a Prisma, para devolver un 400 con
 * mensaje claro en vez del 409 genérico de la constraint.
 */
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
