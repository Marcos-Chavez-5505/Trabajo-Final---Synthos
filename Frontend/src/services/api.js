// Instancia base de la API. Es la única que hace `fetch` en toda la app: los
// services de dominio pasan por acá y los componentes nunca llaman directo
// (regla 5 de AGENTS.md).
//
// La base es `/api` y las llamadas son relativas a propósito. En dev las redirige
// el proxy de `vite.config.js` hacia `localhost:3000`; en producción las sirve el
// reverse proxy. Así el mismo build funciona en los dos sin variables de entorno.
export const API_BASE_URL = '/api'

/**
 * Error de la API con el mensaje del backend cuando lo hay.
 *
 * Los errores del backend llegan como `{ status, message, code? }` (ver
 * `middlewares/errorHandler.js`), así que el mensaje es accionable y se muestra
 * directo en la UI en vez de inventar un texto genérico.
 */
export class ApiError extends Error {
  constructor(message, { status, code } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

// El token de la sesión vive acá y no en cada service: lo setea `authService`
// al iniciar/cerrar sesión (ver REQ-HTTP-1). Se guarda en memoria a propósito,
// no se relee de localStorage en cada request: así el service no conoce el
// formato de la sesión y no hay dos fuentes de verdad.
let authToken = null

/**
 * Registra el token que se manda como `Authorization: Bearer` en cada request.
 * `null` lo desactiva (sesión cerrada).
 */
export function setAuthToken(token) {
  authToken = token || null
}

/**
 * Callback que se dispara una sola vez cuando un request autenticado recibe
 * 401. `AuthProvider` lo usa para limpiar la sesión; las rutas protegidas se
 * encargan de redirigir solas cuando el usuario pasa a `null`.
 */
let unauthorizedHandler = null

export function setUnauthorizedHandler(handler) {
  unauthorizedHandler = handler || null
}

/**
 * Arma la URL completa con query params, descartando los vacíos.
 *
 * Se omiten `undefined`, `null` y `''` para no mandar `?query=` cuando no hay
 * término de búsqueda: el backend distingue ambos casos.
 */
function buildUrl(path, params) {
  const search = new URLSearchParams()

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return

    search.set(key, String(value))
  })

  const query = search.toString()

  return `${API_BASE_URL}${path}${query ? `?${query}` : ''}`
}

/**
 * Ejecuta un request contra la API.
 *
 * Un 401 con token adjunto significa "la sesión ya no vale": se limpia el token
 * y se avisa al handler una sola vez. Sin token (ej. login con credenciales
 * malas) el 401 es un error normal de la operación y no cierra nada.
 *
 * @param {string} method
 * @param {string} path Ruta relativa a `/api` (ej. `/songs/search`).
 * @param {object} [options]
 * @param {object} [options.body] Se serializa a JSON si viene.
 * @param {object} [options.params] Query params. Los vacíos se descartan.
 * @param {AbortSignal} [options.signal] Para cancelar la petición.
 * @returns {Promise<any>} El JSON de la respuesta. Un 204 devuelve `null`.
 * @throws {ApiError} Si la respuesta no es 2xx.
 */
async function request(method, path, { body, params, signal } = {}) {
  const hasBody = body !== undefined

  const response = await fetch(buildUrl(path, params), {
    method,
    headers: {
      Accept: 'application/json',
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    body: hasBody ? JSON.stringify(body) : undefined,
    signal,
  })

  if (response.status === 401 && authToken) {
    const handler = unauthorizedHandler

    authToken = null
    if (handler) handler()
  }

  if (response.status === 204) return null

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw new ApiError(payload?.message ?? `Error ${response.status} al pedir ${path}.`, {
      status: response.status,
      code: payload?.code,
    })
  }

  return payload
}

/** GET contra la API. */
export function get(path, { params, signal } = {}) {
  return request('GET', path, { params, signal })
}

/** POST contra la API. `body` es opcional (ej. logout no manda nada). */
export function post(path, body, { params, signal } = {}) {
  return request('POST', path, { body, params, signal })
}

/** PATCH contra la API. */
export function patch(path, body, { params, signal } = {}) {
  return request('PATCH', path, { body, params, signal })
}

/** PUT contra la API. */
export function put(path, body, { params, signal } = {}) {
  return request('PUT', path, { body, params, signal })
}

/** DELETE contra la API. */
export function del(path, { params, signal } = {}) {
  return request('DELETE', path, { params, signal })
}
