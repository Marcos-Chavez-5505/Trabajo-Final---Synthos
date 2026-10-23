import { SidebarGroup, SidebarGroupLabel } from '../../components/ui/sidebar.tsx'
import SidebarAnimatedGroup from '../../components/layout/SidebarAnimatedGroup.jsx'
import RoomSidebarList from './RoomSidebarList.jsx'
import { useMyRooms } from '@synthos/shared'

/**
 * Sección "Mis Salas" del Sidebar (TS-14): las salas de las que el usuario es
 * parte.
 *
 * El grupo completo vive acá y no en `Sidebar`, así la feature decide su
 * contenido. Cuando no hay salas no se desmonta: `SidebarAnimatedGroup` lo cierra
 * con una animación vertical en vez de dejar el label colgado sobre un grupo
 * vacío. Mismo criterio que `MisPlaylists` y `CollabPlaylists`.
 */
export default function MyRooms() {
  const { rooms } = useMyRooms()

  return (
    <SidebarAnimatedGroup hasItems={rooms.length > 0}>
      <SidebarGroup>
        <SidebarGroupLabel>Mis Salas</SidebarGroupLabel>
        <RoomSidebarList rooms={rooms} />
      </SidebarGroup>
    </SidebarAnimatedGroup>
  )
}
