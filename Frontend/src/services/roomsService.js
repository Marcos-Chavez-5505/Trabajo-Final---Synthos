import { get } from './api.js'

// Salas contra `GET /api/rooms?sort=`, el endpoint que ya existía (TS-17 solo
// agrega el criterio de orden en el frontend, el backend ya ordenaba por
// `room_avg_rating.avg_rating`).
//
// A diferencia de las demás features, esta arranca CONSUMIENDO EL MOCK y no el
// endpoint: las salas de prueba del backend (`Backend/prisma/seedRooms.js`) son
// un seed idempotente, pero el criterio de TS-17 es que la pantalla tenga salas
// que mostrar siempre. Dejarla en mock hasta que TS-14 (crear sala) y TS-16
// (buscar salas) existan evita una pantalla vacía cada vez que la base no está
// levantada. Cuando esas tareas existan, se borra la rama del mock de acá y
// queda solo la llamada real: la forma de `toRoom()` ya es la del backend.
//
// El mock se importa en el service, nunca en un componente (regla 6).

const USE_MOCK = true

/**
 * Criterios de orden. Las keys son las que acepta `validateSortType` del backend
 * (`Backend/src/utils/validation.js`), no unos inventados acá: si se desincronizan,
 * el endpoint responde 400.
 *
 * El label es lo que ve la persona. "Mejor calificado" es el criterio de TS-17; el
 * otro es el que ya existía y es el default del backend.
 */
export const ROOM_SORTS = [
  { value: 'alphabetical', label: 'Alfabético' },
  { value: 'rating', label: 'Mejor calificado' },
]

export const DEFAULT_ROOM_SORT = 'alphabetical'

/**
 * Lista las salas con un criterio de orden.
 *
 * Con el mock, el orden se resuelve acá con un `sort` propio. Cuando se migre al
 * endpoint, esto pasa a ser un `?sort=` y el backend lo resuelve en SQL: el
 * `ORDER BY` sobre la vista `room_avg_rating` ya existe. La ventaja de hacerlo
 * del lado del mock es que se puede comprobar que las dos listas salen distintas
 * sin levantar Postgres.
 *
 * @param {{sort?: string, signal?: AbortSignal}} [options]
 * @returns {Promise<object[]>} Salas en el shape de la UI.
 */
export async function listRooms({ sort = DEFAULT_ROOM_SORT, signal } = {}) {
  const criterio = normaliseSort(sort)

  if (USE_MOCK) {
    const { mockRooms } = await import('../mocks/rooms.js')
    return sortRooms([...mockRooms], criterio).map(toRoom)
  }

  const data = await get('/rooms', { params: { sort: criterio }, signal })

  return sortRooms(data ?? [], criterio).map(toRoom)
}

/**
 * Valida el criterio contra la lista de `ROOM_SORTS`.
 *
 * El backend tira 400 con un criterio desconocido, pero conviene no mandar
 * siquiera la request: la sala se queda con el error en pantalla en vez de
 * cair al default en silencio.
 */
function normaliseSort(sort) {
  const value = String(sort ?? '').trim()

  return ROOM_SORTS.some((c) => c.value === value) ? value : DEFAULT_ROOM_SORT
}

/**
 * Ordena in-place según el criterio.
 *
 * `localeCompare` con `es` y `sensitivity: 'base'` para que el alfabético no
 * dependa del orden de los acentos ni de si el nombre arranca con mayúscula.
 * SQL y `localeCompare` no siempre coinciden en estos detalles, así que el
 * mock y el backend pueden diferir en los empates; el desempate por nombre en
 * el criterio de rating existe para que al menos el orden sea estable.
 *
 * Sin calificaciones van AL FINAL en ambos criterios, no con promedio 0: una
 * sala sin calificar no es "peor calificada", es "todavía sin calificar".
 */
function sortRooms(rooms, sort) {
  return rooms.sort((a, b) => {
    if (sort === 'rating') {
      const diff = ratingFor(b) - ratingFor(a)
      if (diff !== 0) return diff
    }

    return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' })
  })
}

// Una sala sin calificaciones ordena al final en ambos criterios.
function ratingFor(room) {
  if (room.hostRating === null || room.hostRating === undefined) return -Infinity

  return Number(room.hostRating)
}

/**
 * Normaliza una sala al shape de la UI.
 *
 * El endpoint devuelve la fila cruda de `room` con `avg_rating` pegado, así que
 * el nombre de las columnas viene en snake_case (`id_playlist_source`,
 * `creation_date`). El mock ya usa el shape de la UI. Acepta ambos, igual que
 * `toUser()` en `usersService`.
 *
 * `avg_rating` es `Decimal` en Prisma, así que llega como string ("5.0000") en
 * el JSON. Sin el `Number()` la tarjeta compararía string contra number.
 */
function toRoom(raw) {
  if (!raw) return null

  const avg = raw.avg_rating ?? raw.avgRating ?? raw.hostRating

  return {
    id: String(raw.id),
    code: raw.code,
    name: raw.name,
    description: raw.description ?? '',
    hostUsername: raw.hostUsername ?? null,
    // `null` (no hay fila en `host_rating`) se distingue de 0 (hay calificaciones
    // que promedian cero) para que la tarjeta pueda decir "Sin calificar".
    hostRating: avg === null || avg === undefined ? null : Number(avg),
    ratingsCount: raw.ratingsCount ?? null,
    isPrivate: Boolean(raw.is_private ?? raw.isPrivate),
    maxCapacity: raw.max_capacity ?? raw.maxCapacity ?? null,
    songIds: raw.songIds ?? [],
    status: raw.status ?? 'activa',
  }
}