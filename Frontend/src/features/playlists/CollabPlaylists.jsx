import { SidebarGroup, SidebarGroupLabel } from '../../components/ui/sidebar.tsx'
import SidebarAnimatedGroup from '../../components/layout/SidebarAnimatedGroup.jsx'
import PlaylistSidebarList from './PlaylistSidebarList.jsx'
import usePlaylistList from './usePlaylistList.js'

/**
 * Sección "Playlists Colaborativas" del Sidebar (TS-12): las colaborativas donde
 * el usuario entró por invitación y no es quien las creó.
 *
 * El grupo completo vive acá y no en `Sidebar`, así la feature decide su
 * contenido. Cuando no hay colaborativas no se desmonta: `SidebarAnimatedGroup`
 * lo cierra con una animación vertical en vez de dejar el label colgado sobre un
 * grupo vacío. Mismo criterio que `MyRooms` y `MisPlaylists`.
 */
export default function CollabPlaylists() {
  const { playlists } = usePlaylistList()
  const collabs = playlists.filter(
    (playlist) => playlist.isCollaborative && playlist.role !== 'creator',
  )

  return (
    <SidebarAnimatedGroup hasItems={collabs.length > 0}>
      <SidebarGroup>
        <SidebarGroupLabel>Playlists Colaborativas</SidebarGroupLabel>
        <PlaylistSidebarList playlists={collabs} />
      </SidebarGroup>
    </SidebarAnimatedGroup>
  )
}
