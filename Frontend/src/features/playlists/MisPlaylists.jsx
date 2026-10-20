import { SidebarGroup, SidebarGroupLabel } from '../../components/ui/sidebar.tsx'
import SidebarAnimatedGroup from '../../components/layout/SidebarAnimatedGroup.jsx'
import PlaylistSidebarList from './PlaylistSidebarList.jsx'
import usePlaylistList from './usePlaylistList.js'

/**
 * Sección "Mis Playlists" del Sidebar (TS-09): las playlists que creó el
 * usuario, que es lo que `role === 'creator'` significa.
 *
 * Las colaborativas donde entró como participante van en su propio grupo
 * (`CollabPlaylists`), así el Sidebar no se mezcla con lo ajeno.
 *
 * El grupo completo vive acá y no en `Sidebar`, así la feature decide su
 * contenido. Cuando no hay playlists no se desmonta: `SidebarAnimatedGroup` lo
 * cierra con una animación vertical en vez de dejar el label colgado sobre un
 * grupo vacío. Mismo criterio que `MyRooms` y `CollabPlaylists`.
 */
export default function MisPlaylists() {
  const { playlists } = usePlaylistList()
  const mine = playlists.filter((playlist) => playlist.role === 'creator')

  return (
    <SidebarAnimatedGroup hasItems={mine.length > 0}>
      <SidebarGroup>
        <SidebarGroupLabel>Mis Playlists</SidebarGroupLabel>
        <PlaylistSidebarList playlists={mine} />
      </SidebarGroup>
    </SidebarAnimatedGroup>
  )
}
