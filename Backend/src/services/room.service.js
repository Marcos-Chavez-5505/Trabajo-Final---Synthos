const prisma = require("../prisma/prismaClient");
const bcrypt = require("bcrypt");
const crypto = require("node:crypto");

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


const ROOM_INCLUDE = {
	playlistSource: {
		include: {
			songs: {
				orderBy: { position: "asc" },
				include: {
					song: {
						include: {
							artist: true,
							songArtists: true,
							songGenres: true,
							songMoods: true,
						},
					},
				},
			},
		},
	},
	members: {
		include: {
			user: { select: { id: true, username: true, pictureUrl: true } },
		},
	},
};

function generateRoomCode() {
	return crypto.randomBytes(4).toString("hex").slice(0, 6).toUpperCase();
}

async function createRoom(hostId, { name, description, playlistId, isPrivate, password }) {
	const playlist = await prisma.playlist.findUnique({
		where: { id: playlistId },
		include: { songs: { select: { idSong: true } } },
	});

	if (!playlist) {
		const err = new Error("La playlist no existe.");
		err.status = 404;
		throw err;
	}

	if (playlist.idCreator !== hostId) {
		const err = new Error("La playlist no te pertenece.");
		err.status = 403;
		throw err;
	}

	if (playlist.type !== "personal") {
		const err = new Error("Solo se pueden usar playlists personales.");
		err.status = 400;
		throw err;
	}

	if (playlist.songs.length === 0) {
		const err = new Error("La playlist no tiene canciones.");
		err.status = 400;
		throw err;
	}

	let passwordHash = null;
	if (isPrivate) {
		passwordHash = await bcrypt.hash(password, 10);
	}

	// Generar código único (reintenta si colisiona)
	let code;
	let attempts = 0;
	do {
		code = generateRoomCode();
		const exists = await prisma.room.findUnique({ where: { code } });
		if (!exists) break;
		attempts++;
	} while (attempts < 10);

	if (attempts >= 10) {
		const err = new Error("No se pudo generar un código único.");
		err.status = 500;
		throw err;
	}

	return prisma.$transaction(async (tx) => {
		const room = await tx.room.create({
			data: {
				code,
				name,
				description: description ?? null,
				idPlaylistSource: playlistId,
				isPrivate: isPrivate ?? false,
				passwordHash,
				maxCapacity: 10,
				status: "activa",
			},
		});

		await tx.roomMember.create({
			data: { idRoom: room.id, idUser: hostId, role: "host" },
		});

		return tx.room.findUnique({
			where: { id: room.id },
			include: ROOM_INCLUDE,
		});
	});
}

async function joinRoom(userId, { code, password }) {
	const room = await prisma.room.findUnique({
		where: { code },
		include: {
			members: { select: { idUser: true } },
			playlistSource: {
				include: {
					songs: {
						orderBy: { position: "asc" },
						include: {
							song: {
								include: {
									artist: true,
									songArtists: true,
									songGenres: true,
									songMoods: true,
								},
							},
						},
					},
				},
			},
		},
	});

	if (!room) {
		const err = new Error("Sala no encontrada.");
		err.status = 404;
		throw err;
	}

	if (room.status === "cerrada") {
		const err = new Error("La sala está cerrada.");
		err.status = 400;
		throw err;
	}

	const alreadyMember = room.members.some((m) => m.idUser === userId);

	if (room.isPrivate && !alreadyMember) {
		if (!password || typeof password !== "string") {
			const err = new Error("Esta sala requiere contraseña.");
			err.status = 403;
			throw err;
		}
		const valid = await bcrypt.compare(password, room.passwordHash);
		if (!valid) {
			const err = new Error("Contraseña incorrecta.");
			err.status = 403;
			throw err;
		}
	}

	return prisma.$transaction(async (tx) => {
		// Releer dentro de la transacción para evitar race conditions
		const currentRoom = await tx.room.findUnique({
			where: { id: room.id },
			include: { members: { select: { idUser: true } } },
		});

		if (currentRoom.members.some((m) => m.idUser === userId)) {
			return { room: await tx.room.findUnique({
				where: { id: room.id },
				include: ROOM_INCLUDE,
			}), alreadyMember: true };
		}

		if (currentRoom.members.length >= currentRoom.maxCapacity) {
			const err = new Error("La sala está llena.");
			err.status = 409;
			throw err;
		}

		await tx.roomMember.create({
			data: { idRoom: room.id, idUser: userId, role: "member" },
		});

		return {
			room: await tx.room.findUnique({
				where: { id: room.id },
				include: ROOM_INCLUDE,
			}),
			alreadyMember: false,
		};
	});
}

async function leaveRoom(userId, roomId) {
	const room = await prisma.room.findUnique({
		where: { id: roomId },
		include: { members: { select: { idUser: true, role: true } } },
	});

	if (!room) {
		const err = new Error("Sala no encontrada.");
		err.status = 404;
		throw err;
	}

	const member = room.members.find((m) => m.idUser === userId);
	if (!member) {
		const err = new Error("No sos miembro de esta sala.");
		err.status = 404;
		throw err;
	}

	// Si sale el anfitrión, se cierra la sala (decisión de diseño)
	if (member.role === "host") {
		await prisma.room.update({
			where: { id: roomId },
			data: { status: "cerrada" },
		});
		return { closed: true };
	}

	await prisma.roomMember.delete({
		where: { idRoom_idUser: { idRoom: roomId, idUser: userId } },
	});

	return { closed: false };
}

async function getRoomWithMembers(roomId) {
	return prisma.room.findUnique({
		where: { id: roomId },
		include: ROOM_INCLUDE,
	});
}

async function isRoomMember(roomId, userId) {
	const member = await prisma.roomMember.findUnique({
		where: { idRoom_idUser: { idRoom: roomId, idUser: userId } },
	});
	return Boolean(member);
}

async function getRoomHost(roomId) {
	const host = await prisma.roomMember.findFirst({
		where: { idRoom: roomId, role: "host" },
		select: { idUser: true },
	});
	return host?.idUser ?? null;
}

async function getRoomByIdForMember(roomId, userId) {
	const room = await prisma.room.findUnique({
		where: { id: roomId },
		include: ROOM_INCLUDE,
	});

	if (!room) return { notFound: true };

	const isMember = room.members.some((m) => m.idUser === userId);
	if (!isMember) return { forbidden: true };

	return { room };
}

async function kickMember(hostId, roomId, targetUserId) {
	const room = await prisma.room.findUnique({
		where: { id: roomId },
		include: { members: { select: { idUser: true, role: true } } },
	});

	if (!room) {
		const err = new Error("Sala no encontrada.");
		err.status = 404;
		throw err;
	}

	const host = room.members.find((m) => m.idUser === hostId && m.role === "host");
	if (!host) {
		const err = new Error("No sos el anfitrión de esta sala.");
		err.status = 403;
		throw err;
	}

	const target = room.members.find((m) => m.idUser === targetUserId);
	if (!target) {
		const err = new Error("El usuario no es miembro de esta sala.");
		err.status = 404;
		throw err;
	}

	if (target.role === "host") {
		const err = new Error("El anfitrión no puede eliminarse a sí mismo.");
		err.status = 400;
		throw err;
	}

	await prisma.roomMember.delete({
		where: { idRoom_idUser: { idRoom: roomId, idUser: targetUserId } },
	});

	return { kicked: targetUserId };
}

async function closeRoom(hostId, roomId) {
	const room = await prisma.room.findUnique({
		where: { id: roomId },
		include: { members: { select: { idUser: true, role: true } } },
	});

	if (!room) {
		const err = new Error("Sala no encontrada.");
		err.status = 404;
		throw err;
	}

	const host = room.members.find((m) => m.idUser === hostId && m.role === "host");
	if (!host) {
		const err = new Error("No sos el anfitrión de esta sala.");
		err.status = 403;
		throw err;
	}

	await prisma.room.update({
		where: { id: roomId },
		data: { status: "cerrada" },
	});

	return { closed: true };
}

async function getHostIdOfRoom(roomId) {
	const host = await prisma.roomMember.findFirst({
		where: { idRoom: roomId, role: "host" },
		select: { idUser: true },
	});
	return host?.idUser ?? null;
}

async function getNonHostMemberIds(roomId) {
	const members = await prisma.roomMember.findMany({
		where: { idRoom: roomId, role: { not: "host" } },
		select: { idUser: true },
	});
	return members.map((m) => m.idUser);
}

async function getPlaylistSongsOfRoom(roomId) {
	const room = await prisma.room.findUnique({
		where: { id: roomId },
		select: {
			playlistSource: {
				select: {
					songs: {
						orderBy: { position: "asc" },
						select: { idSong: true },
					},
				},
			},
		},
	});
	if (!room) return null;
	return room.playlistSource.songs.map((s) => s.idSong);
}

async function getRoomStatus(roomId) {
	const room = await prisma.room.findUnique({
		where: { id: roomId },
		select: { id: true, status: true },
	});
	return room;
}

module.exports = {
	getSortedRoom,
	createRoom,
	joinRoom,
	leaveRoom,
	getRoomWithMembers,
	isRoomMember,
	getRoomHost,
	getRoomByIdForMember,
	kickMember,
	closeRoom,
    getHostIdOfRoom,
	getNonHostMemberIds,
	getPlaylistSongsOfRoom,
	getRoomStatus,
};