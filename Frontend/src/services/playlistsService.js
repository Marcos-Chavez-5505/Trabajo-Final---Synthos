import { mockPlaylists } from '../mocks/playlists.js'

// Mock de playlists sobre localStorage, con la misma forma que tendrá el backend
// (ver AGENTS.md: los servicios son la única capa que cambia al migrar).
//
// Toda la API es async aunque resuelva sobre el storage, para que los
// componentes no se enteren del swap.
//
// Aislamiento por dueño: las playlists son privadas (criterio de TS-09), así que
// `ownerId` es obligatorio en cada operación y se filtra siempre. No hay forma
// de leer o escribir la playlist de otro usuario desde estos métodos, ni aunque
// se conozca el id: `getPlaylistById` devuelve `null` si el dueño no coincide.

const PLAYLISTS_KEY = 'synthos_mock_playlists'

// Playlist autogenerada. Se marca con `isFavorites` en vez de comparar el nombre
// para que un usuario no pueda crear una playlist llamada "Mis Favoritos" que se
// confunda con la real.
export const FAVORITES_PLAYLIST_NAME = 'Mis Favoritos'

function nowIso() {
  return new Date().toISOString()
}

function newId() {
  return crypto.randomUUID()
}

/** Lee el storage completo. Devuelve `{ playlists, seededOwners }`. */
function readStore() {
  let parsed = null
  try {
    const stored = localStorage.getItem(PLAYLISTS_KEY)
    parsed = stored ? JSON.parse(stored) : null
  } catch {
    parsed = null
  }

  if (parsed && Array.isArray(parsed.playlists)) return parsed

  return { playlists: [], seededOwners: [] }
}

function writeStore(store) {
  localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(store))
}

/**
 * Siembra las playlists del mock para un usuario la primera vez que se lo consulta.
 *
 * Se hace por usuario y no una sola vez global, porque cada cuenta nueva arranca
 * con su colección vacía: si se sembrara todo en la primera visita, el usuario
 * registrado en TS-03 vería las playlists de `u1`.
 *
 * `seededOwners` evita re-sembrar: si el usuario borra todas sus playlists, la
 * lista vacía es una decisión suya y no debe volver a llenarse sola.
 */
function getStoreFor(ownerId) {
  const store = readStore()

  if (store.seededOwners.includes(ownerId)) return store

  const seeded = mockPlaylists
    .filter((playlist) => playlist.ownerId === ownerId)
    .map((playlist) => ({ ...playlist, songIds: [...playlist.songIds] }))

  store.playlists = [...store.playlists, ...seeded]
  store.seededOwners = [...store.seededOwners, ownerId]
  writeStore(store)

  return store
}

function requireOwner(ownerId) {
  if (!ownerId) throw new Error('Necesitás iniciar sesión para usar tus playlists.')
}

function ownPlaylists(store, ownerId) {
  return store.playlists.filter((playlist) => playlist.ownerId === ownerId)
}

/** Copia defensiva: el store es la fuente de verdad y no debe filtrarse al exterior. */
function publicView(playlist) {
  return { ...playlist, songIds: [...playlist.songIds] }
}

/**
 * "Mis Favoritos" es una playlist normal con `isFavorites: true`. Se crea sola la
 * primera vez que alguien marca una canción como favorita (criterio de TS-09) y
 * no se puede renombrar ni borrar desde la UI, porque su identidad es el flag y
 * no el texto.
 */
function ensureFavoritesPlaylist(store, ownerId) {
  const existing = ownPlaylists(store, ownerId).find((playlist) => playlist.isFavorites)
  if (existing) return existing

  const playlist = {
    id: newId(),
    ownerId,
    name: FAVORITES_PLAYLIST_NAME,
    description: 'Las canciones que marcaste como favoritas.',
    isFavorites: true,
    songIds: [],
    createdAt: nowIso(),
  }

  store.playlists.push(playlist)

  return playlist
}

function findOwn(store, ownerId, playlistId) {
  return store.playlists.find(
    (candidate) => candidate.id === playlistId && candidate.ownerId === ownerId
  )
}

/**
 * Orden de la lista: de más nueva a más vieja, para que lo que acaba de crearse
 * quede arriba y no haya que scrollear hasta el final.
 */
function byCreatedAt(a, b) {
  return String(b.createdAt).localeCompare(String(a.createdAt))
}

/**
 * Playlists del usuario, de más nueva a más vieja.
 *
 * @param {string} ownerId
 * @returns {Promise<object[]>}
 */
export async function listPlaylists(ownerId) {
  requireOwner(ownerId)

  const store = getStoreFor(ownerId)
  const playlists = ownPlaylists(store, ownerId).sort(byCreatedAt)

  return playlists.map(publicView)
}

/**
 * Una playlist por id, o `null` si no existe **o si es de otro usuario**. El
 * filtro por `ownerId` es lo que hace cumplir la privacidad: la UI recibe `null`
 * y muestra "no encontrada", igual que si el id no existiera.
 *
 * @param {string} ownerId
 * @param {string} playlistId
 * @returns {Promise<object|null>}
 */
export async function getPlaylistById(ownerId, playlistId) {
  requireOwner(ownerId)

  const store = getStoreFor(ownerId)
  const playlist = findOwn(store, ownerId, playlistId)

  return playlist ? publicView(playlist) : null
}

/**
 * Crea una playlist vacía.
 *
 * @param {string} ownerId
 * @param {{name: string, description?: string}} data
 * @returns {Promise<object>} La playlist creada.
 * @throws {Error} Si el nombre está vacío.
 */
export async function createPlaylist(ownerId, { name, description = '' }) {
  requireOwner(ownerId)

  const trimmed = String(name ?? '').trim()
  if (!trimmed) throw new Error('La playlist necesita un nombre.')

  const store = getStoreFor(ownerId)
  const playlist = {
    id: newId(),
    ownerId,
    name: trimmed,
    description: String(description ?? '').trim(),
    isFavorites: false,
    songIds: [],
    createdAt: nowIso(),
  }

  store.playlists.push(playlist)
  writeStore(store)

  return publicView(playlist)
}

/**
 * Renombra o cambia la descripción.
 *
 * "Mis Favoritos" no se puede renombrar: su nombre es parte del contrato de la
 * app y su identidad real es `isFavorites`.
 *
 * @param {string} ownerId
 * @param {string} playlistId
 * @param {{name?: string, description?: string}} data
 * @returns {Promise<object|null>} La playlist actualizada, o `null` si no le corresponde.
 * @throws {Error} Si el nombre queda vacío o la playlist es la de favoritos.
 */
export async function updatePlaylist(ownerId, playlistId, { name, description }) {
  requireOwner(ownerId)

  const store = getStoreFor(ownerId)
  const playlist = findOwn(store, ownerId, playlistId)

  if (!playlist) return null
  if (playlist.isFavorites) throw new Error('"Mis Favoritos" no se puede renombrar.')

  if (name !== undefined) {
    const trimmed = String(name).trim()
    if (!trimmed) throw new Error('La playlist necesita un nombre.')

    playlist.name = trimmed
  }

  if (description !== undefined) playlist.description = String(description).trim()

  writeStore(store)

  return publicView(playlist)
}

/**
 * Elimina una playlist.
 *
 * "Mis Favoritos" no se borra: si desapareciera, la próxima canción marcada como
 * favorita la volvería a crear y el usuario vería una colección vacía sin
 * explicación.
 *
 * @param {string} ownerId
 * @param {string} playlistId
 * @returns {Promise<boolean>} `true` si se eliminó, `false` si no era del usuario.
 */
export async function removePlaylist(ownerId, playlistId) {
  requireOwner(ownerId)

  const store = getStoreFor(ownerId)
  const playlist = findOwn(store, ownerId, playlistId)

  if (!playlist) return false
  if (playlist.isFavorites) return false

  store.playlists = store.playlists.filter((candidate) => candidate.id !== playlistId)
  writeStore(store)

  return true
}

/**
 * Agrega una canción. Es idempotente: agregar dos veces la misma canción no la
 * duplica ni cambia el orden, para que el botón se pueda apretar sin miedo.
 *
 * @param {string} ownerId
 * @param {string} playlistId
 * @param {number|string} songId
 * @returns {Promise<object|null>} La playlist actualizada, o `null` si no le corresponde.
 */
export async function addSongToPlaylist(ownerId, playlistId, songId) {
  requireOwner(ownerId)

  const store = getStoreFor(ownerId)
  const playlist = findOwn(store, ownerId, playlistId)

  if (!playlist) return null

  // Se comparan como string porque el id viene del backend como number y del
  // storage puede haber quedado como texto.
  if (!playlist.songIds.some((id) => String(id) === String(songId))) {
    playlist.songIds.push(songId)
    writeStore(store)
  }

  return publicView(playlist)
}

/**
 * Saca una canción de una playlist.
 *
 * @param {string} ownerId
 * @param {string} playlistId
 * @param {number|string} songId
 * @returns {Promise<object|null>} La playlist actualizada, o `null` si no le corresponde.
 */
export async function removeSongFromPlaylist(ownerId, playlistId, songId) {
  requireOwner(ownerId)

  const store = getStoreFor(ownerId)
  const playlist = findOwn(store, ownerId, playlistId)

  if (!playlist) return null

  const nextIds = playlist.songIds.filter((id) => String(id) !== String(songId))
  const changed = nextIds.length !== playlist.songIds.length

  playlist.songIds = nextIds
  if (changed) writeStore(store)

  return publicView(playlist)
}

/**
 * Marca o desmarca una canción como favorita.
 *
 * Los favoritos son una playlist con `isFavorites`, no un estado aparte: así el
 * reproductor, la biblioteca y el detalle comparten una sola fuente de verdad.
 * Crear la playlist es lo que dispara `ensureFavoritesPlaylist`, que es el
 * comportamiento pedido en TS-09.
 *
 * @param {string} ownerId
 * @param {number|string} songId
 * @returns {Promise<{isFavorite: boolean, playlist: object}>}
 */
export async function toggleFavorite(ownerId, songId) {
  requireOwner(ownerId)

  const store = getStoreFor(ownerId)
  const playlist = ensureFavoritesPlaylist(store, ownerId)

  const wasFavorite = playlist.songIds.some((id) => String(id) === String(songId))

  playlist.songIds = wasFavorite
    ? playlist.songIds.filter((id) => String(id) !== String(songId))
    : [...playlist.songIds, songId]

  writeStore(store)

  return {
    isFavorite: !wasFavorite,
    playlist: publicView(playlist),
  }
}

/**
 * ¿La canción está entre los favoritos? Lee la playlist de favoritos sin crearla:
 * antes de marcar nada no tiene por qué existir.
 *
 * @param {string} ownerId
 * @param {number|string} songId
 * @returns {Promise<boolean>}
 */
export async function isFavorite(ownerId, songId) {
  requireOwner(ownerId)

  const store = getStoreFor(ownerId)
  const playlist = ownPlaylists(store, ownerId).find((candidate) => candidate.isFavorites)

  return Boolean(playlist?.songIds.some((id) => String(id) === String(songId)))
}

/**
 * Ids de las canciones favoritas, en el orden en que se fueron marcando.
 *
 * @param {string} ownerId
 * @returns {Promise<(number|string)[]>}
 */
export async function listFavoriteSongIds(ownerId) {
  requireOwner(ownerId)

  const store = getStoreFor(ownerId)
  const playlist = ownPlaylists(store, ownerId).find((candidate) => candidate.isFavorites)

  return playlist ? [...playlist.songIds] : []
}
