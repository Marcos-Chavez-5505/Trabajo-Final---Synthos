import { useEffect, useState } from 'react'
import { listMyRooms, subscribeToRooms } from '../../services/roomsService.js'

/**
 * Salas del usuario para el grupo "Mis Salas" del Sidebar.
 *
 * El Sidebar vive arriba de la ruta, así que no se remonta al unirse o salir de
 * una sala desde otra pantalla. Por eso se suscribe a `subscribeToRooms` y usa un
 * `version` para volver a pedir la lista: el mismo patrón que `usePlaylistList`.
 */
export default function useMyRooms() {
  const [version, setVersion] = useState(0)
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => subscribeToRooms(() => setVersion((v) => v + 1)), [])

  useEffect(() => {
    let active = true

    setLoading(true)

    listMyRooms()
      .then((found) => {
        if (!active) return

        setRooms(found)
        setLoading(false)
      })
      .catch(() => {
        // El grupo es informativo: si la lista no se puede pedir, se muestra vacío
        // en vez de romper el Sidebar de toda la app.
        if (!active) return

        setRooms([])
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [version])

  return { rooms, loading }
}