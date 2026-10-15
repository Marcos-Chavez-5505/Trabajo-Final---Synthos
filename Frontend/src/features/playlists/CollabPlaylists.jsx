import PlaylistSidebarList from './PlaylistSidebarList.jsx'
import usePlaylistList from './usePlaylistList.js'

/**
 * Sección "Playlists Colaborativas" del Sidebar (TS-12): las colaborativas donde
 * el usuario entró por invitación y no es quien las creó.
 */
export default function CollabPlaylists() {
  const { playlists } = usePlaylistList()

  return (
    <PlaylistSidebarList
      playlists={playlists.filter((p) => p.isCollaborative && p.role !== 'creator')}
    />
  )
}