const prisma = require("../prisma/prismaClient");
const roomState = require("../realtime/roomState");
const roomLive = require("../realtime/roomLive");
const roomGenres = require("./roomGenres.service");
const presence = require("../realtime/presence");
const roomExpulsions = require("../realtime/roomExpulsions");
const crypto = require("node:crypto");
const { Prisma } = require("@prisma/client");
const { httpError } = require("../utils/errors");

const LIKE_WILDCARDS = /[\\%_]/g;

// Tope de avatares que muestra la tarjeta de sala (la anfitriona va aparte).
const MAX_CARD_MEMBERS = 9;

// Tamaño fijo del listado público de salas.
const ROOM_PAGE_SIZE = 12;

// Namespace de los advisory locks por usuario que serializan create/join. Dos
// pedidos simultáneos del mismo usuario (dos pestañas, web + mobile) se
// resuelven uno después del otro: el segundo ve la membresía del primero y
// aplica el 409 o el auto-leave que corresponde.
const ROOM_USER_LOCK_NAMESPACE = 20261122;

/**
 * Membresía actual del usuario. Con la regla de una sola sala activa hay como
 * máximo una fila. Si quedó una fila vieja de una sala cerrada, se descarta
 * para no bloquear al usuario.
 *
 * @param {number} userId
 * @param {object} [client] `prisma` o el `tx` de una transacción.
 */
async function findCurrentMembership(userId, client = prisma) {
	const member = await client.roomMember.findFirst({
		where: { idUser: userId },
		select: {
			idRoom: true,
			role: true,
			room: { select: { status: true, name: true } },
		},
	});

	if (!member) return null;

	if (member.room.status === "cerrada") {
		await client.roomMember.deleteMany({
			where: { idRoom: member.idRoom, idUser: userId },
		});
		return null;
	}

	return member;
}

/**
 * 409 con el código que corresponde según el rol de la membresía actual.
 * El host no puede entrar a otra sala sin cerrar la suya (D24); un invitado
 * puede cambiar de sala, pero `joinRoom` lo resuelve saliendo de la anterior.
 */
function currentRoomError(member) {
	if (member.role === "host") {
		return httpError(
			409,
			`Estás administrando «${member.room.name}». Cerrala para entrar o crear otra.`,
			"ROOM_ALREADY_HOSTING",
		);
	}

	return httpError(
		409,
		`Ya estás en «${member.room.name}». Salí de esa para entrar a otra.`,
		"ROOM_ALREADY_IN_ROOM",
	);
}

function isUniqueViolationOn(error, field) {
	if (error?.code !== "P2002") return false;

	const target = error.meta?.target;
	const values = Array.isArray(target) ? target : [target];

	return values.some((value) => String(value).includes(field));
}

function toLikePattern(query) {
	return `%${String(query).replace(LIKE_WILDCARDS, (char) => `\\${char}`)}%`;
}

function buildRoomListQuery({ query, sort, order, onlyMine, userId, roomId }) {
	const direction = order === "desc" ? Prisma.raw("DESC") : Prisma.raw("ASC");
	const orderBy =
		sort === "rating"
			? Prisma.sql`avg_rating ${direction}, room.name ASC`
			: Prisma.sql`room.name ${direction}`;

	const textFilter = query
		? Prisma.sql`AND (
			room.name ILIKE ${toLikePattern(query)} ESCAPE '\\'
			OR host_user.username ILIKE ${toLikePattern(query)} ESCAPE '\\'
		)`
		: Prisma.empty;

	const roomFilter = roomId
		? Prisma.sql`AND room.id = ${Number(roomId)}`
		: Prisma.empty;

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
			host_user.picture_url AS host_picture_url,
			COALESCE(host_avg_rating.avg_rating, 0) AS avg_rating,
			COALESCE(ratings_count.total, 0) AS ratings_count,
			COALESCE(members_count.total, 0) AS members_count,
			COALESCE(songs_count.total, 0) AS songs_count
		FROM room
		LEFT JOIN LATERAL (
			SELECT u.id, u.username, u.picture_url
			FROM room_member rm
			JOIN "user" u ON u.id = rm.id_user
			WHERE rm.id_room = room.id AND rm.role = 'host'
			LIMIT 1
		) AS host_user ON true
		LEFT JOIN host_avg_rating
			ON host_avg_rating.id_host = host_user.id
		LEFT JOIN LATERAL (
			SELECT COUNT(DISTINCT hr.id_rater)::int AS total
			FROM host_rating hr
			WHERE hr.id_host = host_user.id
		) AS ratings_count ON true
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
		${roomFilter}
		ORDER BY ${orderBy}
	`;
}

async function listRooms({
	query = "",
	sort = "name",
	order = "asc",
	includeMembers = false,
	page = 1,
} = {}) {
	const requestedPage = Number.isInteger(page) && page >= 1 ? page : 1;
	const baseQuery = buildRoomListQuery({
		query,
		sort,
		order,
		onlyMine: false,
	});

	const [countRows, rows] = await prisma.$transaction([
		prisma.$queryRaw(
			Prisma.sql`SELECT COUNT(*)::int AS total FROM (${baseQuery}) AS rooms`,
		),
		prisma.$queryRaw(
			Prisma.sql`${baseQuery} LIMIT ${ROOM_PAGE_SIZE} OFFSET ${(requestedPage - 1) * ROOM_PAGE_SIZE}`,
		),
	]);

	const total = countRows[0]?.total ?? 0;
	const totalPages = Math.max(1, Math.ceil(total / ROOM_PAGE_SIZE));
	const pageNumber = Math.min(requestedPage, totalPages);

	const pageRows =
		pageNumber === requestedPage
			? rows
			: await prisma.$queryRaw(
					Prisma.sql`${baseQuery} LIMIT ${ROOM_PAGE_SIZE} OFFSET ${(pageNumber - 1) * ROOM_PAGE_SIZE}`,
				);

	return {
		items: await enrichRoomRows(pageRows, { includeMembers }),
		total,
		page: pageNumber,
		pageSize: ROOM_PAGE_SIZE,
		totalPages,
	};
}

async function listMyRooms(userId, { query = "" } = {}) {
	const rows = await prisma.$queryRaw(
		buildRoomListQuery({
			query,
			sort: "name",
			order: "asc",
			onlyMine: true,
			userId,
		}),
	);

	return enrichRoomRows(rows);
}

/**
 * Arma una fila del listado completa: presencia (`members`), `is_live` y
 * `genres`. La usan el listado y el evento `room:card-updated` para que la
 * tarjeta se construya de una sola forma.
 */
async function enrichRoomRows(rows, { includeMembers = true } = {}) {
	const withMembers = includeMembers ? await attachRoomMembers(rows) : rows;

	return roomGenres.attachRoomGenres(withLiveState(withMembers));
}

/**
 * Fila completa de UNA sala con la misma visibilidad que el listado (activa y
 * pública). `null` si la sala no existe, está cerrada o es privada: el lobby lo
 * interpreta como "sacá la tarjeta".
 */
async function getRoomCardById(roomId) {
	const rows = await prisma.$queryRaw(
		buildRoomListQuery({
			query: "",
			sort: "name",
			order: "asc",
			onlyMine: false,
			roomId,
		}),
	);

	const enriched = await enrichRoomRows(rows, { includeMembers: true });

	return enriched[0] ?? null;
}

/**
 * `is_live` no se persiste: sale del playback y de la presencia de la
 * anfitriona en memoria. Se mezcla acá para que el listado y `/mine` usen la
 * misma regla.
 */
function withLiveState(rows) {
	return rows.map((row) => ({
		...row,
		is_live: roomLive.isRoomPlaying(row.id, row.host_id),
	}));
}

/**
 * Agrega a cada sala del listado los invitados **presentes** (sin la
 * anfitriona), en orden de antigüedad de membresía.
 *
 * Es una sola consulta para todas las salas: nada de N+1. La presencia se
 * resuelve en memoria (`realtime/presence.js`) y `membersCount` sigue saliendo
 * de la membresía persistida, así que puede ser mayor que `members.length`.
 */
async function attachRoomMembers(rows) {
	if (rows.length === 0) return rows;

	const memberships = await prisma.roomMember.findMany({
		where: {
			idRoom: { in: rows.map((row) => row.id) },
			role: { not: "host" },
		},
		select: {
			idRoom: true,
			user: { select: { id: true, username: true, pictureUrl: true } },
		},
		orderBy: [{ joinDate: "asc" }, { idUser: "asc" }],
	});

	const usersByRoom = new Map();
	for (const membership of memberships) {
		const list = usersByRoom.get(membership.idRoom);
		if (list) list.push(membership.user);
		else usersByRoom.set(membership.idRoom, [membership.user]);
	}

	return rows.map((row) => {
		const online = new Set(presence.roomOnlineUsers(row.id).map(String));

		const members = (usersByRoom.get(row.id) ?? [])
			.filter((user) => online.has(String(user.id)))
			.slice(0, MAX_CARD_MEMBERS)
			.map((user) => ({
				id: user.id,
				username: user.username,
				avatarUrl: user.pictureUrl ?? null,
			}));

		return { ...row, members };
	});
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

function safeRoom(room) {
	if (!room) return room;

	const rest = { ...room };

	if (rest.playlistSource && Array.isArray(rest.playlistSource.songs)) {
		rest.playlistSource = {
			...rest.playlistSource,
			songs: roomState.orderSongsByQueue(rest.id, rest.playlistSource.songs),
		};
	}

	return rest;
}

async function createRoom(hostId, { name, description, playlistId, isPrivate }) {
	const playlist = await prisma.playlist.findUnique({
		where: { id: playlistId },
		include: {
			songs: { select: { idSong: true } },
			members: { select: { idUser: true } },
		},
	});

	if (!playlist) {
		throw httpError(404, "La playlist no existe.", "PLAYLIST_NOT_FOUND");
	}

	const isCreator = playlist.idCreator === hostId;
	const isMember = playlist.members.some((m) => m.idUser === hostId);

	if (!isCreator && !isMember) {
		throw httpError(
			403,
			"La playlist no te pertenece.",
			"NOT_PLAYLIST_MEMBER",
		);
	}

	if (playlist.songs.length === 0) {
		throw httpError(
			400,
			"La playlist no tiene canciones.",
			"INVALID_ROOM_PLAYLIST",
		);
	}

	// Chequeo temprano para no generar un código ni abrir una transacción si el
	// usuario ya está en una sala. La transacción lo vuelve a comprobar bajo el
	// advisory lock: esta lectura puede quedar vieja.
	const current = await findCurrentMembership(hostId);
	if (current) throw currentRoomError(current);

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

	try {
		const created = await prisma.$transaction(async (tx) => {
			await tx.$queryRaw`
				SELECT 1 AS locked
				FROM (SELECT pg_advisory_xact_lock(${ROOM_USER_LOCK_NAMESPACE}, ${hostId})) AS lock
			`;

			const lockedCurrent = await findCurrentMembership(hostId, tx);
			if (lockedCurrent) throw currentRoomError(lockedCurrent);

			const room = await tx.room.create({
				data: {
					code,
					name,
					description: description ?? null,
					idPlaylistSource: playlistId,
					isPrivate: isPrivate ?? false,
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

		return safeRoom({
			...created,
			hostAvgRating: await getHostAvgRating(hostId),
			hostRatingsCount: await getHostRatingsCount(hostId),
			viewerHasRated: false,
		});
	} catch (error) {
		// Carrera con otro create/join del mismo usuario: el índice único es el
		// árbitro final. Se traduce al 409 de negocio, no al P2002 crudo.
		if (isUniqueViolationOn(error, "id_user")) {
			const existing = await findCurrentMembership(hostId);

			throw existing
				? currentRoomError(existing)
				: httpError(
						409,
						"Ya estás en una sala. Salí de esa para crear otra.",
						"ROOM_ALREADY_IN_ROOM",
					);
		}

		throw error;
	}
}

async function joinRoom(userId, { code }) {
	const room = await prisma.room.findUnique({
		where: { code },
		include: {
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
		throw httpError(404, "Sala no encontrada.", "ROOM_NOT_FOUND");
	}

	if (room.status === "cerrada") {
		throw httpError(400, "La sala está cerrada.", "ROOM_CLOSED");
	}

	// Expulsión persistente: si el usuario fue sacado de esta sala, no puede
	// volver a entrar con el código, ni siquiera reconectándose.
	const wasKicked = await prisma.roomKicked.findUnique({
		where: { idRoom_idUser: { idRoom: room.id, idUser: userId } },
		select: { idUser: true },
	});

	if (wasKicked) {
		throw httpError(
			403,
			"Te expulsaron de esta sala. No podés volver a entrar.",
			"ROOM_KICKED",
		);
	}

	try {
		const result = await prisma.$transaction(async (tx) => {
			// Serializa create/join del mismo usuario y, después, los joins de
			// distintos usuarios a esta sala (capacidad).
			await tx.$queryRaw`
				SELECT 1 AS locked
				FROM (SELECT pg_advisory_xact_lock(${ROOM_USER_LOCK_NAMESPACE}, ${userId})) AS lock
			`;
			await tx.$queryRaw`
				SELECT id FROM "room" WHERE id = ${room.id} FOR UPDATE
			`;

			const currentRoom = await tx.room.findUnique({
				where: { id: room.id },
				include: { members: { select: { idUser: true } } },
			});

			if (!currentRoom || currentRoom.status === "cerrada") {
				throw httpError(400, "La sala está cerrada.", "ROOM_CLOSED");
			}

			if (currentRoom.members.some((m) => m.idUser === userId)) {
				return {
					room: safeRoom(
						await tx.room.findUnique({
							where: { id: room.id },
							include: ROOM_INCLUDE,
						}),
					),
					alreadyMember: true,
					leftRoomId: null,
				};
			}

			const current = await findCurrentMembership(userId, tx);
			let leftRoomId = null;

			if (current) {
				// El host no puede estar en otra sala: primero debe cerrar la
				// suya. Un invitado cambia de sala: se va de la anterior.
				if (current.role === "host") throw currentRoomError(current);

				leftRoomId = current.idRoom;
				await tx.roomMember.deleteMany({
					where: { idRoom: current.idRoom, idUser: userId },
				});
			}

			if (currentRoom.members.length >= currentRoom.maxCapacity) {
				throw httpError(409, "La sala está llena.", "ROOM_FULL");
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
				leftRoomId,
			};
		});

		// Volvió a entrar por su cuenta: ya no corresponde etiquetarlo como
		// expulsado por inactividad. Si venía de otra sala, su marcador tampoco
		// aplica.
		roomExpulsions.clearInactivityExpulsion(room.id, userId);
		if (result.leftRoomId) {
			roomExpulsions.clearInactivityExpulsion(result.leftRoomId, userId);
		}

		return result;
	} catch (error) {
		// El índice único (o la PK) es el árbitro final de las carreras. El
		// advisory lock hace que casi nunca se llegue acá, pero dos procesos o
		// un insert externo todavía pueden provocarlo.
		if (error?.code === "P2002") {
			const existing = await findCurrentMembership(userId);

			if (existing?.idRoom === room.id) {
				return {
					room: safeRoom(
						await prisma.room.findUnique({
							where: { id: room.id },
							include: ROOM_INCLUDE,
						}),
					),
					alreadyMember: true,
					leftRoomId: null,
				};
			}

			throw existing
				? currentRoomError(existing)
				: httpError(
						409,
						"Ya estás en una sala. Salí de esa para entrar a otra.",
						"ROOM_ALREADY_IN_ROOM",
					);
		}

		throw error;
	}
}

async function leaveRoom(userId, roomId) {
	const room = await prisma.room.findUnique({
		where: { id: roomId },
		include: { members: { select: { idUser: true, role: true } } },
	});

	if (!room) {
		throw httpError(404, "Sala no encontrada.", "ROOM_NOT_FOUND");
	}

	const member = room.members.find((m) => m.idUser === userId);
	if (!member) {
		throw httpError(404, "No sos miembro de esta sala.", "ROOM_NOT_MEMBER");
	}

	// Salida voluntaria (o por cierre de la anfitriona): el marcador de
	// inactividad deja de aplicar. El job vuelve a marcar después de llamar
	// acá, así que su expulsión conserva el motivo.
	roomExpulsions.clearInactivityExpulsion(roomId, userId);

	if (member.role === "host") {
		const memberIds = room.members.map((m) => m.idUser);

		// Cerrar la sala libera a todos: sin membresías no hay sala "actual".
		await prisma.$transaction([
			prisma.room.update({
				where: { id: roomId },
				data: { status: "cerrada" },
			}),
			prisma.roomMember.deleteMany({ where: { idRoom: roomId } }),
		]);

		return { closed: true, memberIds };
	}

	// `deleteMany` en vez de `delete`: si otra pestaña ya salió, la salida es
	// idempotente y no revienta con P2025.
	await prisma.roomMember.deleteMany({
		where: { idRoom: roomId, idUser: userId },
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

async function getMemberRole(roomId, userId) {
	const member = await prisma.roomMember.findUnique({
		where: { idRoom_idUser: { idRoom: roomId, idUser: userId } },
		select: { role: true },
	});

	return member?.role ?? null;
}

/**
 * Motivo por el que un usuario perdió el acceso a una sala (o nunca lo tuvo).
 * Es solo para el mensaje de la UI:
 *  - `kicked`: el anfitrión lo expulsó (veto persistente en `room_kicked`);
 *  - `inactivity`: lo expulsó el job (marcador en memoria, best-effort);
 *  - `not_member`: cualquier otro caso.
 *
 * @returns {Promise<"kicked"|"inactivity"|"not_member">}
 */
async function getRoomAccessLostReason(roomId, userId) {
	const kicked = await prisma.roomKicked.findUnique({
		where: { idRoom_idUser: { idRoom: roomId, idUser: userId } },
		select: { idUser: true },
	});

	if (kicked) return "kicked";

	if (roomExpulsions.wasExpelledByInactivity(roomId, userId)) {
		return "inactivity";
	}

	return "not_member";
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

	if (room.status === "cerrada") return { closed: true };

	const isMember = room.members.some((m) => m.idUser === userId);
	if (!isMember) return { forbidden: true };

	const hostId = room.members.find((m) => m.role === "host")?.idUser ?? null;

	const ownRating = hostId
		? await prisma.hostRating.findUnique({
				where: {
					idRoom_idRater_idHost: {
						idRoom: roomId,
						idRater: userId,
						idHost: hostId,
					},
				},
				select: { rating: true },
			})
		: null;

	return {
		room: {
			...safeRoom(room),
			hostAvgRating: hostId ? await getHostAvgRating(hostId) : 0,
			hostRatingsCount: hostId ? await getHostRatingsCount(hostId) : 0,
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
		throw httpError(404, "Sala no encontrada.", "ROOM_NOT_FOUND");
	}

	const host = room.members.find(
		(m) => m.idUser === hostId && m.role === "host",
	);
	if (!host) {
		throw httpError(
			403,
			"No sos el anfitrión de esta sala.",
			"NOT_ROOM_HOST",
		);
	}

	const target = room.members.find((m) => m.idUser === targetUserId);
	if (!target) {
		throw httpError(
			404,
			"El usuario no es miembro de esta sala.",
			"ROOM_NOT_MEMBER",
		);
	}

	if (target.role === "host") {
		throw httpError(
			400,
			"El anfitrión no puede eliminarse a sí mismo.",
			"CANNOT_REMOVE_HOST",
		);
	}

	// Borrar de miembros e insertar en la lista negra de la sala en una sola
	// transacción: si el proceso muere entre medio, no queda un expulsado que
	// puede volver a entrar.
	await prisma.$transaction([
		prisma.roomMember.deleteMany({
			where: { idRoom: roomId, idUser: targetUserId },
		}),
		prisma.roomKicked.upsert({
			where: { idRoom_idUser: { idRoom: roomId, idUser: targetUserId } },
			create: { idRoom: roomId, idUser: targetUserId },
			update: {},
		}),
	]);

	return { kicked: targetUserId };
}

async function closeRoom(hostId, roomId) {
	const room = await prisma.room.findUnique({
		where: { id: roomId },
		include: { members: { select: { idUser: true, role: true } } },
	});

	if (!room) {
		throw httpError(404, "Sala no encontrada.", "ROOM_NOT_FOUND");
	}

	const host = room.members.find(
		(m) => m.idUser === hostId && m.role === "host",
	);
	if (!host) {
		throw httpError(
			403,
			"No sos el anfitrión de esta sala.",
			"NOT_ROOM_HOST",
		);
	}

	const memberIds = room.members.map((m) => m.idUser);

	// Cerrar la sala libera a todos: sin membresías no hay sala "actual".
	await prisma.$transaction([
		prisma.room.update({
			where: { id: roomId },
			data: { status: "cerrada" },
		}),
		prisma.roomMember.deleteMany({ where: { idRoom: roomId } }),
	]);

	return { closed: true, memberIds };
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
		select: { id: true, status: true, isPrivate: true },
	});
	return room;
}

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

async function getHostAvgRating(hostId) {
	const rows = await prisma.$queryRaw`
		SELECT avg_rating FROM host_avg_rating WHERE id_host = ${hostId}
	`;

	return rows.length ? Number(rows[0].avg_rating) : 0;
}

async function getHostRatingsCount(hostId) {
	const rows = await prisma.$queryRaw`
		SELECT COUNT(DISTINCT id_rater)::int AS total
		FROM host_rating
		WHERE id_host = ${hostId}
	`;

	return rows.length ? Number(rows[0].total) : 0;
}

module.exports = {
	listRooms,
	listMyRooms,
	getRoomCardById,
	createRoom,
	joinRoom,
	leaveRoom,
	getRoomWithMembers,
	isRoomMember,
	getMemberRole,
	getRoomHost,
	getRoomByIdForMember,
	getRoomAccessLostReason,
	kickMember,
	closeRoom,
	getHostIdOfRoom,
	getNonHostMemberIds,
	getPlaylistSongsOfRoom,
	getRoomStatus,
	rateHost,
	getHostAvgRating,
	getHostRatingsCount,
};