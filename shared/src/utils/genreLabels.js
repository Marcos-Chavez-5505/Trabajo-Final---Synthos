// Etiquetas de géneros para mostrar. El backend entrega los nombres crudos de
// la base; acá se traducen (diccionario chico) y se deduplican para que web y
// mobile pinten exactamente lo mismo.

const MAX_GENRES = 3;

const GENRE_LABELS = {
	electronic: "Electrónica",
	electronica: "Electrónica",
	classical: "Clásica",
	"hip hop": "Hip hop",
	"hip-hop": "Hip hop",
	"lo-fi": "Lo-fi",
	lofi: "Lo-fi",
	"r&b": "R&B",
	"rhythm and blues": "R&B",
	"singer-songwriter": "Cantautor",
};

/**
 * Traduce un nombre de género. Fallback: el mismo nombre normalizado.
 * Devuelve "" si no es un string o queda vacío.
 */
export function mapGenreLabel(name) {
	if (typeof name !== "string") return "";

	const normalized = name.trim().replace(/\s+/g, " ");

	if (!normalized) return "";

	return GENRE_LABELS[normalized.toLowerCase()] ?? normalized;
}

/**
 * Mapea una lista de géneros: traduce, descarta vacíos, deduplica después de
 * mapear (sin distinguir mayúsculas) y respeta el tope (3 por defecto).
 */
export function mapGenreLabels(names, limit = MAX_GENRES) {
	if (!Array.isArray(names)) return [];

	const max = Number.isInteger(limit) && limit >= 0 ? limit : MAX_GENRES;

	if (max === 0) return [];

	const seen = new Set();
	const labels = [];

	for (const name of names) {
		const label = mapGenreLabel(name);

		if (!label) continue;

		const key = label.toLowerCase();

		if (seen.has(key)) continue;

		seen.add(key);
		labels.push(label);

		if (labels.length >= max) break;
	}

	return labels;
}
