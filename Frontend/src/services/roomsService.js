import { del, get, post } from './api.js'
import { toSong } from './songsService.js'

// Salas contra `GET /api/rooms` y el resto de los endpoints de sala.
//
// El service es el único punto que traduce el contrato del backend al shape que
// usa la UI, así que las columnas snake_case de la fila cruda y la envolvente
// `{ status, room }` de los endpoints con sesión se resuelven acá, nunca en los
// componentes (regla 5).
//
// La lista pública y la de "Mis Salas" comparten la misma forma de fila, así que
// las dos entran por `toRoom`.

// El Sidebar vive arriba de la ruta, así que "Mis Salas" no se remonta al unirse o
// salir de una sala desde otra pantalla. Estas mutaciones avisan a quien está
// subscripto para que vuelva a pedir la lista sin recargar la página.
const listeners = new Set()

/**
 * Suscribe un callback a los cambios de salas del usuario.
 *
 * @param {() => void} listener
 * @returns {() => void} Función para desuscribirse.
 */
export function subscribeToRooms(listener) {
  listeners.add(listener)

  return () => listeners.delete(listener)
}

function notifyRoomsChanged() {
  listeners.forEach((listener) => listener())
}

/**
 * Criterios de orden. Las keys son las que acepta `validateSortType` del backend
 * (`Backend/src/utils/validation.js`), no unas inventadas acá: si se
 * desincronizan, el endpoint responde 400.
 *
 * "Mejor calificado" ordena por el promedio del anfitrión (TS-17). Como la
 * calificación es una sola estrella por participanta, en la práctica el criterio
 * separa las salas con calificación de las que todavía no tienen.
 */
export const ROOM_SORTS = [
  { value: 'name', label: 'Nombre' },
  { value: 'rating', label: 'Mejor calificado' },
]

export const DEFAULT_ROOM_SORT = 'name'

export const ROOM_ORDERS = [
  { value: 'asc', label: 'Ascendente' },
  { value: 'desc', label: 'Descendente' },
]

export const DEFAULT_ROOM_ORDER = 'asc'

// actions de `POST /api/rooms/:id/playback`
const PLAYBACK_ACTIONS = ['play', 'pause', 'next', 'stop']

/**
 * Busca salas públicas y activas por nombre de sala o por nombre del anfitrión.
 *
 * El orden lo resuelve el servidor (B21): el service solo normaliza los
 * parámetros para no mandar requests con valores que el backend va a rechazar
 * con 400.
 *
 * @param {{query?: string, sort?: string, order?: string, signal?: AbortSignal}} [options]
 * @returns {Promise<object[]>} Salas en el shape de la UI, en el orden pedido.
 */
export async function searchRooms({ query = '', sort, order, signal } = {}) {
  const data = await get('/rooms', {
    params: {
      query: String(query ?? '').trim(),
      sort: normaliseSort(sort),
      order: normaliseOrder(order),
    },
    signal,
  })

  return (data ?? []).map(toRoom)
}

/**
 * Salas de las que el usuario es miembro (grupo "Mis Salas" del Sidebar).
 *
 * A diferencia del listado público, acá entran también las privadas: a esas se
 * entra con el código (D14).
 *
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Promise<object[]>}
 */
export async function listMyRooms({ signal } = {}) {
  const data = await get('/rooms/mine', { signal })

  return (data ?? []).map(toRoom)
}

/**
 * Crea una sala a partir de una playlist que tenga canciones.
 *
 * La fuente puede ser una personal propia o una colaborativa de la que
 * participe (D19): el backend acepta cualquiera de las dos. El cupo y el estado
 * los pone el servidor, no el cliente.
 *
 * @param {{name: string, description?: string, playlistId: number|string, isPrivate: boolean, password?: string}} data
 * @returns {Promise<object>} La sala recién creada, con miembros y canciones.
 */
export async function createRoom({ name, description, playlistId, isPrivate, password }) {
  const data = await post('/rooms', {
    name,
    description: description || '',
    playlistId: Number(playlistId),
    isPrivate: Boolean(isPrivate),
    password: isPrivate ? password : '',
  })

  notifyRoomsChanged()

  return toRoomDetail(data?.room)
}

/**
 * Entra a una sala por su código, que es la única vía a las privadas (D14).
 *
 * @param {string} code
 * @param {string} [password] Solo hace falta en las salas privadas.
 * @returns {Promise<object>} La sala a la que se unió, con miembros y canciones.
 */
export async function joinRoom(code, password) {
  const data = await post('/rooms/join', {
    code: String(code ?? '').trim().toUpperCase(),
    password: password ?? '',
  })

  notifyRoomsChanged()

  return toRoomDetail(data?.room)
}

/**
 * Sale de la sala. Si quien sale es el anfitrión, la sala se cierra (D16).
 *
 * @param {number|string} roomId
 * @returns {Promise<boolean>} `false` si el backend dijo que no era miembro.
 */
export async function leaveRoom(roomId) {
  try {
    await post(`/rooms/${roomId}/leave`)
  } catch (cause) {
    if (cause?.status === 404) return false
    throw cause
  }

  notifyRoomsChanged()

  return true
}

/**
 * Detalle de una sala: la sala, sus miembros y las canciones de la playlist fuente.
 *
 * El backend exige ser miembro (403 si no), así que esto solo se llama desde la
 * pantalla de la sala.
 *
 * @param {number|string} roomId
 * @returns {Promise<object|null>} `null` si la sala no existe.
 */
export async function getRoomById(roomId) {
  try {
    const data = await get(`/rooms/${roomId}`)

    return toRoomDetail(data?.room)
  } catch (cause) {
    if (cause?.status === 404) return null
    throw cause
  }
}

/**
 * Cierra la sala (solo el anfitrión). Todos los miembros reciben `room:closed`.
 *
 * @param {number|string} roomId
 * @returns {Promise<boolean>}
 */
export async function closeRoom(roomId) {
  await del(`/rooms/${roomId}`)

  notifyRoomsChanged()

  return true
}

/**
 * Expulsa a un miembro (solo el anfitrión).
 *
 * @param {number|string} roomId
 * @param {number|string} userId
 * @returns {Promise<boolean>}
 */
export async function kickMember(roomId, userId) {
  await del(`/rooms/${roomId}/members/${userId}`)

  return true
}

/**
 * Estado de reproducción y de la votación de la sala.
 *
 * El estado de reproducción vive en memoria del servidor, así que `updatedAt`
 * es la hora del servidor: la posición se interpola con ella y nunca con el
 * reloj de este dispositivo.
 *
 * @param {number|string} roomId
 * @returns {Promise<{playback: object, skipVotes: object}>}
 */
export async function getPlayback(roomId) {
  const data = await get(`/rooms/${roomId}/playback`)

  return {
    playback: toPlayback(data?.playback),
    skipVotes: toSkipVotes(data?.skipVotes),
  }
}

/**
 * Manda una acción de reproducción al servidor (solo el anfitrión).
 *
 * El estado no se cambia en el cliente: el servidor lo actualiza y lo emite por
 * `room:playback`, que es lo que keeps a todos los miembros alineados.
 *
 * @param {number|string} roomId
 * @param {'play'|'pause'|'next'|'stop'} action
 * @returns {Promise<object>} El estado de reproducción ya actualizado.
 */
export async function controlPlayback(roomId, action) {
  if (!PLAYBACK_ACTIONS.includes(action)) {
    throw new Error(`Acción de reproducción desconocida: ${action}`)
  }

  const data = await post(`/rooms/${roomId}/playback`, { action })

  return toPlayback(data?.playback)
}

/**
 * Vota para saltar la canción actual (solo para quienes no son anfitrión).
 *
 * @param {number|string} roomId
 * @returns {Promise<{skipVotes: object, approved: boolean}>} `approved` es `true`
 *   cuando este voto alcanzó la mayoría y la canción ya avanzó.
 */
export async function voteSkip(roomId) {
  const data = await post(`/rooms/${roomId}/skip-votes`)

  return {
    skipVotes: toSkipVotes(data?.skipVotes),
    approved: Boolean(data?.approved),
  }
}

/**
 * Califica al anfitrión de la sala (TS-11). Una vez por persona y sala.
 *
 * @param {number|string} roomId
 * @param {number} rating
 * @returns {Promise<boolean>} `false` si el backend rechazó la calificación.
 */
export async function rateHost(roomId, rating) {
  try {
    await post(`/rooms/${roomId}/rating`, { rating: Number(rating) })
  } catch (cause) {
    if (cause?.status === 403 || cause?.status === 409) return false
    throw cause
  }

  return true
}

/**
 * Valida el criterio contra la lista de `ROOM_SORTS`.
 *
 * El backend tira 400 con un criterio desconocido, pero conviene no mandar
 * siquiera la request: la sala se queda con el error en pantalla en vez de
 * caer al default en silencio.
 */
function normaliseSort(sort) {
  const value = String(sort ?? '').trim()

  return ROOM_SORTS.some((c) => c.value === value) ? value : DEFAULT_ROOM_SORT
}

function normaliseOrder(order) {
  const value = String(order ?? '').trim().toLowerCase()

  return ROOM_ORDERS.some((c) => c.value === value) ? value : DEFAULT_ROOM_ORDER
}

/**
 * Normaliza una fila del listado al shape de la UI.
 *
 * El listado devuelve columnas crudas de Postgres en snake_case (`max_capacity`,
 * `host_username`, `avg_rating`, `members_count`), así que la traducción vive
 * acá y no en la tarjeta.
 *
 * `avg_rating` es `numeric` en Postgres, o sea llega como string ("5"), y el
 * backend coalescea a 0 cuando el anfitrión no tiene calificaciones. Para la UI
 * eso NO es "calificado con cero": se traduce a `null`, que es lo que permite
 * distinguir "Sin calificaciones" de una calificación real.
 */
function toRoom(raw) {
  if (!raw) return null

  const avg = raw.avg_rating ?? raw.avgRating ?? raw.hostRating ?? null
  const rating = avg === null ? null : Number(avg)

  return {
    id: String(raw.id),
    code: raw.code,
    name: raw.name,
    description: raw.description ?? '',
    hostId: raw.host_id ?? raw.hostId ?? null,
    hostUsername: raw.host_username ?? raw.hostUsername ?? null,
    // `null` = sin calificaciones todavía; `0` =afarió y promedia cero.
    hostRating: rating === 0 ? null : rating,
    membersCount: Number(raw.members_count ?? raw.membersCount ?? 0),
    songsCount: Number(raw.songs_count ?? raw.songsCount ?? 0),
    isPrivate: Boolean(raw.is_private ?? raw.isPrivate),
    maxCapacity: raw.max_capacity ?? raw.maxCapacity ?? null,
    status: raw.status ?? 'activa',
  }
}

/**
 * Traduce la sala que viene de los endpoints con sesión, que usan los nombres de
 * Prisma (camelCase) y traen anidados los miembros y las canciones.
 *
 * La respuesta nunca trae `password_hash` (el backend lo saca antes de
 * responder), así que acá no hay nada que filtrar.
 */
function toRoomDetail(raw) {
  if (!raw) return null

  const playlist = raw.playlistSource ?? raw.playlist_source ?? null
  const avg = raw.hostAvgRating ?? raw.host_avg_rating ?? null

  return {
    ...toRoom({
      ...raw,
      avg_rating: avg,
      members_count: (raw.members ?? []).length,
      songs_count: (playlist?.songs ?? []).length,
    }),
    members: (raw.members ?? []).map(toRoomMember),
    songs: (playlist?.songs ?? []).map((row) => toSong(row.song)),
    playlistName: playlist?.name ?? '',
    // Si la persona que mira ya calificó al anfitrión de esta sala, así el botón
    // se deshabilita incluso al recargar (no solo durante la sesión).
    viewerHasRated: Boolean(raw.viewerHasRated ?? raw.viewer_has_rated),
  }
}

function toRoomMember(raw) {
  return {
    userId: String(raw.idUser ?? raw.id_user ?? raw.user?.id),
    username: raw.user?.username ?? '',
    avatarUrl: raw.user?.pictureUrl ?? null,
    role: raw.role,
  }
}

function toPlayback(raw) {
  return {
    songId: raw?.songId ?? null,
    // "playing" | "paused" | "stopped"
    status: raw?.status ?? 'stopped',
    positionMs: Number(raw?.positionMs ?? 0),
    // Hora del servidor en el momento de esta respuesta. Es lo que permite medir
    // el desvío entre el reloj de este dispositivo y el del servidor: sin eso,
    // interpolar `positionMs` con `Date.now()` del cliente mezcla dos relojes y
    // la posición sale corrida.
    updatedAt: Number(raw?.updatedAt ?? 0),
    serverTime: Number(raw?.serverTime ?? 0),
  }
}

function toSkipVotes(raw) {
  return {
    voters: (raw?.voters ?? []).map(String),
    required: Number(raw?.required ?? 0),
    hasVoted: Boolean(raw?.hasVoted),
  }
}