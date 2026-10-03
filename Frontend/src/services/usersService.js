import { mockFollows, mockUsers } from '../mocks/users.js'
import { get, patch, ApiError } from './api.js'

const USERS_KEY = 'synthos_mock_users'
const FOLLOWS_KEY = 'synthos_mock_follows'

// Tamaño de página de la búsqueda de personas. Igual que en `songsService`, con
// el catálogo mock completo se ven varias páginas; contra el backend real pasa a
// ser el `pageSize` de la query.
export const SEARCH_PAGE_SIZE = 4

/**
 * Normaliza un usuario del backend al shape que usa el frontend.
 *
 * El backend habla `pictureUrl`/`biography` e `id` numérico; la UI usa
 * `avatarUrl`/`bio` e `id` string. Igual que en `authService`, acepta también un
 * usuario ya mapeado (lo que guarda el mock de follow y la sesión) chequeando
 * los dos nombres.
 */
function toUser(raw) {
  if (!raw) return null

  return {
    id: String(raw.id),
    email: raw.email ?? null,
    username: raw.username,
    avatarUrl: raw.pictureUrl ?? raw.picture_url ?? raw.avatarUrl ?? null,
    bio: raw.biography ?? raw.bio ?? '',
  }
}

// --- usuarios mock, solo para el seguimiento (TS-10) -------------------------
//
// El seguimiento sigue sobre el mock (ver REQUERIMIENTOS-BACKEND.md §11 paso 4):
// mientras eso no migre, las listas y los contadores resuelven contra estos
// usuarios. Los perfiles reales traen `id` numérico y no van a matchear con el
// mock, así que sus listas aparecerán vacías hasta migrar follow.
function getStoredUsers() {
  let parsed = null
  try {
    const stored = localStorage.getItem(USERS_KEY)
    parsed = stored ? JSON.parse(stored) : null
  } catch {
    parsed = null
  }
  if (Array.isArray(parsed)) return parsed

  const seeded = mockUsers.slice()
  localStorage.setItem(USERS_KEY, JSON.stringify(seeded))
  return seeded
}

function withoutPassword(user) {
  if (!user) return null
  const { password: _password, ...safe } = user
  return safe
}

/**
 * Relaciones de seguimiento, con la misma política de siembra que los usuarios:
 * si no hay nada guardado entra `mockFollows` una sola vez.
 */
function getStoredFollows() {
  let parsed = null
  try {
    const stored = localStorage.getItem(FOLLOWS_KEY)
    parsed = stored ? JSON.parse(stored) : null
  } catch {
    parsed = null
  }
  if (Array.isArray(parsed)) return parsed

  const seeded = mockFollows.slice()
  localStorage.setItem(FOLLOWS_KEY, JSON.stringify(seeded))
  return seeded
}

function saveFollows(follows) {
  localStorage.setItem(FOLLOWS_KEY, JSON.stringify(follows))
}

// -----------------------------------------------------------------------------

/**
 * Perfil público de una persona.
 *
 * `null` cuando el backend responde 404 se traduce a `null` (no encontrado) en
 * vez de tirar: la pantalla distingue "no existe" de "falló la red".
 *
 * @param {string|number} id
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Promise<object|null>}
 */
export async function getUserById(id, { signal } = {}) {
  try {
    const data = await get(`/users/${id}`, { signal })
    return toUser(data)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null
    throw error
  }
}

/**
 * Busca personas por username o género, paginadas por número de página.
 *
 * Mismo contrato que `songsService.searchSongs()` ({ items, total, page,
 * pageSize, totalPages }) para que `Pagination` sea idéntica en las dos
 * pantallas de /buscar.
 *
 * @param {string} query Texto a buscar. Vacío devuelve todos.
 * @param {number} [page] Página 1-based.
 * @param {number} [pageSize]
 * @param {{signal?: AbortSignal}} [options]
 * @returns {Promise<{items: object[], total: number, page: number, pageSize: number, totalPages: number}>}
 */
export async function searchUsers(query = '', page = 1, pageSize = SEARCH_PAGE_SIZE, { signal } = {}) {
  const data = await get('/users/search', {
    params: { query, page, pageSize },
    signal,
  })

  return {
    items: (data.items ?? []).map(toUser),
    total: data.total ?? 0,
    page: data.page ?? 1,
    pageSize: data.pageSize ?? pageSize,
    totalPages: data.totalPages ?? 1,
  }
}

/**
 * Edita el perfil de la sesión. No recibe id: el backend lo saca del token.
 *
 * Traduce los nombres de la UI a los del backend (`bio`→`biography`,
 * `avatarUrl`→`pictureUrl`) y devuelve el usuario en el shape del frontend.
 *
 * @returns {Promise<object>}
 */
export async function updateProfile({ username, bio, avatarUrl }) {
  const data = await patch('/users/me', {
    username,
    biography: bio,
    pictureUrl: avatarUrl,
  })

  return toUser(data)
}

// ---------------------------------------------------------------- seguimiento
//
// Todas las funciones reciben explícitamente quién sigue y a quién. Ninguna
// lee la sesión: `authService` es el dueño de la sesión y ya importa este
// módulo, así que leerla desde acá crearía un ciclo de imports. El componente
// pasa `user.id` de `useAuth()`.
//
// La firma async es la definitiva: contra el backend esto pasa a ser
// `POST /api/users/:id/follow` (ver REQUERIMIENTOS-BACKEND.md §6).

/**
 * Cuenta los contadores de una persona.
 *
 * Los contadores se piden juntos y no derivando del largo de las listas: con 500
 * seguidores no tiene sentido traerlos todos para mostrar "500".
 *
 * @param {string} userId Dueño de la relación.
 * @returns {Promise<{followers: number, following: number}>}
 */
export function getFollowCounts(userId) {
  const follows = getStoredFollows()

  return Promise.resolve({
    followers: follows.filter((f) => f.followingId === userId).length,
    following: follows.filter((f) => f.followerId === userId).length,
  })
}

/**
 * ¿La primera persona sigue a la segunda?
 *
 * @returns {Promise<boolean>}
 */
export function isFollowing(followerId, followingId) {
  return Promise.resolve(
    getStoredFollows().some(
      (f) => f.followerId === followerId && f.followingId === followingId
    )
  )
}

/**
 * A quién sigue una persona.
 *
 * @param {string} userId
 * @returns {Promise<object[]>} Usuarios sin contraseña. El service no ordena: el
 *   endpoint trae su propio criterio y las listas son cortas en el mock.
 */
export function listFollowing(userId) {
  const users = getStoredUsers()

  return Promise.resolve(
    getStoredFollows()
      .filter((f) => f.followerId === userId)
      .map((f) => users.find((u) => u.id === f.followingId))
      .filter(Boolean)
      .map(withoutPassword)
  )
}

/**
 * Quién sigue a una persona.
 *
 * @param {string} userId
 * @returns {Promise<object[]>} Usuarios sin contraseña.
 */
export function listFollowers(userId) {
  const users = getStoredUsers()

  return Promise.resolve(
    getStoredFollows()
      .filter((f) => f.followingId === userId)
      .map((f) => users.find((u) => u.id === f.followerId))
      .filter(Boolean)
      .map(withoutPassword)
  )
}

/**
 * Estado de la relación con sus contadores, para que el botón y los
 * contadores del perfil se actualicen con una sola respuesta.
 *
 * @param {string} followerId Quién sigue.
 * @param {string} followingId A quién.
 * @returns {Promise<{isFollowing: boolean, followerCount: number, followingCount: number}>}
 *   Los contadores son **de `followingId`**, que es la persona cuyo perfil se
 *   está mirando: al seguir a alguien, el número que cambia en pantalla es el
 *   de sus seguidores, no el nuestro.
 */
async function relationState(followerId, followingId) {
  const counts = await getFollowCounts(followingId)

  return {
    isFollowing: await isFollowing(followerId, followingId),
    followerCount: counts.followers,
    followingCount: counts.following,
  }
}

/**
 * Valida la pareja y devuelve el estado actual, sin escribir nada.
 *
 * Solo chequea que no sea seguirse a sí mismo (mismo CHECK que la tabla
 * `follow`). La existencia de los usuarios ya no se valida contra el mock: los
 * perfiles reales vienen del backend con `id` numérico y no están en el store
 * mock, así que esa comprobación rechazaría gente que sí existe.
 *
 * @throws {Error} Si alguien intenta seguirse a sí mismo.
 */
function assertFollowable(followerId, followingId) {
  if (followerId === followingId) {
    throw new Error('No podés seguirte a vos mismo.')
  }
}

/**
 * Sigue a una persona. Inmediato y sin aprobación.
 *
 * Idempotente: seguir dos veces no crea el par dos veces ni tira error, que es
 * lo mismo que se pidió para el backend en REQUERIMIENTOS-BACKEND.md §6.
 *
 * @returns {Promise<{isFollowing: boolean, followerCount: number, followingCount: number}>}
 */
export async function followUser(followerId, followingId) {
  assertFollowable(followerId, followingId)

  const follows = getStoredFollows()
  const already = follows.some(
    (f) => f.followerId === followerId && f.followingId === followingId
  )

  if (!already) {
    follows.push({ followerId, followingId })
    saveFollows(follows)
  }

  return relationState(followerId, followingId)
}

/**
 * Dejar de seguir. También idempotente: unfollow de algo que no seguías no es
 * un error.
 *
 * @returns {Promise<{isFollowing: boolean, followerCount: number, followingCount: number}>}
 */
export async function unfollowUser(followerId, followingId) {
  const follows = getStoredFollows()

  saveFollows(
    follows.filter(
      (f) => !(f.followerId === followerId && f.followingId === followingId)
    )
  )

  return relationState(followerId, followingId)
}
