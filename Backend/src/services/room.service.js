const prisma = require("../prisma/prismaClient");
const { httpError } = require("../utils/errors");

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

async function rateHost({ roomId, raterId, rating }) {
	if (!Number.isInteger(roomId) || roomId <= 0) {
		throw httpError(400, "EL ID DE LA SALA NO ES VÁLIDO", "INVALID_ROOM_ID", {
			idRoom: roomId,
		});
	}

	if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
		throw httpError(
			400,
			"LA CALIFICACIÓN DEBE SER UN ENTERO ENTRE 1 Y 5",
			"INVALID_RATING",
			{ rating },
		);
	}

	const room = await prisma.room.findUnique({
		where: { id: roomId },
		select: { id: true },
	});

	if (!room) {
		throw httpError(
			404,
			`NO SE ENCONTRÓ LA SALA CON ID ${roomId}`,
			"ROOM_NOT_FOUND",
		);
	}

	const [hostMember, raterMember] = await Promise.all([
		prisma.roomMember.findFirst({
			where: { idRoom: roomId, role: "host" },
			select: { idUser: true },
		}),
		prisma.roomMember.findUnique({
			where: { idRoom_idUser: { idRoom: roomId, idUser: raterId } },
			select: { idUser: true },
		}),
	]);

	if (!raterMember) {
		throw httpError(
			403,
			"SOLO PODÉS CALIFICAR EN SALAS EN LAS QUE PARTICIPASTE",
			"RATER_NOT_IN_ROOM",
		);
	}

	if (!hostMember) {
		throw httpError(
			404,
			`LA SALA CON ID ${roomId} NO TIENE ANFITRIÓN`,
			"ROOM_HOST_NOT_FOUND",
		);
	}

	if (hostMember.idUser === raterId) {
		throw httpError(
			400,
			"NO PODÉS CALIFICARTE A VOS MISMO",
			"CANNOT_RATE_SELF",
		);
	}

	try {
		return await prisma.hostRating.create({
			data: {
				idRoom: roomId,
				idRater: raterId,
				idHost: hostMember.idUser,
				rating,
			},
			select: { idRoom: true, idHost: true, rating: true, ratingDate: true },
		});
	} catch (error) {
		//* error mas bonito
		if (error.code === "P2002") {
			throw httpError(
				409,
				"YA CALIFICASTE AL ANFITRIÓN DE ESTA SALA",
				"HOST_ALREADY_RATED",
				{ idRoom: roomId, idHost: hostMember.idUser },
			);
		}
		throw error;
	}
}

module.exports = { getSortedRoom, rateHost };
