import { get, post, put, del, ApiError } from './api.js'

// Playlists y favoritos contra el backend real.
//
// La API pública es la misma que tenía el mock de TS-09: los componentes no
// cambiaron. El backend identifica la playlist de favoritos con
// `type === 'favorites'` (no con `isFavorites`) y habla `idCreator` / `songs` /
// `creationDate`; `toPlaylist` traduce ese contrato al shape de la UI.
//
// El dueño sale siempre del token; igual `ownerId` sigue en la firma para no
// tocar a los llamadores y es el id de quien mira la playlist, que es lo que
// define su rol (`creator`, `colaborator` o null).

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

  return (data.playlists ?? []).map((raw) => toPlaylist(raw, ownerId))
}

export async function getPlaylistById(ownerId, playlistId) {
  requireOwner(ownerId)

  try {
    const data = await get(`/playlists/${playlistId}`)

    return toPlaylist(data.playlist, ownerId)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

export async function createPlaylist(ownerId, { name, description = '', type = 'personal' }) {
  requireOwner(ownerId)

  const data = await post('/playlists', { name, description, type })

  notifyPlaylistsChanged()

  return toPlaylist(data.playlist, ownerId)
}

export async function updatePlaylist(ownerId, playlistId, { name, description }) {
  requireOwner(ownerId)

  const data = await put(`/playlists/${playlistId}`, { name, description })

  notifyPlaylistsChanged()

  return toPlaylist(data.playlist, ownerId)
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

  try {
    await post(`/playlists/${playlistId}/songs`, { songId })
  } catch (error) {
    // 409 = ya estaba en la playlist: la operación es idempotente.
    if (!(error instanceof ApiError && error.status === 409)) throw error
  }

  notifyPlaylistsChanged()

  return getPlaylistById(ownerId, playlistId)
}

export async function removeSongFromPlaylist(ownerId, playlistId, songId) {
  requireOwner(ownerId)

  const playlist = await getPlaylistById(ownerId, playlistId)
  if (!playlist) return null

  if (playlist.isFavorites) {
    await removeFavoriteSong(songId)
    return getPlaylistById(ownerId, playlistId)
  }

  try {
    await del(`/playlists/${playlistId}/songs/${songId}`)
  } catch (error) {
    // 404 = no estaba en la playlist: idempotente.
    if (!(error instanceof ApiError && error.status === 404)) throw error
  }

  notifyPlaylistsChanged()

  return getPlaylistById(ownerId, playlistId)
}

export async function updatePlaylistSongsOrder(ownerId, playlistId, songIds, { keepalive } = {}) {
	requireOwner(ownerId)

	const body = { songIds }
	const useKeepalive = Boolean(keepalive) && JSON.stringify(body).length < 60000

	const data = await put(`/playlists/${playlistId}/songs/order`, body, { keepalive: useKeepalive })

	notifyPlaylistsChanged()

	return { songIds: data.songIds ?? [], merged: Boolean(data.merged) }
}

export async function updateFavoritesOrder(ownerId, songIds, { keepalive } = {}) {
	requireOwner(ownerId)

	const body = { songIds }
	const useKeepalive = Boolean(keepalive) && JSON.stringify(body).length < 60000

	const data = await put('/favorites/order', body, { keepalive: useKeepalive })

	notifyPlaylistsChanged()

	return { songIds: data.songIds ?? [], merged: Boolean(data.merged) }
}

export async function removePlaylistMember(ownerId, playlistId, memberId) {
  requireOwner(ownerId)

  await del(`/playlists/${playlistId}/members/${memberId}`)

  notifyPlaylistsChanged()

  return true
}

export async function sendInvitation(ownerId, playlistId, userId) {
  requireOwner(ownerId)

  const data = await post(`/playlists/${playlistId}/invitation`, { userId })

  return { invitation: toInvitation(data.invitation), converted: Boolean(data.converted) }
}

export async function listSentInvitations(ownerId, playlistId) {
  requireOwner(ownerId)

  const data = await get(`/playlists/${playlistId}/invitations`)

  return (data.invitations ?? []).map(toInvitation)
}

export async function listReceivedInvitations(ownerId) {
  requireOwner(ownerId)

  const data = await get('/playlists/invitations')

  return (data.invitations ?? []).map(toInvitation)
}

export async function acceptPlaylistInvitation(ownerId, playlistId) {
  requireOwner(ownerId)

  await post(`/playlists/invitations/${playlistId}/accept`)

  notifyPlaylistsChanged()

  return true
}

export async function rejectPlaylistInvitation(ownerId, playlistId) {
  requireOwner(ownerId)

  await post(`/playlists/invitations/${playlistId}/reject`)

  notifyPlaylistsChanged()

  return true
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

function toInvitation(raw) {
  if (!raw) return null

  return {
    playlistId: String(raw.idPlaylist),
    status: raw.status,
    createdAt: raw.createdAt,
    playlist: {
      id: String(raw.playlist?.id),
      name: raw.playlist?.name ?? '',
      description: raw.playlist?.description ?? '',
    },
    sender: toPerson(raw.sender),
    receiver: toPerson(raw.receiver),
  }
}

function toPerson(raw) {
  if (!raw) return { id: '', username: '', avatarUrl: null }

  return { id: String(raw.id), username: raw.username, avatarUrl: raw.pictureUrl ?? null }
}

function toPlaylist(raw, viewerId) {
  if (!raw) return null

  const isFavorites = raw.type === 'favorites'
  const viewer = viewerId === null || viewerId === undefined ? null : String(viewerId)
  const creator = {
    id: String(raw.idCreator),
    username: raw.creator?.username ?? '',
    avatarUrl: raw.creator?.pictureUrl ?? null,
  }
  const members = (raw.members ?? []).map((member) => ({
    id: String(member.idUser),
    username: member.user?.username ?? '',
    avatarUrl: member.user?.pictureUrl ?? null,
    role: member.role,
  }))

  return {
    id: String(raw.id),
    ownerId: creator.id,
    type: raw.type,
    // "creator" | "colaborator" | null (alguien sin relación, que solo la ve).
    role:
      creator.id === viewer
        ? 'creator'
        : (members.find((member) => member.id === viewer)?.role ?? null),
    creator,
    members,
    name: isFavorites ? FAVORITES_PLAYLIST_NAME : raw.name,
    description: raw.description ?? '',
    isFavorites,
    isCollaborative: raw.type === 'colab',
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
