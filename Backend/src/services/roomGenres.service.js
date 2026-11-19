// Géneros de las tarjetas de sala.
//
// Fuente real: el conjunto de canciones de `Room.idPlaylistSource`. La cola de
// la sala (`queueOrder`) solo reordena, no cambia el conjunto.
//
// Para el listado se hace UNA consulta agregada para todas las salas que no
// están en caché (`room → playlist_song → song_genre → genre`), y el ranking se
// resuelve en JS con `topGenresFromCounts` (mismo criterio para todo el backend).
//
// Caché: Map<roomId, { playlistId, genres, expiresAt }>. Se invalida cuando la
// playlist asociada cambia (`POST/DELETE /playlists/:id/songs`) y, como red de
// seguridad, vence con `ROOM_GENRES_CACHE_TTL_MS`.
const { Prisma } = require("@prisma/client");
const prisma = require("../prisma/prismaClient");
const { topGenresFromCounts } = require("../utils/genres");

const DEFAULT_TTL_MS = 300_000;
const TOP_GENRES = 3;

let ttlMs = DEFAULT_TTL_MS;

const cache = new Map();
const listeners = new Set();

function isNonNegativeNumber(value) {
	return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

/** Ajusta el TTL de la caché. Se llama una vez al arrancar. */
function configureRoomGenres({ ttlMs: nextTtlMs } = {}) {
	if (isNonNegativeNumber(nextTtlMs)) ttlMs = nextTtlMs;
}

/**
 * Gancho para el lobby: recibe el roomId de cada sala cuyos géneros cambiaron.
 * `roomCards` lo usa para emitir `room:card-updated`.
 *
 * @returns {() => void} desuscripción
 */
function onGenresChanged(listener) {
	listeners.add(listener);

	return () => listeners.delete(listener);
}

function notifyGenresChanged(roomIds) {
	roomIds.forEach((roomId) => {
		listeners.forEach((listener) => listener(roomId));
	});
}

/** Consulta agregada para las salas pedidas. Devuelve Map<roomId, Map<nombre, conteo>>. */
async function loadGenreCountsFromDb(roomIds) {
	const countsByRoom = new Map();

	if (roomIds.length === 0) return countsByRoom;

	const rows = await prisma.$queryRaw(
		Prisma.sql`
			SELECT
				room.id AS room_id,
				genre.name AS genre_name,
				COUNT(*)::int AS total
			FROM room
			JOIN playlist_song ps ON ps.id_playlist = room.id_playlist_source
			JOIN song_genre sg ON sg.id_song = ps.id_song
			JOIN genre ON genre.id = sg.id_genre
			WHERE room.id IN (${Prisma.join(roomIds)})
			GROUP BY room.id, genre.name
		`,
	);

	for (const row of rows) {
		const roomId = Number(row.room_id);
		const name = row.genre_name;
		const counts = countsByRoom.get(roomId) ?? new Map();

		counts.set(name, (counts.get(name) ?? 0) + Number(row.total));
		countsByRoom.set(roomId, counts);
	}

	return countsByRoom;
}

/**
 * Agrega `genres: string[]` a cada fila del listado. Solo consulta las salas
 * sin caché válida; el resto se resuelve en memoria.
 */
async function attachRoomGenres(rows) {
	if (rows.length === 0) return rows;

	const at = Date.now();

	const stale = rows.filter((row) => {
		const entry = cache.get(Number(row.id));

		return (
			!entry ||
			String(entry.playlistId) !== String(row.id_playlist_source) ||
			entry.expiresAt <= at
		);
	});

	if (stale.length > 0) {
		const countsByRoom = await loadGenreCountsFromDb(
			stale.map((row) => Number(row.id)),
		);

		for (const row of stale) {
			const roomId = Number(row.id);
			const counts = countsByRoom.get(roomId) ?? new Map();

			cache.set(roomId, {
				playlistId: row.id_playlist_source,
				genres: topGenresFromCounts(counts, TOP_GENRES),
				expiresAt: at + ttlMs,
			});
		}
	}

	return rows.map((row) => ({
		...row,
		genres: cache.get(Number(row.id))?.genres ?? [],
	}));
}

/**
 * Invalida todas las salas alimentadas por la playlist y avisa al gancho.
 * Devuelve los roomIds afectados (los que estaban cacheados).
 */
function invalidateByPlaylist(playlistId) {
	const affected = [];

	for (const [roomId, entry] of cache) {
		if (String(entry.playlistId) !== String(playlistId)) continue;

		cache.delete(roomId);
		affected.push(roomId);
	}

	if (affected.length > 0) notifyGenresChanged(affected);

	return affected;
}

module.exports = {
	configureRoomGenres,
	onGenresChanged,
	attachRoomGenres,
	invalidateByPlaylist,
};
