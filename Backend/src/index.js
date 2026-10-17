require("dotenv").config();

const http = require("node:http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const app = require("./app");
const roomService = require("./services/room.service");

const PORT = process.env.PORT || 3000;

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
	socket.join(`user:${userId}`);
	console.log(`[Socket] Usuario ${userId} conectado (socket ${socket.id})`);

	// Unirse a un canal de sala (solo si es miembro)
	socket.on("join-room", async (roomId) => {
		const id = Number(roomId);
		if (!Number.isInteger(id) || id <= 0) {
			return socket.emit("error", { message: "Id de sala inválido." });
		}

		try {
			const isMember = await roomService.isRoomMember(id, userId);
			if (!isMember) {
				return socket.emit("error", {
					message: "No sos miembro de esta sala.",
				});
			}

			socket.join(`room:${id}`);
			console.log(`[Socket] Usuario ${userId} se unió a room:${id}`);
			socket.emit("joined-room", { roomId: id });
		} catch (error) {
			socket.emit("error", { message: "Error al unirse a la sala." });
		}
	});

	socket.on("leave-room", (roomId) => {
		const id = Number(roomId);
		if (!Number.isInteger(id) || id <= 0) return;
		socket.leave(`room:${id}`);
		console.log(`[Socket] Usuario ${userId} salió de room:${id}`);
	});

	socket.on("disconnect", () => {
		console.log(`[Socket] Usuario ${userId} desconectado (socket ${socket.id})`);
	});
});

app.set("io", io);

httpServer.listen(PORT, () => {
	console.log(`Servidor ejecutándose en puerto ${PORT}`);
});