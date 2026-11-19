// Estado "en vivo" de cada sala, derivado de dos fuentes en memoria:
//  - el playback (`realtime/roomState.js`)
//  - la presencia de la anfitriona (`realtime/presence.js`)
//
// Una sala está LIVE solo si hay una canción reproduciéndose y la anfitriona
// tiene al menos un socket (o está dentro de su gracia). No se persiste: si el
// proceso reinicia, la sala queda OFF hasta que la anfitriona vuelva a dar play
// con su socket conectado.
//
// Además administra:
//  - la pausa automática cuando la anfitriona lleva `hostOfflinePauseMs` sin
//    ningún socket (independiente de la gracia de presencia);
//  - el `offlineSince` de cada sala, que usa el job de inactividad para
//    expulsar invitados que no están conectados.
const roomState = require("./roomState");
const presence = require("./presence");

const DEFAULT_HOST_OFFLINE_PAUSE_MS = 120_000;
const DEFAULT_INACTIVE_EXPEL_MS = 1_800_000;

let hostOfflinePauseMs = DEFAULT_HOST_OFFLINE_PAUSE_MS;
let inactiveExpelMs = DEFAULT_INACTIVE_EXPEL_MS;

// roomId (number) -> hostId (string)
const hostByRoom = new Map();
// roomId (number) -> timestamp en que la sala dejó de estar LIVE
const offlineSince = new Map();
// roomId (number) -> último estado LIVE observado (para avisar solo cambios)
const liveByRoom = new Map();
// roomId (number) -> timer de pausa por anfitriona ausente
const hostOfflineTimers = new Map();
// Consumidores del cambio de isLive (evento de tarjeta, Fase 4).
const liveListeners = new Set();

let ioRef = null;
let unsubscribePresence = null;

function isNonNegativeNumber(value) {
	return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

/**
 * Ajusta los tiempos de pausa por anfitriona ausente y de expulsión.
 */
function configureRoomLive({
	hostOfflinePauseMs: nextPauseMs,
	inactiveExpelMs: nextExpelMs,
} = {}) {
	if (isNonNegativeNumber(nextPauseMs)) hostOfflinePauseMs = nextPauseMs;
	if (isNonNegativeNumber(nextExpelMs)) inactiveExpelMs = nextExpelMs;
}

/**
 * Cachea quién es la anfitriona. Se llama al unirse por socket y al controlar
 * la reproducción (ahí el controller ya consultó el rol).
 */
function registerRoomHost(roomId, hostId) {
	const id = Number(roomId);
	if (!Number.isInteger(id) || id <= 0 || hostId == null) return;

	hostByRoom.set(id, String(hostId));
}

function getRoomHostId(roomId) {
	return hostByRoom.get(Number(roomId)) ?? null;
}

/**
 * Gancho para la Fase 4: avisa cuando `isRoomPlaying` cambia para una sala.
 * No emite nada por sí solo.
 *
 * @returns {() => void} desuscripción
 */
function onLiveChanged(listener) {
	liveListeners.add(listener);

	return () => liveListeners.delete(listener);
}

function isHostPresent(roomId, hostId = getRoomHostId(roomId)) {
	if (hostId == null) return false;

	return presence.roomOnlineUsers(Number(roomId)).includes(String(hostId));
}

/**
 * `true` solo si hay una canción reproduciéndose y la anfitriona está presente
 * (incluida la gracia de 60 s). Sala sin estado o sin anfitrión → `false`,
 * nunca `undefined`.
 */
function isRoomPlaying(roomId, hostId) {
	const playback = roomState.peekPlayback(roomId);

	if (!playback || playback.status !== "playing") return false;

	return isHostPresent(roomId, hostId ?? getRoomHostId(roomId));
}

/**
 * Marca/limpia el inicio de la inactividad. Si la sala no está LIVE y no hay
 * marca, se asigna `now` (conteo perezoso: sirve también tras un reinicio, donde
 * el estado en memoria se perdió).
 */
function syncOfflineSince(roomId) {
	const id = Number(roomId);
	const live = isRoomPlaying(id);
	const previous = liveByRoom.get(id);

	liveByRoom.set(id, live);

	if (live) offlineSince.delete(id);
	else if (!offlineSince.has(id)) offlineSince.set(id, Date.now());

	// undefined → false no avisa: la tarjeta ya estaba OFF. Los demás cambios
	// sí, para que el lobby actualice el chip.
	if (live ? previous !== true : previous === true) {
		liveListeners.forEach((listener) => listener(id));
	}

	return live;
}

function getOfflineSince(roomId) {
	return offlineSince.get(Number(roomId)) ?? null;
}

function shouldExpel(roomId) {
	const since = getOfflineSince(roomId);
	if (since === null) return false;

	return Date.now() - since >= inactiveExpelMs;
}

function cancelHostOfflineTimer(roomId) {
	const id = Number(roomId);
	const timer = hostOfflineTimers.get(id);
	if (timer === undefined) return;

	clearTimeout(timer);
	hostOfflineTimers.delete(id);
}

function startHostOfflineTimer(roomId) {
	const id = Number(roomId);
	cancelHostOfflineTimer(id);

	const timer = setTimeout(() => {
		hostOfflineTimers.delete(id);
		pauseRoomWithAbsentHost(id);
	}, hostOfflinePauseMs);

	// No mantiene vivo el proceso si está apagándose.
	timer?.unref?.();
	hostOfflineTimers.set(id, timer);
}

/**
 * Pausa la sala reutilizando el mismo cálculo de posición del controller y
 * avisa a `room:<id>` con el evento de playback existente.
 */
function pauseRoomWithAbsentHost(roomId) {
	const id = Number(roomId);
	const playback = roomState.peekPlayback(id);

	if (!playback || playback.status !== "playing") {
		syncOfflineSince(id);
		return null;
	}

	// Volvió justo antes del vencimiento: no se toca nada.
	if (isHostPresent(id)) return null;

	const updated = roomState.pausePlayback(id);

	ioRef?.to(`room:${id}`).emit("room:playback", {
		...updated,
		serverTime: Date.now(),
	});

	syncOfflineSince(id);

	return updated;
}

function handlePresenceChange({ roomId, userId, present, reason }) {
	const id = Number(roomId);
	const hostId = getRoomHostId(id);

	if (hostId === null || String(hostId) !== String(userId)) return;

	if (present) {
		cancelHostOfflineTimer(id);
		syncOfflineSince(id);
		return;
	}

	if (reason === "disconnected") {
		// Último socket: arranca el reloj de 2 min, aunque la presencia todavía
		// lo mantenga durante la gracia.
		startHostOfflineTimer(id);
		return;
	}

	// `grace-expired`: recién acá la sala deja de contar como LIVE.
	syncOfflineSince(id);
}

function initRoomLive(io) {
	ioRef = io ?? null;

	if (unsubscribePresence) unsubscribePresence();
	unsubscribePresence = presence.onPresenceChange(handlePresenceChange);
}

function shutdownRoomLive() {
	[...hostOfflineTimers.keys()].forEach(cancelHostOfflineTimer);

	if (unsubscribePresence) {
		unsubscribePresence();
		unsubscribePresence = null;
	}

	ioRef = null;
}

module.exports = {
	configureRoomLive,
	registerRoomHost,
	isRoomPlaying,
	syncOfflineSince,
	shouldExpel,
	onLiveChanged,
	initRoomLive,
	shutdownRoomLive,
};
