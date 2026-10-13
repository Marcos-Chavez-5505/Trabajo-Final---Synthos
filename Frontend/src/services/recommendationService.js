// services/recommendationsService.js
import { get } from "./api.js";
import { toSong } from "./songsService.js";

/**
 * Convierte una recomendación cruda del backend a la forma que usa el frontend.
 *
 * El backend devuelve la fila de `content` con `author` y `song` anidados. La
 * canción viene en el shape de Prisma, así que se reusa `toSong` de
 * songsService para no duplicar el mapeo (url → audioUrl, artist.name, etc.).
 */
function toRecommendation(raw) {
	if (!raw) return null;

	return {
		id: raw.id,
		text: raw.text ?? "",
		date: raw.date,
		author: {
			id: raw.author?.id,
			username: raw.author?.username ?? null,
			avatarUrl: raw.author?.pictureUrl ?? null,
		},
		song: toSong(raw.song),
	};
}
/**
 * Recomendaciones visibles en el perfil de `userId`.
 *
 * La visibilidad ya la resuelve el backend (B1): dueño ve todas, emisor ve
 * solo las suyas en perfil ajeno. El frontend no filtra.
 *
 * @returns {Promise<object[]>}
 */
export async function getUserRecommendations(userId, { signal } = {}) {
	const data = await get(`/users/${userId}/recommendations`, { signal });
	const list = data?.recommendations ?? [];

	return list.map(toRecommendation);
}
