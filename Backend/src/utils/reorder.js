/**
 * Validación y fusión puras para el reordenamiento de listas.
 *
 * No tocan la base de datos ni el HTTP: las usan el controller (validación) y el
 * service (fusión dentro de la transacción). También son la fuente de los tests
 * de la capa de servicio.
 */

/**
 * Valida que `input` sea un array de enteros positivos sin repetir.
 *
 * Devuelve el array normalizado, o `null` si es inválido (no es array, tiene
 * strings numéricos, ids <= 0 o duplicados). Un array vacío es válido.
 *
 * @param {unknown} input
 * @returns {number[] | null}
 */
function parseSongIds(input) {
	if (!Array.isArray(input)) return null;

	const seen = new Set();
	const ids = [];

	for (const value of input) {
		if (typeof value !== "number" || !Number.isInteger(value) || value <= 0) {
			return null;
		}
		if (seen.has(value)) return null;
		seen.add(value);
		ids.push(value);
	}

	return ids;
}

/**
 * Fusiona el orden enviado por el cliente con el estado actual de la lista.
 *
 * - Los ids enviados que siguen existiendo se conservan en el orden enviado.
 * - Los ids enviados que ya no existen se descartan.
 * - Los ids actuales que no venían en lo enviado se agregan:
 *     - playlists: al final, conservando su orden relativo.
 *     - favoritos: al principio, conservando su orden relativo.
 *
 * `merged` es `true` si hubo que conciliar (se agregó o se descartó algo);
 * un reordenamiento puro devuelve `false`.
 *
 * @param {{ mode: "playlist" | "favorites", current: number[], incoming: number[] }} params
 * @returns {{ order: number[], merged: boolean }}
 */
function mergeOrder({ mode, current, incoming }) {
	const currentSet = new Set(current);

	const incomingExisting = [];
	let dropped = 0;

	for (const id of incoming) {
		if (currentSet.has(id)) {
			incomingExisting.push(id);
		} else {
			dropped += 1;
		}
	}

	const incomingSet = new Set(incomingExisting);
	const missing = current.filter((id) => !incomingSet.has(id));

	let order;
	if (mode === "favorites") {
		order = [...missing, ...incomingExisting];
	} else {
		order = [...incomingExisting, ...missing];
	}

	const merged = dropped > 0 || missing.length > 0;

	return { order, merged };
}

module.exports = {
	parseSongIds,
	mergeOrder,
};