import { useEffect, useRef, useState } from 'react'
import { searchRooms } from '../../services/roomsService.js'
import {
  connectSocket,
  joinLobby,
  leaveLobby,
  subscribeToRoomCards,
  subscribeToSocketConnect,
} from '../../services/socketService.js'
import { mapApiError } from '../../utils/mapError.js'
import {
  applyRoomCardUpdate,
  removeRoomFromList,
} from './roomCardUpdates.js'

/**
 * Estado del listado `/salas`: búsqueda + orden + tarjetas en vivo.
 *
 * El listado se pide por REST. Mientras la pantalla está montada se escucha el
 * lobby: `room:card-updated` actualiza solo los campos de la tarjeta afectada y
 * `room:card-removed` la saca. Las salas nuevas no se agregan en vivo (queda
 * como mejora futura); al reconectar se vuelve a pedir el listado para no
 * perderse eventos.
 */
export default function useRoomsList(query, sort, order) {
  const key = `${query}|${sort}|${order}`
  const [response, setResponse] = useState({ key: null, rooms: [], error: null })
  const [reloadToken, setReloadToken] = useState(0)
  const keyRef = useRef(key)

  keyRef.current = key

  useEffect(() => {
    let active = true

    searchRooms({ query, sort, order })
      .then((rooms) => {
        if (active) setResponse({ key, rooms, error: null })
      })
      .catch((cause) => {
        if (active) setResponse({ key, rooms: [], error: mapApiError(cause) })
      })

    return () => {
      active = false
    }
  }, [query, sort, order, key, reloadToken])

  useEffect(() => {
    // Sin sesión no hay socket: el listado funciona como antes, sin tiempo real.
    if (!connectSocket()) return undefined

    joinLobby()

    const unsubscribeCards = subscribeToRoomCards({
      onUpdated: (payload) => {
        setResponse((current) => {
          if (current.key !== keyRef.current) return current

          return {
            ...current,
            rooms: applyRoomCardUpdate(current.rooms, payload),
          }
        })
      },
      onRemoved: (payload) => {
        setResponse((current) => {
          if (current.key !== keyRef.current) return current

          return {
            ...current,
            rooms: removeRoomFromList(current.rooms, payload?.roomId),
          }
        })
      },
    })

    // Al reconectar el socket se pudieron perder eventos: se recarga el listado.
    const unsubscribeConnect = subscribeToSocketConnect(() => {
      setReloadToken((value) => value + 1)
    })

    return () => {
      unsubscribeCards()
      unsubscribeConnect()
      leaveLobby()
    }
  }, [])

  const isCurrent = response.key === key
  const rooms = isCurrent ? response.rooms : []
  const error = isCurrent ? response.error : null

  return { isCurrent, rooms, error }
}
