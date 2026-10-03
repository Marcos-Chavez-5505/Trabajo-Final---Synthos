const prisma = require("../prisma/prismaClient");

async function listRoomsSortedByName() {
	return prisma.$queryRaw`
		SELECT
			room.*,
			room_avg_rating.avg_rating
		FROM room
		JOIN room_avg_rating ON room_avg_rating.id_room = room.id
		ORDER BY room.name ASC
	`;
}

async function listRoomsSortedByRating() {
	return prisma.$queryRaw`
		SELECT
			room.*,
			room_avg_rating.avg_rating
		FROM room
		JOIN room_avg_rating ON room_avg_rating.id_room = room.id
		ORDER BY room_avg_rating.avg_rating DESC
	`;
}

async function getSortedRoom(sortType = "alphabetical") {
	switch (sortType) {
		case "alphabetical":
			return listRoomsSortedByName();
		case "rating":
			return listRoomsSortedByRating();
		default:
			console.log("UNKNOWN SORT TYPE");
			break;
	}
}
module.exports = { getSortedRoom };
