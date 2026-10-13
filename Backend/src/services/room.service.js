const prisma = require("../prisma/prismaClient");

async function listRoomsSortedByName() {
	return prisma.$queryRaw`
		SELECT
			room.*,
			host_user.id AS host_id,
			host_user.username AS host_username,
			COALESCE(host_avg_rating.avg_rating, 0) AS avg_rating
		FROM room
		JOIN room_member host_member
			ON host_member.id_room = room.id AND host_member.role = 'host'
		JOIN "user" host_user
			ON host_user.id = host_member.id_user
		LEFT JOIN host_avg_rating
			ON host_avg_rating.id_host = host_user.id
		WHERE room.is_private = false
		ORDER BY room.name ASC
	`;
}

async function listRoomsSortedByRating() {
	return prisma.$queryRaw`
		SELECT
			room.*,
			host_user.id AS host_id,
			host_user.username AS host_username,
			COALESCE(host_avg_rating.avg_rating, 0) AS avg_rating
		FROM room
		JOIN room_member host_member
			ON host_member.id_room = room.id AND host_member.role = 'host'
		JOIN "user" host_user
			ON host_user.id = host_member.id_user
		LEFT JOIN host_avg_rating
			ON host_avg_rating.id_host = host_user.id
		WHERE room.is_private = false
		ORDER BY avg_rating DESC, room.name ASC
	`;
}

async function getSortedRoom(sortType = "alphabetical") {
	switch (sortType) {
		case "name":
		case "alphabetical":
			return listRoomsSortedByName();
		case "rating":
			return listRoomsSortedByRating();
		default:
			console.log("UNKNOWN SORT TYPE");
			return [];
	}
}

module.exports = { getSortedRoom };