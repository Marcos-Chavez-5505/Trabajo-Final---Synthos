const roomService = require("../services/room.service");
const { validateSortType, validateOrderType, getId } = require("../utils/validation");
const roomState = require("../realtime/roomState");

async function getSortedRoom(req, res, next) {
	try {
		const sort = validateSortType(req.query.sort || "name");
		const order = validateOrderType(req.query.order || "asc");
		const query = typeof req.query.query === "string" ? req.query.query.trim() : "";

		const result = await roomService.listRooms({ query, sort, order });

		res.status(200).json(result);
	} catch (error) {
		next(error);
	}
}

async function getMyRooms(req, res, next) {
	try {
		const userId = req.user.sub;
		const query = typeof req.query.query === "string" ? req.query.query.trim() : "";

		const result = await roomService.listMyRooms(userId, { query });

		res.status(200).json(result);
	} catch (error) {
		next(error);
	}
}

async function createRoom(req, res, next) {
	try {
		const userId = req.user.sub;
		const { name, description, playlistId, isPrivate, password } = req.body || {};

		if (typeof name !== "string" || name.trim().length === 0) {
			return res.status(400).json({ status: "error", message: "El nombre es obligatorio." });
		}

		if (!Number.isInteger(playlistId) || playlistId <= 0) {
			return res.status(400).json({ status: "error", message: "La playlist es obligatoria." });
		}

		if (typeof isPrivate !== "boolean") {
			return res.status(400).json({ status: "error", message: "isPrivate debe ser boolean." });
		}

		if (isPrivate && (typeof password !== "string" || password.length < 4)) {
			return res.status(400).json({
				status: "error",
				message: "Las salas privadas requieren contraseña (mínimo 4 caracteres).",
			});
		}

		const room = await roomService.createRoom(userId, {
			name: name.trim(),
			description,
			playlistId,
			isPrivate,
			password,
		});

		// Emitir al room del socket (el usuario se une cuando interactúa con sockets)
		const io = req.app.get("io");
		if (io) {
			io.to(`room:${room.id}`).emit("room:members", room.members);
		}

		return res.status(201).json({ status: "success", room });
	} catch (error) {
		if (error.status) {
			return res.status(error.status).json({ status: "error", message: error.message });
		}
		next(error);
	}
}

async function joinRoom(req, res, next) {
	try {
		const userId = req.user.sub;
		const { code, password } = req.body || {};

		if (typeof code !== "string" || code.trim().length === 0) {
			return res.status(400).json({ status: "error", message: "El código es obligatorio." });
		}

		const result = await roomService.joinRoom(userId, {
			code: code.trim().toUpperCase(),
			password,
		});

		const io = req.app.get("io");
		if (io) {
			io.to(`room:${result.room.id}`).emit("room:members", result.room.members);
		}

		const status = result.alreadyMember ? 200 : 201;
		return res.status(status).json({ status: "success", room: result.room });
	} catch (error) {
		if (error.status) {
			return res.status(error.status).json({ status: "error", message: error.message });
		}
		next(error);
	}
}

async function leaveRoom(req, res, next) {
	try {
		const userId = req.user.sub;
		const roomId = Number(req.params.id);

		if (!Number.isInteger(roomId) || roomId <= 0) {
			return res.status(400).json({ status: "error", message: "Id inválido." });
		}

		const result = await roomService.leaveRoom(userId, roomId);

		const io = req.app.get("io");
		if (io) {
			if (result.closed) {
				roomState.deleteRoomState(roomId);
				io.to(`room:${roomId}`).emit("room:closed", { roomId });
			} else {
				const room = await roomService.getRoomWithMembers(roomId);
				io.to(`room:${roomId}`).emit("room:members", room?.members ?? []);
			}
		}

		return res.status(204).send();
	} catch (error) {
		if (error.status) {
			return res.status(error.status).json({ status: "error", message: error.message });
		}
		next(error);
	}
}

async function getRoomById(req, res, next) {
	try {
		const userId = req.user.sub;
		const roomId = Number(req.params.id);

		if (!Number.isInteger(roomId) || roomId <= 0) {
			return res.status(400).json({ status: "error", message: "Id inválido." });
		}

		const result = await roomService.getRoomByIdForMember(roomId, userId);

		if (result.notFound) {
			return res.status(404).json({ status: "error", message: "Sala no encontrada." });
		}

		if (result.forbidden) {
			return res.status(403).json({ status: "error", message: "No sos miembro de esta sala." });
		}

		const { passwordHash, ...roomSafe } = result.room;

		return res.status(200).json({ status: "success", room: roomSafe });
	} catch (error) {
		if (error.status) {
			return res.status(error.status).json({ status: "error", message: error.message });
		}
		next(error);
	}
}

async function kickMember(req, res, next) {
	try {
		const hostId = req.user.sub;
		const roomId = Number(req.params.id);
		const targetUserId = Number(req.params.userId);

		if (!Number.isInteger(roomId) || roomId <= 0 || !Number.isInteger(targetUserId) || targetUserId <= 0) {
			return res.status(400).json({ status: "error", message: "Id inválido." });
		}

		await roomService.kickMember(hostId, roomId, targetUserId);

		const io = req.app.get("io");
		if (io) {
			const room = await roomService.getRoomWithMembers(roomId);
			io.to(`room:${roomId}`).emit("room:members", room?.members ?? []);
			io.to(`user:${targetUserId}`).emit("room:kicked", { roomId });
		}

		return res.status(204).send();
	} catch (error) {
		if (error.status) {
			return res.status(error.status).json({ status: "error", message: error.message });
		}
		next(error);
	}
}

async function closeRoom(req, res, next) {
	try {
		const hostId = req.user.sub;
		const roomId = Number(req.params.id);

		if (!Number.isInteger(roomId) || roomId <= 0) {
			return res.status(400).json({ status: "error", message: "Id inválido." });
		}

		await roomService.closeRoom(hostId, roomId);

		const io = req.app.get("io");
		if (io) {
			roomState.deleteRoomState(roomId);
			io.to(`room:${roomId}`).emit("room:closed", { roomId });
		}

		return res.status(204).send();
	} catch (error) {
		if (error.status) {
			return res.status(error.status).json({ status: "error", message: error.message });
		}
		next(error);
	}
}

function computeRequired(noHostCount) {
	return Math.floor(noHostCount / 2) + 1;
}

async function postPlayback(req, res, next) {
	try {
		const userId = req.user.sub;
		const roomId = Number(req.params.id);
		const { action } = req.body || {};

		if (!Number.isInteger(roomId) || roomId <= 0) {
			return res.status(400).json({ status: "error", message: "Id inválido." });
		}

		if (!["play", "pause", "next", "stop"].includes(action)) {
			return res.status(400).json({
				status: "error",
				message: "Acción inválida. Debe ser play, pause, next o stop.",
			});
		}

		const room = await roomService.getRoomStatus(roomId);
		if (!room) {
			return res.status(404).json({ status: "error", message: "Sala no encontrada." });
		}

		const hostId = await roomService.getHostIdOfRoom(roomId);
		if (hostId !== userId) {
			return res.status(403).json({
				status: "error",
				message: "Solo el anfitrión puede controlar la reproducción.",
			});
		}

		const songs = await roomService.getPlaylistSongsOfRoom(roomId);
		if (!songs || songs.length === 0) {
			return res.status(400).json({ status: "error", message: "La sala no tiene canciones." });
		}

		const current = roomState.getRoomState(roomId).playback;
		let next;

		if (action === "play") {
			next = {
				songId: current.songId ?? songs[0],
				status: "playing",
				positionMs: current.positionMs,
			};
		} else if (action === "pause") {
			// `positionMs` es la posición congelada en el último `updatedAt`: mientras
			// suena, la posición real es esa más lo que pasó desde entonces. Sin
			// sumarlo, pausar reiniciaría la canción para todo el mundo.
			const elapsed = current.status === "playing" ? Date.now() - current.updatedAt : 0;
			next = { ...current, positionMs: current.positionMs + elapsed, status: "paused" };
		} else if (action === "stop") {
			next = { songId: null, status: "stopped", positionMs: 0 };
		} else if (action === "next") {
			const idx = songs.indexOf(current.songId);
			const nextIdx = idx === -1 ? 0 : (idx + 1) % songs.length;
			next = { songId: songs[nextIdx], status: "playing", positionMs: 0 };
		}

		const updated = roomState.updatePlayback(roomId, next);

		if (action === "next" || action === "stop") {
			roomState.clearSkipVotes(roomId);
		}

		// `serverTime` es la hora del servidor en este instante. El cliente lo usa
		// para medir su propio desvío de reloj: sin eso, interpolar la posición con
		// `Date.now()` del cliente contra `updatedAt` del servidor mezcla dos
		// relojes y la posición sale corrida.
		const playback = { ...updated, serverTime: Date.now() };

		const io = req.app.get("io");
		if (io) {
			io.to(`room:${roomId}`).emit("room:playback", playback);
			if (action === "next" || action === "stop") {
				io.to(`room:${roomId}`).emit("room:skip-votes", {
					voters: [],
					required: 0,
				});
			}
		}

		return res.status(200).json({ status: "success", playback });
	} catch (error) {
		if (error.status) {
			return res.status(error.status).json({ status: "error", message: error.message });
		}
		next(error);
	}
}

async function getPlayback(req, res, next) {
	try {
		const userId = req.user.sub;
		const roomId = Number(req.params.id);

		if (!Number.isInteger(roomId) || roomId <= 0) {
			return res.status(400).json({ status: "error", message: "Id inválido." });
		}

		const room = await roomService.getRoomStatus(roomId);
		if (!room) {
			return res.status(404).json({ status: "error", message: "Sala no encontrada." });
		}

		const isMember = await roomService.isRoomMember(roomId, userId);
		if (!isMember) {
			return res.status(403).json({ status: "error", message: "No sos miembro de esta sala." });
		}

		const state = roomState.getRoomState(roomId);
		const votes = state.skipVotes;

		return res.status(200).json({
			status: "success",
			playback: { ...state.playback, serverTime: Date.now() },
			skipVotes: {
				voters: [...votes.voters],
				required: votes.required,
				hasVoted: votes.voters.has(userId),
			},
		});
	} catch (error) {
		if (error.status) {
			return res.status(error.status).json({ status: "error", message: error.message });
		}
		next(error);
	}
}

async function postSkipVote(req, res, next) {
	try {
		const userId = req.user.sub;
		const roomId = Number(req.params.id);

		if (!Number.isInteger(roomId) || roomId <= 0) {
			return res.status(400).json({ status: "error", message: "Id inválido." });
		}

		const room = await roomService.getRoomStatus(roomId);
		if (!room) {
			return res.status(404).json({ status: "error", message: "Sala no encontrada." });
		}

		if (room.status === "cerrada") {
			return res.status(400).json({ status: "error", message: "La sala está cerrada." });
		}

		const isMember = await roomService.isRoomMember(roomId, userId);
		if (!isMember) {
			return res.status(403).json({ status: "error", message: "No sos miembro de esta sala." });
		}

		const hostId = await roomService.getHostIdOfRoom(roomId);
		if (hostId === userId) {
			return res.status(403).json({
				status: "error",
				message: "El anfitrión no puede votar para saltar.",
			});
		}

		const current = roomState.getRoomState(roomId).playback;
		if (!current.songId || current.status === "stopped") {
			return res.status(400).json({
				status: "error",
				message: "No hay una canción sonando.",
			});
		}

		if (roomState.hasVoted(roomId, userId)) {
			return res.status(409).json({ status: "error", message: "Ya votaste para saltar." });
		}

		const noHosts = await roomService.getNonHostMemberIds(roomId);
		const required = computeRequired(noHosts.length);
		roomState.setSkipVotesRequired(roomId, required);

		const votes = roomState.addSkipVote(roomId, userId);
		const approved = votes.voters.size >= required;

		const io = req.app.get("io");

		if (approved) {
			const songs = await roomService.getPlaylistSongsOfRoom(roomId);
			const idx = songs.indexOf(current.songId);
			const nextIdx = idx === -1 ? 0 : (idx + 1) % songs.length;
			const next = roomState.updatePlayback(roomId, {
				songId: songs[nextIdx],
				status: "playing",
				positionMs: 0,
			});

			roomState.clearSkipVotes(roomId);

if (io) {
			const playback = { ...next, serverTime: Date.now() };

			io.to(`room:${roomId}`).emit("room:playback", playback);
			io.to(`room:${roomId}`).emit("room:skip-votes", { voters: [], required: 0 });
		}
		} else if (io) {
			io.to(`room:${roomId}`).emit("room:skip-votes", {
				voters: [...votes.voters],
				required,
			});
		}

		return res.status(201).json({
			status: "success",
			skipVotes: {
				voters: [...roomState.getSkipVotes(roomId).voters],
				required: roomState.getSkipVotes(roomId).required,
				hasVoted: roomState.hasVoted(roomId, userId),
			},
			approved,
		});
	} catch (error) {
		if (error.status) {
			return res.status(error.status).json({ status: "error", message: error.message });
		}
		next(error);
	}
}

async function rateHost(req, res, next) {
	try {
		const roomId = getId(req);
		const raterId = req.user.sub;
		const { rating } = req.body || {};

		const created = await roomService.rateHost({ roomId, raterId, rating });

		// El promedio vive en la vista `host_avg_rating`, así que se relee para
		// mandarlo ya calculado: los clientes actualizan el cartel sin recargar.
		const io = req.app.get("io");
		if (io) {
			const avgRating = await roomService.getHostAvgRating(created.idHost);
			io.to(`room:${roomId}`).emit("room:rating", {
				roomId,
				hostId: created.idHost,
				avgRating,
			});
		}

		return res.status(201).json({ status: "success", rating: created });
	} catch (error) {
		// Los errores de `rateHost` salen con `httpError`, así que no tienen
		// `status`: van por el handler global, que respeta `httpStatus` y manda
		// el `code` que el frontend traduce con `mapApiError`.
		next(error);
	}
}

module.exports = {
	getSortedRoom,
	getMyRooms,
	createRoom,
	joinRoom,
	leaveRoom,
	getRoomById,
	kickMember,
	closeRoom,
	postPlayback,
	getPlayback,
	postSkipVote,
	rateHost,
};
