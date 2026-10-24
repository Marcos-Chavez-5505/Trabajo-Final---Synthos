import { useState } from 'react'
import useAuth from '../../hooks/useAuth.js'
import { createPlaylist } from '../../services/playlistsService.js'

/**
 * Estado de la página `/playlists`: pestaña activa implícita en la URL y
 * creación de playlists.
 */
export default function usePlaylistsPage() {
  const { user } = useAuth()
  const userId = user?.id ?? null

  const [creating, setCreating] = useState(false)

  async function handleCreate({ name, description, type }) {
    const created = await createPlaylist(userId, { name, description, type })
    setCreating(false)
    return created
  }

  return { creating, setCreating, handleCreate }
}