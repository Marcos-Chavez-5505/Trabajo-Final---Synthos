import { useCallback, useEffect, useRef, useState } from 'react'
import {
  leaveRoomChannel,
  subscribeToRoomEvent,
} from '../../services/socketService.js'

// Código estable que el backend manda tanto en el 403 de `GET /rooms/:id`
// (y playback/skip-votes) como en el evento `error` de `join-room` cuando el
// usuario ya no es miembro. Ver `docs/ESPECIFICACIONES-BACKEND.md`.
const ACCESS_LOST_CODE = 'ROOM_ACCESS_LOST'

const REASONS = new Set(['inactivity', 'kicked', 'not_member', 'other_room'])

/**
 * Detector único de pérdida de acceso a una sala.
 *
 * Junta las formas en que el cliente se entera de que lo sacaron o de que la
 * sala dejó de ser la suya:
 *  - `room:expelled` (evento del job de inactividad, canal `user:<id>`);
 *  - `room:kicked` (kick manual del anfitrión, canal `user:<id>`);
 *  - `room:current-changed` (cambió de sala desde otra pestaña o
 *    dispositivo, canal `user:<id>`);
 *  - `error` de `join-room` al reconectar (`code: "ROOM_ACCESS_LOST"`);
 *  - un 403 de la API con `code: "ROOM_ACCESS_LOST"` (`reportError`).
 *
 * Dispara `onLost(reason)` una sola vez aunque lleguen varios casi juntos, y
 * saca la sala de `joinedChannels` para que la próxima reconexión no vuelva a
 * pedir `join-room` (eso sería un reintento en loop sobre una sala perdida).
 *
 * No navega ni muestra nada: cada plataforma decide el toast y la redirección.
 *
 * @param {number|string} roomId
 * @param {{ onLost?: (reason: 'inactivity'|'kicked'|'not_member'|'other_room') => void }} [options]
 * @returns {{ lost: null|'inactivity'|'kicked'|'not_member'|'other_room', reportError: (cause: unknown) => boolean }}
 */
export default function useRoomAccessGuard(roomId, { onLost } = {}) {
  const id = Number(roomId)
  const [lost, setLost] = useState(null)
  const handledRef = useRef(false)
  const onLostRef = useRef(onLost)

  // El callback puede cambiar entre renders (por ejemplo al cambiar de sala):
  // se guarda en un ref para no re-suscribir los listeners.
  useEffect(() => {
    onLostRef.current = onLost
  })

  // Sala nueva en la misma pantalla: se vuelve a habilitar el aviso.
  useEffect(() => {
    handledRef.current = false
    setLost(null)
  }, [id])

  const loseAccess = useCallback(
    (reason) => {
      if (handledRef.current) return true

      handledRef.current = true

      const normalized = REASONS.has(reason) ? reason : 'not_member'

      // Sin esto, cada reconexión volvería a emitir `join-room` y el servidor
      // respondería otra vez que no hay membresía.
      leaveRoomChannel(id)

      setLost(normalized)
      onLostRef.current?.(normalized)

      return true
    },
    [id],
  )

  useEffect(() => {
    if (!Number.isInteger(id) || id <= 0) return undefined

    const isThisRoom = (payload) => Number(payload?.roomId) === id

    const offExpelled = subscribeToRoomEvent('room:expelled', (payload) => {
      if (isThisRoom(payload)) loseAccess(payload?.reason ?? 'inactivity')
    })

    const offKicked = subscribeToRoomEvent('room:kicked', (payload) => {
      // Filtrado por sala: un kick en otra sala no debe sacarte de esta.
      if (isThisRoom(payload)) loseAccess('kicked')
    })

    const offError = subscribeToRoomEvent('error', (payload) => {
      if (payload?.code === ACCESS_LOST_CODE && isThisRoom(payload)) {
        loseAccess(payload?.reason)
      }
    })

    // La sala "actual" del usuario cambió (otra pestaña/dispositivo): esta
    // pantalla ya no corresponde. El payload trae la sala nueva; si es la
    // misma, no hay nada que hacer.
    const offCurrentChanged = subscribeToRoomEvent(
      'room:current-changed',
      (payload) => {
        if (Number(payload?.roomId) === id) return
        loseAccess('other_room')
      },
    )

    return () => {
      offExpelled()
      offKicked()
      offError()
      offCurrentChanged()
    }
  }, [id, loseAccess])

  /**
   * Rutea un error de la API. Devuelve `true` si era una pérdida de acceso (y
   * ya disparó `onLost`), para que la pantalla no muestre además el toast
   * genérico de error.
   *
   * @param {unknown} cause
   * @returns {boolean}
   */
  const reportError = useCallback(
    (cause) => {
      if (cause?.code !== ACCESS_LOST_CODE) return false

      return loseAccess(cause?.reason)
    },
    [loseAccess],
  )

  return { lost, reportError }
}
