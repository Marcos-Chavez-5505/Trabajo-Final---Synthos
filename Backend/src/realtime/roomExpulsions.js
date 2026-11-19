// Marcador en memoria de las expulsiones por inactividad.
//
// El job expulsa a invitados que no tienen sockets, así que el evento
// `room:expelled` casi nunca les llega. Cuando vuelven a pedir la sala (por
// HTTP o al reconectar el socket) ya no hay rastro de por qué se fueron: sin
// este marcador el motivo sería siempre `not_member`.
//
// Es solo para el mensaje de la UI, no para autorizar nada. Vive en memoria y
// se pierde al reiniciar el proceso (después de eso, el motivo cae a
// `not_member`). Las entradas vencidas se limpian en cada pasada del job y de
// forma perezosa al consultarlas, para que el Map no crezca sin límite.

const DEFAULT_MARKER_TTL_MS = 86_400_000;

let markerTtlMs = DEFAULT_MARKER_TTL_MS;

// `${roomId}:${userId}` -> timestamp de vencimiento
const markers = new Map();

function keyOf(roomId, userId) {
	return `${Number(roomId)}:${String(userId)}`;
}

function isNonNegativeNumber(value) {
	return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

/**
 * Ajusta el TTL de los marcadores. `0` los desactiva.
 *
 * @param {{ markerTtlMs?: number }} [options]
 */
function configureRoomExpulsions({ markerTtlMs: nextTtlMs } = {}) {
	if (isNonNegativeNumber(nextTtlMs)) markerTtlMs = nextTtlMs;
}

/** Deja constancia de que el job expulsó a este invitado por inactividad. */
function markInactivityExpulsion(roomId, userId) {
	if (markerTtlMs <= 0) return;

	const id = Number(roomId);
	if (!Number.isInteger(id) || id <= 0 || userId == null) return;

	markers.set(keyOf(id, userId), Date.now() + markerTtlMs);
}

/**
 * Borra el marcador. Se llama al entrar a la sala y al salir por cuenta
 * propia: en esos casos la próxima pérdida de acceso ya no es "inactividad".
 */
function clearInactivityExpulsion(roomId, userId) {
	markers.delete(keyOf(roomId, userId));
}

/** `true` si hay un marcador vigente para ese usuario en esa sala. */
function wasExpelledByInactivity(roomId, userId) {
	const key = keyOf(roomId, userId);
	const expiresAt = markers.get(key);

	if (expiresAt === undefined) return false;

	if (expiresAt <= Date.now()) {
		markers.delete(key);
		return false;
	}

	return true;
}

/** Limpia las entradas vencidas. La llama el job en cada pasada. */
function pruneExpiredExpulsions(now = Date.now()) {
	for (const [key, expiresAt] of markers) {
		if (expiresAt <= now) markers.delete(key);
	}
}

module.exports = {
	configureRoomExpulsions,
	markInactivityExpulsion,
	clearInactivityExpulsion,
	wasExpelledByInactivity,
	pruneExpiredExpulsions,
};
