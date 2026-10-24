import { useEffect, useState } from 'react'
import { searchRooms } from '../../services/roomsService.js'
import { mapApiError } from '../../utils/mapError.js'

/**
 * Estado del listado `/salas`: búsqueda + orden.
 */
export default function useRoomsList(query, sort, order) {
  const key = `${query}|${sort}|${order}`
  const [response, setResponse] = useState({ key: null, rooms: [], error: null })

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
  }, [query, sort, order, key])

  const isCurrent = response.key === key
  const rooms = isCurrent ? response.rooms : []
  const error = isCurrent ? response.error : null

  return { isCurrent, rooms, error }
}