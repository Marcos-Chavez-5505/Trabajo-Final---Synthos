import { useCallback, useSyncExternalStore } from 'react'

/**
 * Historial de búsquedas por usuario en localStorage.
 *
 * El estado vive fuera de React en un store por usuario para que dos pestañas
 * abiertas con la misma cuenta se mantengan sincronizadas: el evento `storage`
 * del navegador no llega a la pestaña que escribió, así que cada escritura
 * notifica a sus propias suscriptoras y el evento cubre a las demás.
 *
 * Sin `userId` (sesión cerrada) el hook no lee ni escribe: las claves de otros
 * usuarios quedan en el disco pero nunca se exponen.
 */

const MAX_SEARCHES = 8
const MAX_TERM_LENGTH = 100
const STORAGE_PREFIX = 'recent-searches:'
const EMPTY = []

const listeners = new Set()
/** Última lectura por usuario: `getSnapshot` tiene que devolver lo mismo entre renders. */
const cache = new Map()

function notify() {
  listeners.forEach((listener) => listener())
}

function storageKey(userId) {
  return `${STORAGE_PREFIX}${userId}`
}

function normalizeTerm(term) {
  return typeof term === 'string' ? term.trim().slice(0, MAX_TERM_LENGTH) : ''
}

function read(userId) {
  if (!userId) return EMPTY

  const cached = cache.get(userId)
  if (cached) return cached

  let searches = EMPTY
  try {
    const raw = window.localStorage.getItem(storageKey(userId))
    const parsed = raw ? JSON.parse(raw) : []

    if (Array.isArray(parsed)) {
      // Se revalida lo guardado: pudo escribirlo una versión anterior o a mano.
      const seen = new Set()
      searches = []
      for (const entry of parsed) {
        const term = normalizeTerm(entry)
        const key = term.toLocaleLowerCase()
        if (!term || seen.has(key)) continue
        seen.add(key)
        searches.push(term)
        if (searches.length === MAX_SEARCHES) break
      }
    }
  } catch {
    searches = EMPTY
  }

  cache.set(userId, searches)
  return searches
}

function write(userId, searches) {
  if (!userId) return

  cache.set(userId, searches)
  try {
    if (searches.length > 0) {
      window.localStorage.setItem(storageKey(userId), JSON.stringify(searches))
    } else {
      window.localStorage.removeItem(storageKey(userId))
    }
  } catch {
    // Sin storage (modo privado lleno, permisos) el historial sigue en memoria.
  }
  notify()
}

function subscribe(listener) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (!event.key || !event.key.startsWith(STORAGE_PREFIX)) return
    cache.delete(event.key.slice(STORAGE_PREFIX.length))
    notify()
  })
}

/**
 * @param {string|number|null|undefined} userId Dueño del historial.
 * @returns {{ searches: string[], add: (term: string) => void, remove: (term: string) => void, clear: () => void }}
 */
export default function useRecentSearches(userId) {
  const key = userId == null ? '' : String(userId)

  const searches = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => EMPTY,
  )

  const add = useCallback(
    (term) => {
      const value = normalizeTerm(term)
      if (!key || !value) return

      const rest = read(key).filter(
        (entry) => entry.toLocaleLowerCase() !== value.toLocaleLowerCase(),
      )
      write(key, [value, ...rest].slice(0, MAX_SEARCHES))
    },
    [key],
  )

  const remove = useCallback(
    (term) => {
      if (!key) return

      const target = normalizeTerm(term).toLocaleLowerCase()
      const current = read(key)
      const next = current.filter(
        (entry) => entry.toLocaleLowerCase() !== target,
      )
      if (next.length !== current.length) write(key, next)
    },
    [key],
  )

  const clear = useCallback(() => {
    if (!key) return
    write(key, EMPTY)
  }, [key])

  return { searches, add, remove, clear }
}
