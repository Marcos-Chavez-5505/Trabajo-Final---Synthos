import { get, post, put, del, ApiError } from './api.js'

// Playlists y favoritos contra el backend real.
//
// La API pública es la misma que tenía el mock de TS-09: los componentes no
// cambiaron. El backend identifica la playlist de favoritos con
// `type === 'favorites'` (no con `isFavorites`) y habla `idCreator` / `songs` /
// `creationDate`; `toPlaylist` traduce ese contrato al shape de la UI.
//
// El dueño sale siempre del token; igual `ownerId` sigue en la firma para no
// tocar a los llamadores y para el chequeo defensivo de `getPlaylistById`.

// Playlist autogenerada. El nombre del backend es "Favoritos", pero la UI lo
// muestra con el suyo (la identidad real es `isFavorites`, no el texto).
export const FAVORITES_PLAYLIST_NAME = 'Mis Favoritos'

// El Sidebar vive arriba de la ruta, así que "Mis Playlists" no se remonta al
// crear, renombrar o borrar desde una pantalla. Estas mutaciones avisan a quien
// esté suscripto para que vuelva a pedir la lista sin recargar la página.
const listeners = new Set()

/**
 * Suscribe un callback a los cambios de playlists del usuario.
 *
 * @param {() => void} listener
 * @returns {() => void} Función para desuscribirse.
 */
export function subscribeToPlaylists(listener) {
  listeners.add(listener)

  return () => listeners.delete(listener)
}

function notifyPlaylistsChanged() {
  listeners.forEach((listener) => listener())
}

export async function listPlaylists(ownerId) {
  requireOwner(ownerId)

  const data = await get('/playlists')

  return (data.playlists ?? []).map(toPlaylist)
}

export async function getPlaylistById(ownerId, playlistId) {
  requireOwner(ownerId)

  try {
    const data = await get(`/playlists/${playlistId}`)
    const playlist = toPlaylist(data.playlist)

    // El backend ya responde 404 si no es del token; el chequeo queda como
    // defensa por si la ruta vuelve a ser pública.
    if (!playlist || playlist.ownerId !== String(ownerId)) return null

    return playlist
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

export async function createPlaylist(ownerId, { name, description = '' }) {
  requireOwner(ownerId)

  const data = await post('/playlists', { name, description })

  notifyPlaylistsChanged()

  return toPlaylist(data.playlist)
}

export async function updatePlaylist(ownerId, playlistId, { name, description }) {
  requireOwner(ownerId)

  const data = await put(`/playlists/${playlistId}`, { name, description })

  notifyPlaylistsChanged()

  return toPlaylist(data.playlist)
}

export async function removePlaylist(ownerId, playlistId) {
  requireOwner(ownerId)

  try {
    await del(`/playlists/${playlistId}`)
    notifyPlaylistsChanged()
    return true
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 403)) {
      return false
    }
    throw error
  }
}

export async function addSongToPlaylist(ownerId, playlistId, songId) {
  requireOwner(ownerId)

  const playlist = await getPlaylistById(ownerId, playlistId)
  if (!playlist) return null

  // "Mis Favoritos" no guarda canciones en `playlist_song`: su fuente es la
  // tabla `favorite`. Agregar por `addSongs` ahí se perdería.
  if (playlist.isFavorites) {
    await addFavoriteSong(songId)
    return getPlaylistById(ownerId, playlistId)
  }

  const data = await put(`/playlists/${playlistId}`, { addSongs: [songId] })

  notifyPlaylistsChanged()

  return toPlaylist(data.playlist)
}

export async function removeSongFromPlaylist(ownerId, playlistId, songId) {
  requireOwner(ownerId)

  const playlist = await getPlaylistById(ownerId, playlistId)
  if (!playlist) return null

  if (playlist.isFavorites) {
    await removeFavoriteSong(songId)
    return getPlaylistById(ownerId, playlistId)
  }

  const data = await put(`/playlists/${playlistId}`, { removeSongs: [songId] })

  notifyPlaylistsChanged()

  return toPlaylist(data.playlist)
}

export async function toggleFavorite(ownerId, songId) {
  requireOwner(ownerId)

  const ids = await listFavoriteSongIds(ownerId)
  const wasFavorite = ids.some((id) => String(id) === String(songId))

  if (wasFavorite) {
    await removeFavoriteSong(songId)
  } else {
    await addFavoriteSong(songId)
  }

  const songIds = await listFavoriteSongIds(ownerId)

  return { isFavorite: !wasFavorite, playlist: { songIds } }
}

export async function isFavorite(ownerId, songId) {
  requireOwner(ownerId)

  const ids = await listFavoriteSongIds(ownerId)

  return ids.some((id) => String(id) === String(songId))
}

export async function listFavoriteSongIds(ownerId) {
  requireOwner(ownerId)

  const data = await get('/favorites/songs/ids')

  return data.songIds ?? []
}

function requireOwner(ownerId) {
  if (!ownerId) throw new Error('Necesitás iniciar sesión para usar tus playlists.')
}

function toPlaylist(raw) {
  if (!raw) return null

  const isFavorites = raw.type === 'favorites'

  return {
    id: String(raw.id),
    ownerId: String(raw.idCreator),
    name: isFavorites ? FAVORITES_PLAYLIST_NAME : raw.name,
    description: raw.description ?? '',
    isFavorites,
    songIds: (raw.songs ?? []).map((row) => row.idSong ?? row.song?.id),
    createdAt: raw.creationDate,
  }
}

async function addFavoriteSong(songId) {
  try {
    await post('/favorites/songs', { songId })
  } catch (error) {
    // 409 = ya estaba en favoritos: la operación es idempotente.
    if (!(error instanceof ApiError && error.status === 409)) throw error
  }

  notifyPlaylistsChanged()
}

async function removeFavoriteSong(songId) {
  try {
    await del(`/favorites/songs/${songId}`)
  } catch (error) {
    // 404 = no estaba en favoritos: idempotente.
    if (!(error instanceof ApiError && error.status === 404)) throw error
  }

  notifyPlaylistsChanged()
}
