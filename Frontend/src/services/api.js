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
 * GET contra la API.
 *
 * @param {string} path Ruta relativa a `/api` (ej. `/songs/search`).
 * @param {object} [options]
 * @param {object} [options.params] Query params. Los vacíos se descartan.
 * @param {AbortSignal} [options.signal] Para cancelar la petición.
 * @returns {Promise<any>} El JSON de la respuesta.
 * @throws {ApiError} Si la respuesta no es 2xx. Un 204 devuelve `null`.
 */
export async function get(path, { params, signal } = {}) {
  const response = await fetch(buildUrl(path, params), {
    method: 'GET',
    headers: { Accept: 'application/json' },
    signal,
  })

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
