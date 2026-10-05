// Sesión contra el backend real. La API de este módulo es async y devuelve
// `{ success, user }` en register/login (el componente no maneja excepciones de
// red: se traducen a `success: false` con mensaje).
import { get, post, setAuthToken, ApiError } from './api.js'

// Guarda el token y el usuario ya mapeado (no la respuesta cruda del backend):
// así una recarga sin conexión puede reconstruir la sesión sin volver a mapear.
const SESSION_KEY = 'synthos_auth'

/**
 * Normaliza un usuario del backend al shape que usa el frontend.
 *
 * El backend habla `pictureUrl`/`biography` e `id` numérico; la UI usa
 * `avatarUrl`/`bio` e `id` string. Función pura a propósito: es el único punto
 * de traducción y también acepta un usuario ya mapeado (lo que hay guardado en
 * la sesión), por eso chequea ambos nombres.
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

function readSession() {
  try {
    const stored = localStorage.getItem(SESSION_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

function writeSession({ token, user }) {
  localStorage.setItem(SESSION_KEY, JSON.stringify({ token, user }))
}

/**
 * Cierra la sesión local: quita el token de la API y borra lo guardado.
 * Lo usan `logoutUser` y el handler de 401 de `AuthProvider`.
 */
export function clearSession() {
  setAuthToken(null)
  localStorage.removeItem(SESSION_KEY)
}

/**
 * Reconstruye la sesión al arrancar la app.
 *
 * Con sesión guardada valida el token contra `/users/me` (así un token
 * vencido no deja entrar) y refresca el usuario cacheado. Si el backend responde
 * 401/404 la sesión ya no sirve y se limpia. Si no hay red se devuelve el usuario
 * guardado para no desloguear por estar sin conexión; ante un 5xx se devuelve
 * `null` sin borrar lo guardado, para que la app pida iniciar sesión pero la
 * sesión sobreviva a un problema pasajero del servidor.
 */
export async function getCurrentUser() {
  const session = readSession()

  if (!session?.token) return null

  setAuthToken(session.token)

  try {
    const raw = await get('/users/me')
    const user = toUser(raw)

    writeSession({ token: session.token, user })

    return user
  } catch (error) {
    // Lo importante es distinguir "no hubo respuesta" de "el servidor respondió
    // con un error": un 500 también es un `ApiError`. Si el fallback se aplicaba
    // ante cualquier error, un backend roto devolvía un usuario cacheado y
    // `RequireAuth` dejaba entrar a Home sin pedir inicio de sesión.
    if (!(error instanceof ApiError)) {
      return session.user ? toUser(session.user) : null
    }

    // Token vencido o usuario que ya no existe: la sesión no sirve más y se
    // descarta, así no se reintenta en cada arranque.
    if (error.status === 401 || error.status === 404) {
      clearSession()
    }

    // Cualquier otro status (5xx) no borra lo guardado, pero tampoco habilita el
    // acceso: la guarda de ruta decide.
    return null
  }
}

export async function registerUser({ email, username, password }) {
  // Sin token viejo colgado: si quedara uno, un 401 del registro se confundiría
  // con "sesión expirada" y dispararía el handler.
  setAuthToken(null)

  try {
    const data = await post('/auth/register', { email, username, password })
    const user = toUser(data.user)

    setAuthToken(data.token)
    writeSession({ token: data.token, user })

    return { success: true, user }
  } catch (error) {
    return { success: false, message: error.message }
  }
}

export async function loginUser(email, password) {
  setAuthToken(null)

  try {
    const data = await post('/auth/login', { email, password })
    const user = toUser(data.user)

    setAuthToken(data.token)
    writeSession({ token: data.token, user })

    return { success: true, user }
  } catch (error) {
    return { success: false, message: error.message }
  }
}

export async function logoutUser() {
  try {
    await post('/auth/logout')
  } catch {
    // El logout del backend es best-effort: la sesión local se cierra igual.
  } finally {
    clearSession()
  }
}
