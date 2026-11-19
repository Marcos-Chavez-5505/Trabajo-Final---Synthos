import { toRoomCardFields } from '../../services/roomsService.js'

/**
 * Aplica un `room:card-updated` a una lista ya cargada.
 *
 * - Actualiza solo la sala afectada.
 * - Ignora ids que no estén en la lista (las salas nuevas no aparecen en vivo).
 * - Reutiliza `toRoomCardFields`, el mismo mapper que `toRoom`, así que los
 *   géneros se traducen una sola vez.
 */
export function applyRoomCardUpdate(rooms, update) {
  if (!Array.isArray(rooms) || !update) return rooms

  const index = rooms.findIndex(
    (room) => String(room.id) === String(update.roomId),
  )

  if (index === -1) return rooms

  const next = [...rooms]

  next[index] = { ...next[index], ...toRoomCardFields(update) }

  return next
}

/** Saca una sala de la lista (`room:card-removed`). Ignora ids desconocidos. */
export function removeRoomFromList(rooms, roomId) {
  if (!Array.isArray(rooms)) return rooms

  const next = rooms.filter((room) => String(room.id) !== String(roomId))

  return next.length === rooms.length ? rooms : next
}
