const prisma = require("../prisma/prismaClient");
const roomState = require("../realtime/roomState");
const bcrypt = require("bcrypt");
const crypto = require("node:crypto");
const { Prisma } = require("@prisma/client");
const { httpError } = require("../utils/errors");

// Caracteres que en `ILIKE` son comodines. Se escapan para que buscar "%"
//no devuelva todas las salas.
const LIKE_WILDCARDS = /[\\%_]/g;

function toLikePattern(query) {
	return `%${String(query).replace(LIKE_WILDCARDS, (char) => `\\${char}`)}%`;
}

/**
 * Query del listado de salas, compartida por `GET /api/rooms` y
 * `GET /api/rooms/mine`.
 *
 * Las columnas se nombran una por una a propósito: con `room.*` el endpoint
 * público devolvía también `password_hash`. El anfitrión y el conteo de
 * miembros van como `LATERAL` para que un `JOIN` no duplique la fila de la sala
 * (nada impide dos anfitriones en la misma) ni multiplicar el `COUNT` por el
 * fan-out de las calificaciones.
 */
function buildRoomListQuery({ query, sort, order, onlyMine, userId }) {
	const direction = order === "desc" ? Prisma.raw("DESC") : Prisma.raw("ASC");
	const orderBy =
		sort === "rating"
			? Prisma.sql`avg_rating ${direction}, room.name ASC`
			: Prisma.sql`room.name ${direction}`;

	// El filtro por texto busca por nombre de sala o por nombre del anfitrión.
	const textFilter = query
		? Prisma.sql`AND (
			room.name ILIKE ${toLikePattern(query)} ESCAPE '\\'
			OR host_user.username ILIKE ${toLikePattern(query)} ESCAPE '\\'
		)`
		: Prisma.empty;

	// El listado público nunca muestra privadas ni cerradas: a las privadas se
	// entra con el código (D14) y a las cerradas ya no se entra.
	const visibility = onlyMine
		? Prisma.sql`room.status = 'activa' AND EXISTS (
			SELECT 1 FROM room_member mine WHERE mine.id_room = room.id AND mine.id_user = ${userId}
		)`
		: Prisma.sql`room.is_private = false AND room.status = 'activa'`;

	return Prisma.sql`
		SELECT
			room.id,
			room.code,
			room.name,
			room.description,
			room.id_playlist_source,
			room.is_private,
			room.max_capacity,
			room.status,
			room.creation_date,
			host_user.id AS host_id,
			host_user.username AS host_username,
			COALESCE(host_avg_rating.avg_rating, 0) AS avg_rating,
			COALESCE(members_count.total, 0) AS members_count,
			COALESCE(songs_count.total, 0) AS songs_count
		FROM room
		LEFT JOIN LATERAL (
			SELECT u.id, u.username
			FROM room_member rm
			JOIN "user" u ON u.id = rm.id_user
			WHERE rm.id_room = room.id AND rm.role = 'host'
			LIMIT 1
		) AS host_user ON true
		LEFT JOIN host_avg_rating
			ON host_avg_rating.id_host = host_user.id
		LEFT JOIN LATERAL (
			SELECT COUNT(*)::int AS total
			FROM room_member rm2
			WHERE rm2.id_room = room.id
		) AS members_count ON true
		LEFT JOIN LATERAL (
			SELECT COUNT(*)::int AS total
			FROM playlist_song ps
			WHERE ps.id_playlist = room.id_playlist_source
		) AS songs_count ON true
		WHERE ${visibility}
		${textFilter}
		ORDER BY ${orderBy}
	`;
}

async function listRooms({ query = "", sort = "name", order = "asc" } = {}) {
	return prisma.$queryRaw(
		buildRoomListQuery({ query, sort, order, onlyMine: false }),
	);
}

/**
 * Salas de las que el usuario es miembro (grupo "Mis Salas"). A diferencia del
 * listado público, acá entran también las privadas: son las que puede haber
 * creado o aceptado con un código.
 */
async function listMyRooms(userId, { query = "" } = {}) {
	return prisma.$queryRaw(
		buildRoomListQuery({
			query,
			sort: "name",
			order: "asc",
			onlyMine: true,
			userId,
		}),
	);
}


const ROOM_INCLUDE = {
	playlistSource: {
		include: {
			songs: {
				orderBy: [{ position: "asc" }, { idSong: "asc" }],
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

/**
 * Crea una sala a partir de una playlist (B12).
 *
 * La fuente puede ser cualquier playlist a la que el usuario tenga acceso: una
 * personal propia o una colaborativa de la que participe (D19). Solo se exige que
 * tenga al menos una canción, porque la sala arranca reproduciéndola.
 */
/**
 * Saca `passwordHash` de una sala antes de devolverla.
 *
 * `ROOM_INCLUDE` trae la fila completa de `room` y con ella el hash de bcrypt de
 * las salas privadas. El listado ya proyecta columnas explícitas, pero los
 * endpoints que devuelven la sala entera (crear, unirse, detalle) pasaban por
 * acá sin filtrar nada.
 */
function safeRoom(room) {
	if (!room) return room;

	const { passwordHash, ...rest } = room;

	if (rest.playlistSource && Array.isArray(rest.playlistSource.songs)) {
		rest.playlistSource = {
			...rest.playlistSource,
			songs: roomState.orderSongsByQueue(rest.id, rest.playlistSource.songs),
		};
	}

	return rest;
}

async function createRoom(hostId, { name, description, playlistId, isPrivate, password }) {
	const playlist = await prisma.playlist.findUnique({
		where: { id: playlistId },
		include: {
			songs: { select: { idSong: true } },
			members: { select: { idUser: true } },
		},
	});

	if (!playlist) {
		const err = new Error("La playlist no existe.");
		err.status = 404;
		throw err;
	}

	const isCreator = playlist.idCreator === hostId;
	const isMember = playlist.members.some((m) => m.idUser === hostId);

	if (!isCreator && !isMember) {
		const err = new Error("La playlist no te pertenece.");
		err.status = 403;
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
	}).then((created) =>
		// Sala recién creada: no tiene anfitrión con calificación todavía, y quien
		// la acaba de abrir es el anfitrión, así que no viene de nada.
		safeRoom({ ...created, hostAvgRating: 0, viewerHasRated: false }),
	);
}

async function joinRoom(userId, { code, password }) {
	const room = await prisma.room.findUnique({
		where: { code },
		include: {
			members: { select: { idUser: true } },
			playlistSource: {
				include: {
					songs: {
						orderBy: [{ position: "asc" }, { idSong: "asc" }],
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
			return {
				room: safeRoom(
					await tx.room.findUnique({
						where: { id: room.id },
						include: ROOM_INCLUDE,
					}),
				),
				alreadyMember: true,
			};
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
			room: safeRoom(
				await tx.room.findUnique({
					where: { id: room.id },
					include: ROOM_INCLUDE,
				}),
			),
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
	return safeRoom(
		await prisma.room.findUnique({
			where: { id: roomId },
			include: ROOM_INCLUDE,
		}),
	);
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

	// El promedio del anfitrión no viene en el include: se pega aparte para que
	// la pantalla de la sala muestre la calificación sin pedir el listado.
	const hostId = room.members.find((m) => m.role === "host")?.idUser ?? null;

	// Si quien mira ya calificó esta sala, el botón tiene que venir deshabilitado.
	// Sin esto el frontend solo puede acordarse de lo que él mismo hizo en esta
	// sesión, y al recargar volvería a ofrecerlo.
	const ownRating = hostId
		? await prisma.hostRating.findUnique({
				where: { idRoom_idRater_idHost: { idRoom: roomId, idRater: userId, idHost: hostId } },
				select: { rating: true },
			})
		: null;

	return {
		room: {
			...safeRoom(room),
			hostAvgRating: hostId ? await getHostAvgRating(hostId) : 0,
			viewerHasRated: Boolean(ownRating),
			viewerRating: ownRating?.rating ?? null,
		},
	};
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
						orderBy: [{ position: "asc" }, { idSong: "asc" }],
						select: { idSong: true },
					},
				},
			},
		},
	});
	if (!room) return null;
	const current = room.playlistSource.songs.map((s) => s.idSong);
	return roomState.syncQueueOrder(roomId, current);
}

async function getRoomStatus(roomId) {
	const room = await prisma.room.findUnique({
		where: { id: roomId },
		select: { id: true, status: true },
	});
	return room;
}

/**
 * Califica al anfitrión de una sala (TS-11).
 *
 * Solo quien participa en la sala puede calificar, y una sola vez por sala: lo
 * garantiza la PK `[id_room, id_rater, id_host]` de `host_rating`, que el
 * `P2002` traduce a `409`. El anfitrión no califica a nadie, ni siquiera a
 * sí mismo.
 */
async function rateHost({ roomId, raterId, rating }) {
	if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
		throw httpError(
			400,
			"La calificación tiene que ser un número entero entre 1 y 5.",
			"INVALID_RATING",
			{ rating },
		);
	}

	const room = await prisma.room.findUnique({
		where: { id: roomId },
		select: { id: true },
	});

	if (!room) {
		throw httpError(404, "La sala no existe.", "ROOM_NOT_FOUND");
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
			"Solo podés calificar dentro de una sala de la que participás.",
			"RATER_NOT_IN_ROOM",
		);
	}

	if (!hostMember) {
		throw httpError(404, "La sala no tiene anfitrión.", "ROOM_HOST_NOT_FOUND");
	}

	if (hostMember.idUser === raterId) {
		throw httpError(
			403,
			"El anfitrión no puede calificar a nadie.",
			"CANNOT_RATE_HOST",
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
		if (error.code === "P2002") {
			throw httpError(
				409,
				"Ya calificaste al anfitrión de esta sala.",
				"HOST_ALREADY_RATED",
			);
		}
		throw error;
	}
}

/**
 * Promedio de calificación de un anfitrión, leído de la vista `host_avg_rating`
 * (la misma que usa el listado). Viene como Decimal de Postgres, o sea string.
 */
async function getHostAvgRating(hostId) {
	const rows = await prisma.$queryRaw`
		SELECT avg_rating FROM host_avg_rating WHERE id_host = ${hostId}
	`;

	return rows.length ? Number(rows[0].avg_rating) : 0;
}

module.exports = {
	listRooms,
	listMyRooms,
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
	rateHost,
	getHostAvgRating,
};
