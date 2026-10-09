import { get, post, del, patch, ApiError } from './api.js'

// Tamaño de página de la búsqueda de personas. Igual que en `songsService`, con
// el catálogo completo se ven varias páginas; contra el backend real es el
// `pageSize` de la query.
export const SEARCH_PAGE_SIZE = 4

/**
 * Normaliza un usuario del backend al shape que usa el frontend.
 *
 * El backend habla `pictureUrl`/`biography` e `id` numérico; la UI usa
 * `avatarUrl`/`bio` e `id` string. Igual que en `authService`, acepta también un
 * usuario ya mapeado (lo que guarda la sesión) chequeando los dos nombres.
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
    items: (data.items ?? []).map((raw) => ({
      ...toUser(raw),
      // TS-10b: con sesión el backend agrega la relación en los dos sentidos:
      // si el que busca ya sigue a la persona (`isFollowing`) y si esa persona
      // lo sigue a él (`followsMe`). Sin sesión los campos no vienen y quedan
      // falsos.
      isFollowing: Boolean(raw.isFollowing),
      followsMe: Boolean(raw.followsMe),
    })),
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
// El seguimiento ya está migrado al backend: `POST`/`DELETE /api/users/:id/follow`
// y `GET /api/users/:id/followers|following` (ver docs/REQUERIMIENTOS-BACKEND.md §6).

// El Sidebar (y cualquier pantalla ya montada) no se remonta al seguir o dejar
// de seguir desde otra vista, así que `ProfileSummary` y los perfiles quedarían
// con contadores viejos. Estas mutaciones avisan para que vuelvan a pedir el
// estado.
const followListeners = new Set()

/**
 * Suscribe un callback a los cambios de seguimiento.
 *
 * @param {() => void} listener
 * @returns {() => void} Función para desuscribirse.
 */
export function subscribeToFollow(listener) {
  followListeners.add(listener)

  return () => followListeners.delete(listener)
}

function notifyFollowChanged() {
  followListeners.forEach((listener) => listener())
}

/**
 * Cuenta los contadores de una persona.
 *
 * Los contadores se piden juntos y no derivando del largo de las listas: el
 * backend los devuelve calculados en `GET /api/users/:id`.
 *
 * @param {string} userId Dueño de la relación.
 * @returns {Promise<{followers: number, following: number}>}
 */
export async function getFollowCounts(userId) {
  const data = await get(`/users/${userId}`)

  return {
    followers: data.followerCount ?? 0,
    following: data.followingCount ?? 0,
  }
}

/**
 * ¿La primera persona sigue a la segunda?
 *
 * Se resuelve contra los seguidores de la segunda: si el primero está en esa
 * lista, la relación existe. El backend no expone un endpoint directo para la
 * relación.
 *
 * @returns {Promise<boolean>}
 */
export async function isFollowing(followerId, followingId) {
  const data = await get(`/users/${followingId}/followers`)

  return (data.followers ?? []).some((user) => String(user.id) === String(followerId))
}

/**
 * A quién sigue una persona.
 *
 * @param {string} userId
 * @returns {Promise<object[]>} Usuarios sin contraseña. El service no ordena: el
 *   endpoint trae su propio criterio (más reciente primero).
 */
export async function listFollowing(userId) {
  const data = await get(`/users/${userId}/following`)

  return (data.following ?? []).map(toUser)
}

/**
 * Quién sigue a una persona.
 *
 * @param {string} userId
 * @returns {Promise<object[]>} Usuarios sin contraseña.
 */
export async function listFollowers(userId) {
  const data = await get(`/users/${userId}/followers`)

  return (data.followers ?? []).map(toUser)
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
  const [counts, following] = await Promise.all([
    getFollowCounts(followingId),
    isFollowing(followerId, followingId),
  ])

  return {
    isFollowing: following,
    followerCount: counts.followers,
    followingCount: counts.following,
  }
}

/**
 * Valida la pareja. Solo chequea que no sea seguirse a sí mismo (mismo CHECK
 * que la tabla `follow`); la existencia de los usuarios la valida el backend.
 *
 * @throws {Error} Si alguien intenta seguirse a sí mismo.
 */
function assertFollowable(followerId, followingId) {
  if (String(followerId) === String(followingId)) {
    throw new Error('No podés seguirte a vos mismo.')
  }
}

/**
 * Sigue a una persona. Inmediato y sin aprobación.
 *
 * Idempotente: seguir dos veces no crea el par dos veces ni tira error; el
 * backend responde 200 en ambos casos.
 *
 * @returns {Promise<{isFollowing: boolean, followerCount: number, followingCount: number}>}
 */
export async function followUser(followerId, followingId) {
  assertFollowable(followerId, followingId)

  await post(`/users/${followingId}/follow`)
  notifyFollowChanged()

  return relationState(followerId, followingId)
}

/**
 * Dejar de seguir. También idempotente: unfollow de algo que no seguías no es
 * un error (el backend responde 404 y acá se traga).
 *
 * @returns {Promise<{isFollowing: boolean, followerCount: number, followingCount: number}>}
 */
export async function unfollowUser(followerId, followingId) {
  try {
    await del(`/users/${followingId}/follow`)
    notifyFollowChanged()
  } catch (error) {
    if (!(error instanceof ApiError && error.status === 404)) throw error
  }

  return relationState(followerId, followingId)
}
