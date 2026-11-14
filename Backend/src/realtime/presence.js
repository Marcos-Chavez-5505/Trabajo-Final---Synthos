// Presencia por sala: quién está conectado ahora en cada room:<id>.
//
// Un mismo usuario puede tener N sockets (pestañas, mobile + web). Contamos
// por userId y no por socket: si cierra una pestaña, sigue online hasta que
// cierra todas.
//
//   onlineByRoom: Map<roomId (number), Map<userId (string), count (number)>>
const onlineByRoom = new Map();

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
	users.set(userId, (users.get(userId) ?? 0) + 1);
	if (!socket.data.rooms) socket.data.rooms = new Set();
	socket.data.rooms.add(id);
	emitOnline(io, id);
}

function removePresence(io, socket, roomId) {
	const id = Number(roomId);
	const users = onlineByRoom.get(id);
	if (!users) return;
	const userId = String(socket.user.sub);
	const next = (users.get(userId) ?? 0) - 1;
	if (next <= 0) users.delete(userId);
	else users.set(userId, next);
	if (users.size === 0) onlineByRoom.delete(id);
	socket.data.rooms?.delete(id);
	emitOnline(io, id);
}

function removeAllPresence(io, socket) {
	[...(socket.data.rooms ?? [])].forEach((roomId) => removePresence(io, socket, roomId));
}

module.exports = {
	roomOnlineUsers,
	addPresence,
	removePresence,
	removeAllPresence,
};