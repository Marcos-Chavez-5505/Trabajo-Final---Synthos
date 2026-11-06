/**
 * Portada de una playlist: la imagen subida manda sobre la carátula de la
 * primera canción. Devuelve null si no hay ninguna; el fallback visual queda en
 * cada cliente (la web usa `headphones.svg`, mobile lo dibuja del catálogo).
 *
 * @param {{coverUrl?: string|null, firstSongCoverUrl?: string|null}} [playlist]
 * @returns {string|null}
 */
export function resolvePlaylistCoverUrl({ coverUrl, firstSongCoverUrl } = {}) {
  return coverUrl || firstSongCoverUrl || null
}
