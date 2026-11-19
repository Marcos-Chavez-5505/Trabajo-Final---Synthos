// Canal lobby de Socket.IO: los clientes que miran `/salas` se suscriben acá y
// reciben las actualizaciones de tarjetas.
//
// No se guarda ninguna lista propia de miembros: Socket.IO mantiene las salas y
// saca solo al socket en su `disconnect`. Por eso no queda estado huérfano al
// cerrar la pestaña.

const LOBBY_ROOM = "lobby";

function isAuthenticated(socket) {
	return Boolean(socket?.user?.sub);
}

/**
 * Registra los handlers del lobby en un socket ya autenticado por el middleware
 * JWT de `index.js`. El chequeo se repite por defensa: un socket sin `user` no
 * debe entrar ni siquiera si el middleware cambia.
 */
function registerLobbyHandlers(socket) {
	socket.on("join-lobby", () => {
		if (!isAuthenticated(socket)) {
			socket.emit("error", { message: "Token no proporcionado." });
			return;
		}

		socket.join(LOBBY_ROOM);
		socket.emit("joined-lobby");
	});

	socket.on("leave-lobby", () => {
		socket.leave(LOBBY_ROOM);
	});
}

module.exports = { LOBBY_ROOM, registerLobbyHandlers };
