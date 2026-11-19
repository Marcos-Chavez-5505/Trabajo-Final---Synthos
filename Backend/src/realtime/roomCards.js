// Actualizaciones de tarjetas de sala hacia el lobby (`room:card-updated`).
//
// Por cada sala hay un debounce trailing: una ráfaga de cambios de presencia,
// géneros o isLive se agrupa en un único emit. El payload se calcula recién al
// emitir, con la misma función que arma una fila del listado, así que no hay
// una segunda forma de la tarjeta ni consultas duplicadas por evento.
//
// Si el payload es igual al último emitido para esa sala, no se emite. Si una
// sala pública se cerró, se emite `room:card-removed` una sola vez; las privadas
// o inexistentes nunca estuvieron en el listado y no generan eventos.
const roomService = require("../services/room.service");
const presence = require("./presence");
const roomGenres = require("../services/roomGenres.service");
const roomLive = require("./roomLive");
const { LOBBY_ROOM } = require("./lobby");

const DEFAULT_DEBOUNCE_MS = 1_500;

let debounceMs = DEFAULT_DEBOUNCE_MS;

let ioRef = null;
let unsubscribers = [];

// roomId (number) -> timer pendiente
const pending = new Map();
// roomId (number) -> JSON del último payload emitido
const lastPayload = new Map();
// Salas a las que ya se les avisó la baja.
const removed = new Set();

function isNonNegativeNumber(value) {
	return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

/** Ajusta el debounce por sala. Se llama una vez al arrancar. */
function configureRoomCards({ debounceMs: nextDebounceMs } = {}) {
	if (isNonNegativeNumber(nextDebounceMs)) debounceMs = nextDebounceMs;
}

function toCardPayload(card) {
	return {
		roomId: Number(card.id),
		isLive: Boolean(card.is_live),
		membersCount: Number(card.members_count),
		members: Array.isArray(card.members) ? card.members : [],
		genres: Array.isArray(card.genres) ? card.genres : [],
	};
}

/**
 * Avisa la baja de una sala que dejó de estar en el listado. Solo corresponde
 * si la sala es pública y está cerrada: una sala privada o inexistente nunca
 * estuvo en el listado, así que el lobby no tiene tarjeta que sacar. La
 * consulta es mínima (id, status e is_private) y no arma la tarjeta completa.
 */
async function flushRemoval(roomId) {
	if (removed.has(roomId)) return;

	let room;

	try {
		room = await roomService.getRoomStatus(roomId);
	} catch (error) {
		// Se reintenta en el próximo disparo; no se marca como emitido.
		console.error(
			`[Salas] No se pudo consultar la visibilidad de la sala ${roomId}:`,
			error,
		);
		return;
	}

	if (!room || room.isPrivate || room.status === "activa") return;

	removed.add(roomId);
	lastPayload.delete(roomId);
	ioRef?.to(LOBBY_ROOM).emit("room:card-removed", { roomId });
}

async function flushRoomCard(roomId) {
	if (!ioRef) return;

	let card;

	try {
		card = await roomService.getRoomCardById(roomId);
	} catch (error) {
		// Se reintenta en el próximo disparo; no se marca como emitido.
		console.error(`[Salas] No se pudo armar la tarjeta de la sala ${roomId}:`, error);
		return;
	}

	if (!card) {
		await flushRemoval(roomId);
		return;
	}

	removed.delete(roomId);

	const payload = toCardPayload(card);
	const serialized = JSON.stringify(payload);

	if (lastPayload.get(roomId) === serialized) return;

	lastPayload.set(roomId, serialized);
	ioRef.to(LOBBY_ROOM).emit("room:card-updated", payload);
}

/**
 * Programa una actualización para una sala. El timer se reinicia con cada
 * disparo (trailing): una ráfaga termina en un solo emit, `debounceMs` después
 * del último cambio.
 */
function notifyRoomCardChanged(roomId) {
	const id = Number(roomId);

	if (!Number.isInteger(id) || id <= 0) return;

	const current = pending.get(id);

	if (current !== undefined) clearTimeout(current);

	const timer = setTimeout(() => {
		pending.delete(id);
		void flushRoomCard(id);
	}, debounceMs);

	timer?.unref?.();
	pending.set(id, timer);
}

function initRoomCards(io) {
	ioRef = io ?? null;

	unsubscribers.forEach((unsubscribe) => unsubscribe());
	unsubscribers = [
		presence.onPresenceChange(({ roomId }) => notifyRoomCardChanged(roomId)),
		roomGenres.onGenresChanged((roomId) => notifyRoomCardChanged(roomId)),
		roomLive.onLiveChanged((roomId) => notifyRoomCardChanged(roomId)),
	];
}

function shutdownRoomCards() {
	pending.forEach((timer) => clearTimeout(timer));
	pending.clear();

	unsubscribers.forEach((unsubscribe) => unsubscribe());
	unsubscribers = [];
	ioRef = null;
}

module.exports = {
	configureRoomCards,
	notifyRoomCardChanged,
	initRoomCards,
	shutdownRoomCards,
};
