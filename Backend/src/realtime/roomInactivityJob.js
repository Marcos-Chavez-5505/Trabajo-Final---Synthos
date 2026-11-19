// Job periódico de inactividad: expulsa a los invitados que no están
// conectados cuando la sala lleva demasiado tiempo OFFLINE.
//
// La anfitriona NUNCA se expulsa: las salas son persistentes por diseño y la
// consulta filtra `role = 'host'`. Tampoco se cierra la sala ni se inserta en
// `RoomKicked`; se reutiliza la salida normal (`roomService.leaveRoom`).
const prisma = require("../prisma/prismaClient");
const roomService = require("../services/room.service");
const roomLive = require("../realtime/roomLive");
const roomCards = require("../realtime/roomCards");
const presence = require("../realtime/presence");

const DEFAULT_INTERVAL_MS = 60_000;

let intervalHandle = null;
let running = false;

/**
 * De los miembros persistidos, los que se pueden expulsar: invitados que no
 * están presentes. La anfitriona se descarta siempre, esté o no conectada.
 */
function selectExpellableMembers(members, onlineUserIds) {
	const online = new Set(onlineUserIds.map(String));

	return members
		.filter((member) => member.role !== "host")
		.filter((member) => !online.has(String(member.idUser)))
		.map((member) => member.idUser);
}

async function expelAbsentGuests(roomId, io) {
	const members = await prisma.roomMember.findMany({
		where: { idRoom: roomId },
		select: { idUser: true, role: true },
	});

	const targets = selectExpellableMembers(
		members,
		presence.roomOnlineUsers(roomId),
	);

	for (const userId of targets) {
		await roomService.leaveRoom(userId, roomId);
	}

	if (targets.length > 0) {
		const room = await roomService.getRoomWithMembers(roomId);
		io?.to(`room:${roomId}`).emit("room:members", room?.members ?? []);
		// `membersCount` cambió: el lobby tiene que refrescar la tarjeta.
		roomCards.notifyRoomCardChanged(roomId);
	}

	return targets;
}

async function runRoomInactivityPass(io) {
	const rooms = await prisma.room.findMany({
		where: { status: { not: "cerrada" } },
		select: {
			id: true,
			members: { where: { role: "host" }, select: { idUser: true } },
		},
	});

	const expired = [];

	for (const room of rooms) {
		const hostId = room.members?.[0]?.idUser ?? null;

		if (hostId !== null) roomLive.registerRoomHost(room.id, hostId);

		roomLive.syncOfflineSince(room.id);

		if (roomLive.shouldExpel(room.id)) expired.push(room.id);
	}

	const expelled = [];

	for (const roomId of expired) {
		expelled.push(...(await expelAbsentGuests(roomId, io)));
	}

	return { expired, expelled };
}

function startRoomInactivityJob({ io, intervalMs = DEFAULT_INTERVAL_MS } = {}) {
	if (intervalHandle) return intervalHandle;

	const run = () => {
		if (running) return;

		running = true;
		runRoomInactivityPass(io)
			.catch((error) => {
				console.error("[Salas] Error en el job de inactividad:", error);
			})
			.finally(() => {
				running = false;
			});
	};

	intervalHandle = setInterval(run, intervalMs);
	intervalHandle.unref?.();

	return intervalHandle;
}

function stopRoomInactivityJob() {
	if (!intervalHandle) return;

	clearInterval(intervalHandle);
	intervalHandle = null;
}

module.exports = {
	startRoomInactivityJob,
	stopRoomInactivityJob,
};
