/**
 * Modelo de la tarjeta de sala, compartido por web y mobile.
 *
 * Es una función pura: recibe la sala que devuelve la API y entrega todo lo que
 * ambas plataformas necesitan pintar, para que la única diferencia entre ellas
 * sea el render. Las reglas son las mismas que tenía la tarjeta de web.
 */

import { withRoomMock } from './roomMock.js'

const DEFAULT_CAPACITY = 10
const MAX_GUEST_SLOTS = 9
const MAX_GENRES = 3
const HEARTS = 5

export function getRoomCardModel(rawRoom) {
  // TODO: quitar el mock al integrar con el backend (la tarjeta ya lee los
  // campos tal como llegarán: isLive, genres, members y hostAvatarUrl).
  const room = withRoomMock(rawRoom)

  const hostId = room.hostId || room.hostUserId || room.ownerId
  const genres = Array.isArray(room.genres)
    ? room.genres.slice(0, MAX_GENRES)
    : []

  // La anfitriona se muestra aparte, por eso se resta 1 al cupo. El tope de 9
  // evita desbordes aunque el cupo real sea mayor.
  const capacity = room.maxCapacity ?? DEFAULT_CAPACITY
  const slots = Math.min(Math.max(0, capacity - 1), MAX_GUEST_SLOTS)
  const guests = room.members.slice(0, slots)
  const emptySlots = slots - guests.length

  const hasRatings = Boolean(room.ratingsCount)
  const rounded = Math.max(
    0,
    Math.min(HEARTS, Math.round(Number(room.hostRating) || 0)),
  )

  return {
    room,
    isLive: Boolean(room.isLive),
    genres,
    hostId,
    guests,
    emptySlots,
    capacity,
    membersLabel: `${room.membersCount} de ${capacity} personas en la sala`,
    isFull: room.maxCapacity !== null && room.membersCount >= room.maxCapacity,
    heartsFilled: hasRatings ? rounded : 0,
    ratingLabel: hasRatings
      ? `${Number(room.hostRating).toFixed(2)} de 5, ${room.ratingsCount} ${
          room.ratingsCount === 1 ? 'persona calificó' : 'personas calificaron'
        }`
      : 'Sin calificaciones',
  }
}
