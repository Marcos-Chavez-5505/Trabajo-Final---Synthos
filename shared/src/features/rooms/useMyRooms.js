import { useEffect, useState } from 'react'
import {
  listMyRooms,
  notifyRoomsChanged,
  subscribeToRooms,
} from '../../services/roomsService.js'
import { subscribeToRoomEvent } from '../../services/socketService.js'

/**
 * Salas del usuario para el grupo "Mis Salas" del Sidebar.
 *
 * El Sidebar vive arriba de la ruta, así que no se remonta al unirse o salir de
 * una sala desde otra pantalla. Por eso se suscribe a `subscribeToRooms` y usa un
 * `version` para volver a pedir la lista: el mismo patrón que `usePlaylistList`.
 *
 * Acá se suscriben también dos eventos de sala que ningún endpoint de este
 * service avisa. Va en el hook y no en `RoomView` porque el aviso puede llegar
 * con la persona en cualquier otra pantalla: el socket es de la sesión, no de la
 * ruta.
 */
export default function useMyRooms() {
  const [version, setVersion] = useState(0)
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => subscribeToRooms(() => setVersion((v) => v + 1)), [])

  // - `room:kicked`: a quien expulsan no le corre ninguna llamada propia.
  // - `room:closed`: el anfitrión sí la tiene (cierra con `DELETE`), pero el
  //   resto de los miembros solo recibe el evento, y con él el host que cierra
  //   desde otro lado o la sala que se cierra sola al salir el anfitrión (D16).
  //
  // El backend ya excluye esas filas (`room.status = 'activa'` para el listado,
  // y la fila de miembro borrada por el kick para el `EXISTS`), así que con
  // volver a pedir la lista alcanza: no hace falta filtrar nada en el cliente.
  useEffect(() => {
    const offKicked = subscribeToRoomEvent('room:kicked', notifyRoomsChanged)
    const offClosed = subscribeToRoomEvent('room:closed', notifyRoomsChanged)

    return () => {
      offKicked()
      offClosed()
    }
  }, [])

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