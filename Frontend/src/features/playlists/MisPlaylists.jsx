import PlaylistSidebarList from './PlaylistSidebarList.jsx'
import usePlaylistList from './usePlaylistList.js'

/**
 * Sección "Mis Playlists" del Sidebar (TS-09): las playlists que creó el
 * usuario, que es lo que `role === 'creator'` significa.
 *
 * Las colaborativas donde entró como participante van en su propio grupo
 * (`CollabPlaylists`), así el Sidebar no se mezcla con lo ajeno.
 */
export default function MisPlaylists() {
  const { playlists } = usePlaylistList()

  return <PlaylistSidebarList playlists={playlists.filter((p) => p.role === 'creator')} />
}