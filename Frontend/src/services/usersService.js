import { mockUsers } from '../mocks/users.js'

const USERS_KEY = 'synthos_mock_users'

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