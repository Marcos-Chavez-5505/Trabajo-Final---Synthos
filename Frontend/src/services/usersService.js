import { mockFollows, mockUsers } from '../mocks/users.js'

const USERS_KEY = 'synthos_mock_users'
const FOLLOWS_KEY = 'synthos_mock_follows'

// Tamaño de página de la búsqueda de personas. Igual que en `songsService`, con
// el catálogo mock completo se ven varias páginas; contra el backend real pasa a
// ser el `pageSize` de la query.
export const SEARCH_PAGE_SIZE = 4

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

function saveUsers(users) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users))
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

function withoutPassword(user) {
  if (!user) return null
  const { password: _password, ...safe } = user
  return safe
}

/**
 * Normaliza para comparar sin acentos ni mayúsculas.
 *
 * "juan" tiene que encontrar a "Juán", que es como la gente escribe el
 * término. Se usa la forma NFD y se retiran los diacríticos combinantes; el
 * `ñ` no se descompone y se resuelve aparte.
 */
function normalize(text) {
  return String(text ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ñ/g, 'n')
    .toLowerCase()
    .trim()
}

/** Acota la página a un rango que existe, como hace el backend en sus searches. */
function clampPage(page, totalPages) {
  const requested = Math.max(Number(page) || 1, 1)

  return Math.min(requested, totalPages)
}

export function listUsers() {
  return getStoredUsers().map(withoutPassword)
}

export function getUserById(id) {
  return withoutPassword(getStoredUsers().find((u) => u.id === id))
}

export function findUserByEmail(email) {
  return getStoredUsers().find(
    (u) => u.email.toLowerCase() === email.toLowerCase()
  )
}

/**
 * Busca personas por username, paginadas por número de página.
 *
 * Sigue el mismo contrato que `songsService.searchSongs()` ({ items, total,
 * page, pageSize, totalPages }) para que la paginación sea idéntica en las dos
 * pantallas de /buscar y el componente `Pagination` no cambie.
 *
 * La API es async aunque hoy resuelva sobre el mock, para que el día que pase a
 * `api.js` el componente no se entere.
 *
 * @param {string} query Texto a buscar. Vacío devuelve todos los usuarios.
 * @param {number} [page] Página 1-based.
 * @param {number} [pageSize]
 * @returns {Promise<{items: object[], total: number, page: number, pageSize: number, totalPages: number}>}
 */
export function searchUsers(query, page = 1, pageSize = SEARCH_PAGE_SIZE) {
  const term = normalize(query)

  const matched = term
    ? getStoredUsers().filter((user) => normalize(user.username).includes(term))
    : getStoredUsers()

  const total = matched.length
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const currentPage = clampPage(page, totalPages)
  const start = (currentPage - 1) * pageSize

  return Promise.resolve({
    items: matched.slice(start, start + pageSize).map(withoutPassword),
    total,
    page: currentPage,
    pageSize,
    totalPages,
  })
}

export function createUser({ email, username, password }) {
  const users = getStoredUsers()
  const user = {
    id: crypto.randomUUID(),
    email,
    username,
    password,
    avatarUrl: null,
    bio: '',
  }
  users.push(user)
  saveUsers(users)
  return withoutPassword(user)
}

export function updateProfile(id, { username, bio, avatarUrl }) {
  const users = getStoredUsers()
  const index = users.findIndex((u) => u.id === id)
  if (index === -1) {
    throw new Error('Usuario no encontrado.')
  }

  const normalizedUsername = String(username ?? '').trim()
  if (!normalizedUsername) {
    throw new Error('El nombre de usuario no puede estar vacío.')
  }

  users[index] = {
    ...users[index],
    username: normalizedUsername,
    bio: String(bio ?? ''),
    avatarUrl: avatarUrl ?? null,
  }
  saveUsers(users)
  return withoutPassword(users[index])
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
 * @throws {Error} Si alguien intenta seguirse a sí mismo (mismo CHECK que la
 *   tabla `follow`) o si alguno de los dos usuarios no existe.
 */
function assertFollowable(followerId, followingId) {
  if (followerId === followingId) {
    throw new Error('No podés seguirte a vos mismo.')
  }
  if (!getUserById(followerId) || !getUserById(followingId)) {
    throw new Error('Usuario no encontrado.')
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
