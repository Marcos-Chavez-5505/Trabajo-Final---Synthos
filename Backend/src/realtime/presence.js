// Presencia por sala: quién está conectado ahora en cada room:<id>.
//
// Un mismo usuario puede tener N sockets (pestañas, mobile + web). Contamos
// por userId y no por socket: si cierra una pestaña, sigue online hasta que
// cierra todas.
//
// Gracia de reconexión: cuando se va el último socket de un usuario no se lo
// saca en el acto. Queda con `count: 0` y un timer de `graceMs`; si vuelve
// antes, el timer se cancela y la presencia no cambia (ni se emite nada). Es
// lo que evita que la tarjeta de sala parpadee en cada reconexión.
//
//   onlineByRoom: Map<roomId (number), Map<userId (string), {
//     count, joinedAt, lastSeenAt, timer
//   }>>
const onlineByRoom = new Map();

const DEFAULT_GRACE_MS = 60_000;

let graceMs = DEFAULT_GRACE_MS;

// Gancho único para consumidores del estado (pausa por anfitriona ausente,
// tarjetas de la Fase 4). No reemplaza a `room:online`: ese evento solo sale
// cuando cambia el listado visible.
const listeners = new Set();

/**
 * Ajusta la gracia de reconexión.
 *
 * @param {{ graceMs?: number }} [options]
 */
function configurePresence({ graceMs: nextGraceMs } = {}) {
	if (Number.isFinite(nextGraceMs) && nextGraceMs >= 0) graceMs = nextGraceMs;
}

/**
 * Suscribe a los cambios de presencia. Recibe
 * `{ roomId, userId, present, reason }` con `reason` en `joined`,
 * `reconnected`, `disconnected` o `grace-expired`.
 *
 * @returns {() => void} desuscripción
 */
function onPresenceChange(listener) {
	listeners.add(listener);

	return () => listeners.delete(listener);
}

function notifyPresenceChange(event) {
	listeners.forEach((listener) => listener(event));
}

function roomOnlineUsers(roomId) {
	const map = onlineByRoom.get(roomId);
	return map ? [...map.keys()] : [];
}

function emitOnline(io, roomId) {
	io.to(`room:${roomId}`).emit("room:online", {
		roomId,
		userIds: roomOnlineUsers(roomId),
	});
}

function addPresence(io, socket, roomId) {
	const id = Number(roomId);
	if (!onlineByRoom.has(id)) onlineByRoom.set(id, new Map());

	const users = onlineByRoom.get(id);
	const userId = String(socket.user.sub);
	const entry = users.get(userId);

	if (entry) {
		// Volvió dentro de la gracia: se cancela la salida programada.
		const wasExpiring = Boolean(entry.timer);

		if (entry.timer) {
			clearTimeout(entry.timer);
			entry.timer = null;
		}

		entry.count += 1;
		entry.lastSeenAt = Date.now();

		if (wasExpiring) {
			notifyPresenceChange({
				roomId: id,
				userId,
				present: true,
				reason: "reconnected",
			});
		}
	} else {
		users.set(userId, {
			count: 1,
			joinedAt: Date.now(),
			lastSeenAt: Date.now(),
			timer: null,
		});
		emitOnline(io, id);
		notifyPresenceChange({
			roomId: id,
			userId,
			present: true,
			reason: "joined",
		});
	}

	if (!socket.data.rooms) socket.data.rooms = new Set();
	socket.data.rooms.add(id);
}

function removePresence(io, socket, roomId) {
	const id = Number(roomId);
	const users = onlineByRoom.get(id);
	if (!users) return;

	const userId = String(socket.user.sub);
	const entry = users.get(userId);
	if (!entry) return;

	entry.count = Math.max(0, entry.count - 1);
	entry.lastSeenAt = Date.now();
	socket.data.rooms?.delete(id);

	// Mientras la sala lo siga mostrando no se emite: el payload no cambió.
	if (entry.count === 0 && !entry.timer) {
		entry.timer = setTimeout(() => expirePresence(io, id, userId), graceMs);

		// El usuario todavía está en la gracia, pero ya no tiene sockets: es el
		// disparador de la pausa por anfitriona ausente.
		notifyPresenceChange({
			roomId: id,
			userId,
			present: false,
			reason: "disconnected",
		});
	}
}

function expirePresence(io, roomId, userId) {
	const users = onlineByRoom.get(roomId);
	const entry = users?.get(userId);
	if (!entry) return;

	// Defensivo: si reconectó, el timer se canceló en `addPresence`.
	if (entry.count > 0) {
		entry.timer = null;
		return;
	}

	users.delete(userId);
	if (users.size === 0) onlineByRoom.delete(roomId);

	emitOnline(io, roomId);
	notifyPresenceChange({
		roomId,
		userId,
		present: false,
		reason: "grace-expired",
	});
}

function removeAllPresence(io, socket) {
	[...(socket.data.rooms ?? [])].forEach((roomId) => removePresence(io, socket, roomId));
}

module.exports = {
	roomOnlineUsers,
	addPresence,
	removePresence,
	removeAllPresence,
	onPresenceChange,
	configurePresence,
};
