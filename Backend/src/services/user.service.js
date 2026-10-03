const prisma = require("../prisma/prismaClient");
const { Prisma } = require("@prisma/client");

async function getTopGenreByUser(userId) {
	return prisma.userTopGenre.findUnique({
		where: { idUser: userId },
	});
}

const LIMIT = 10;

async function searchUsers(query, cursor) {
	const searchTerm = `%${query}%`;

	const users = await prisma.$queryRaw`
		SELECT
			"user".id,
			"user".username,
			"user".picture_url,
			user_top_genre.genre_name
		FROM "user"
		LEFT JOIN user_top_genre ON user_top_genre.id_user = "user".id
		WHERE (
			"user".username ILIKE ${searchTerm}
			OR user_top_genre.genre_name ILIKE ${searchTerm}
		)
		${cursor ? Prisma.sql`AND "user".id > ${cursor}` : Prisma.empty}
		ORDER BY "user".id ASC
		LIMIT ${LIMIT + 1}
	`;

	const hasMore = users.length === LIMIT;
	const nextCursor = users.length > 0 ? users[users.length - 1].id : null;

	return { users, nextCursor, hasMore };
}

module.exports = { searchUsers };
