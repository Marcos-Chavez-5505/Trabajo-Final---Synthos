require("dotenv").config();

const http = require("node:http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const app = require("./app");
const roomService = require("./services/room.service");
const presence = require("./realtime/presence");
const roomLive = require("./realtime/roomLive");
const roomInactivityJob = require("./realtime/roomInactivityJob");
const roomExpulsions = require("./realtime/roomExpulsions");
const roomGenres = require("./services/roomGenres.service");
const roomCards = require("./realtime/roomCards");
const { registerLobbyHandlers } = require("./realtime/lobby");

const PORT = process.env.PORT || 3000;

// Gracia de reconexión de la presencia (ver realtime/presence.js). Con 0 el
// socket sale de la presencia apenas se desconecta, que es lo útil en pruebas.
presence.configurePresence({
	graceMs: Number(process.env.ROOM_PRESENCE_GRACE_MS) || undefined,
});

// Estado en vivo de las salas (playback + anfitriona presente) y tiempos del
// job de inactividad. Vacío = default documentado en .env.example.
roomLive.configureRoomLive({
	hostOfflinePauseMs:
		Number(process.env.ROOM_HOST_OFFLINE_PAUSE_MS) || undefined,
	inactiveExpelMs: Number(process.env.ROOM_INACTIVE_EXPEL_MS) || undefined,
});

// Cuánto se recuerda en memoria que una expulsión fue por inactividad (solo
// para el mensaje de la UI). Default 24 h; `0` lo desactiva (por eso no se usa
// `|| undefined`, que descartaría el 0).
const expulsionMarkerTtlMs = process.env.ROOM_EXPULSION_MARKER_TTL_MS
	? Number(process.env.ROOM_EXPULSION_MARKER_TTL_MS)
	: undefined;

roomExpulsions.configureRoomExpulsions({ markerTtlMs: expulsionMarkerTtlMs });

// Red de seguridad de la caché de géneros por sala (default 5 min).
roomGenres.configureRoomGenres({
	ttlMs: Number(process.env.ROOM_GENRES_CACHE_TTL_MS) || undefined,
});

// Agrupación de eventos de tarjeta hacia el lobby (default 1.5 s).
roomCards.configureRoomCards({
	debounceMs: Number(process.env.ROOM_CARD_DEBOUNCE_MS) || undefined,
});

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
	cors: {
		origin: process.env.FRONTEND_URL || "http://localhost:5173",
		methods: ["GET", "POST"],
		credentials: true,
	},
});

// Auth JWT en el handshake de Socket.IO
io.use((socket, next) => {
	const token =
		socket.handshake.auth?.token ||
		socket.handshake.query?.token ||
		(socket.handshake.headers?.authorization?.startsWith("Bearer ")
			? socket.handshake.headers.authorization.split(" ")[1]
			: null);

	if (!token) {
		return next(new Error("Token no proporcionado."));
	}

	try {
		const payload = jwt.verify(token, process.env.JWT_SECRET);
		socket.user = payload;
		socket.data.user = payload;
		next();
	} catch (error) {
		return next(new Error("Token inválido o expirado."));
	}
});

// Cuando un usuario se conecta, se une automáticamente a su "sala personal"
io.on("connection", (socket) => {
	const userId = socket.user.sub;
	socket.data.rooms = new Set();
	socket.join(`user:${userId}`);
	registerLobbyHandlers(socket);
	console.log(`[Socket] Usuario ${userId} conectado (socket ${socket.id})`);

	// Unirse a un canal de sala (solo si es miembro)
	socket.on("join-room", async (roomId) => {
		const id = Number(roomId);
		if (!Number.isInteger(id) || id <= 0) {
			return socket.emit("error", { message: "Id de sala inválido." });
		}

		try {
			const role = await roomService.getMemberRole(id, userId);
			if (!role) {
				// Mismo contrato que el 403 HTTP (`ROOM_ACCESS_LOST` + motivo):
				// el cliente lo usa para salir de la sala sin reintentar.
				const reason = await roomService.getRoomAccessLostReason(id, userId);

				return socket.emit("error", {
					roomId: id,
					code: "ROOM_ACCESS_LOST",
					reason,
					message: "No sos miembro de esta sala.",
				});
			}

			// Se cachea para poder detectar su desconexión y pausar la sala.
			if (role === "host") roomLive.registerRoomHost(id, userId);

			socket.join(`room:${id}`);
			console.log(`[Socket] Usuario ${userId} se unió a room:${id}`);
			socket.emit("joined-room", { roomId: id });
			presence.addPresence(io, socket, id);
		} catch (error) {
			socket.emit("error", { message: "Error al unirse a la sala." });
		}
	});

	socket.on("leave-room", (roomId) => {
		const id = Number(roomId);
		if (!Number.isInteger(id) || id <= 0) return;
		socket.leave(`room:${id}`);
		console.log(`[Socket] Usuario ${userId} salió de room:${id}`);
		presence.removePresence(io, socket, id);
	});

	socket.on("disconnect", () => {
		console.log(
			`[Socket] Usuario ${userId} desconectado (socket ${socket.id})`,
		);
		presence.removeAllPresence(io, socket);
	});
});

app.set("io", io);

roomLive.initRoomLive(io);
roomCards.initRoomCards(io);
roomInactivityJob.startRoomInactivityJob({
	io,
	intervalMs: Number(process.env.ROOM_INACTIVITY_JOB_INTERVAL_MS) || undefined,
});

httpServer.listen(PORT, "0.0.0.0", () => {
	console.log(`Servidor ejecutándose en puerto ${PORT}`);
});

// Apagado ordenado: el job no debe quedar corriendo ni con un tick a medias.
function shutdown() {
	roomInactivityJob.stopRoomInactivityJob();
	roomCards.shutdownRoomCards();
	roomLive.shutdownRoomLive();
	io.close();
	httpServer.close(() => process.exit(0));
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
