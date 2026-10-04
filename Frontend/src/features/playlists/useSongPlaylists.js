import { useCallback, useEffect, useState } from 'react'
import useAuth from '../../hooks/useAuth.js'
import { listPlaylists, subscribeToPlaylists } from '../../services/playlistsService.js'

/**
 * Playlists del usuario con un chequeo de pertenencia para una canción.
 *
 * Lo consumen el botón "Agregar a playlist" del reproductor (para pintarse activo
 * si la canción ya está en alguna lista) y el panel (para ofrecer agregar y
 * desagregar). Se suscribe a `subscribeToPlaylists` para recalcular cuando cambia
 * cualquier lista, sin importar desde qué pantalla se haya modificado.
 *
 * @param {string|number} songId
 * @returns {{playlists: object[], loading: boolean, error: string|null,
 *   contains: (playlist: object) => boolean, inAnyPlaylist: boolean}}
 */
export default function useSongPlaylists(songId) {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const requestKey = userId !== null ? String(userId) : null

  const [response, setResponse] = useState({ key: null, playlists: [], error: null })
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (!userId) return undefined

    let active = true

    listPlaylists(userId)
      .then((playlists) => {
        if (active) setResponse({ key: String(userId), playlists, error: null })
      })
      .catch((cause) => {
        if (active) {
          setResponse({ key: String(userId), playlists: [], error: cause.message })
        }
      })

    return () => {
      active = false
    }
  }, [userId, version])

  useEffect(() => subscribeToPlaylists(() => setVersion((prev) => prev + 1)), [])

  const isCurrent = response.key === requestKey
  const playlists = isCurrent ? response.playlists : []

  // Se comparan como string porque el id viene del backend como number.
  const contains = useCallback(
    (playlist) => playlist.songIds.some((id) => String(id) === String(songId)),
    [songId]
  )

  // Los favoritos no cuentan para el ícono: tienen su propio botón (el corazón).
  const inAnyPlaylist = playlists.some(
    (playlist) => !playlist.isFavorites && contains(playlist)
  )

  return {
    playlists,
    loading: Boolean(requestKey) && !isCurrent,
    error: isCurrent ? response.error : null,
    contains,
    inAnyPlaylist,
  }
}
