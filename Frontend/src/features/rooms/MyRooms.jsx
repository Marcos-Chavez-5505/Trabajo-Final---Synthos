import RoomSidebarList from './RoomSidebarList.jsx'
import useMyRooms from './useMyRooms.js'

/**
 * Sección "Mis Salas" del Sidebar (TS-14): las salas de las que el usuario es
 * parte. Las que administra se marcan como anfitrionas.
 *
 * El grupo tiene el mismo patrón que "Mis Playlists": un hook pide la lista y un
 * componente presentacional la dibuja. Si no hay salas, no se renderiza nada, así
 * el Sidebar no muestra un grupo vacío.
 */
export default function MyRooms() {
  const { rooms } = useMyRooms()

  return <RoomSidebarList rooms={rooms} />
}