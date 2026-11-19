// Utilidades puras de géneros: sin Prisma, sin sockets y sin conocer salas.
//
// El backend es CommonJS y `shared/` es ESM (además su index exporta JSX y
// contextos de React), así que no se puede `require` desde acá. Esta es la
// versión neutral que usan el listado y los tests; el etiquetado para mostrar
// (`mapGenreLabel`) vive en `shared/src/utils/genreLabels.js`.

const DEFAULT_LIMIT = 3;

/** Colapsa espacios internos y recorta. Devuelve "" para valores no-string. */
function normalizeGenreName(value) {
	if (typeof value !== "string") return "";

	return value.trim().replace(/\s+/g, " ");
}

function normalizeLimit(limit) {
	const value = Number(limit);

	if (!Number.isInteger(value) || value < 0) return DEFAULT_LIMIT;

	return value;
}

/**
 * Rankea un mapa/objeto `nombre → conteo`.
 *
 * - Orden: conteo descendente.
 * - Desempate único: nombre ascendente por code unit (determinista, sin
 *   depender del locale del proceso).
 * - Normaliza espacios y descarta nombres vacíos o conteos no positivos.
 * - Si dos claves normalizan al mismo nombre, se suman.
 *
 * @param {Map<string, number>|Record<string, number>} counts
 * @param {number} [limit]
 * @returns {string[]}
 */
function topGenresFromCounts(counts, limit = DEFAULT_LIMIT) {
	const entries =
		counts instanceof Map ? [...counts.entries()] : Object.entries(counts ?? {});
	const totals = new Map();

	for (const [rawName, rawCount] of entries) {
		const name = normalizeGenreName(rawName);
		const count = Number(rawCount);

		if (!name || !Number.isFinite(count) || count <= 0) continue;

		totals.set(name, (totals.get(name) ?? 0) + count);
	}

	return [...totals.entries()]
		.sort((a, b) => {
			if (b[1] !== a[1]) return b[1] - a[1];
			if (a[0] === b[0]) return 0;

			return a[0] < b[0] ? -1 : 1;
		})
		.slice(0, normalizeLimit(limit))
		.map(([name]) => name);
}

/**
 * Cuenta +1 por cada género de cada canción y delega el ranking.
 *
 * @param {Array<{ songGenres?: Array<{ genre?: { name?: string } }> }>} songs
 * @param {number} [limit]
 * @returns {string[]}
 */
function computeTopGenres(songs, limit = DEFAULT_LIMIT) {
	const counts = new Map();

	for (const song of songs ?? []) {
		for (const row of song?.songGenres ?? []) {
			const name = row?.genre?.name;

			if (typeof name !== "string") continue;

			counts.set(name, (counts.get(name) ?? 0) + 1);
		}
	}

	return topGenresFromCounts(counts, limit);
}

module.exports = {
	DEFAULT_LIMIT,
	normalizeGenreName,
	topGenresFromCounts,
	computeTopGenres,
};
