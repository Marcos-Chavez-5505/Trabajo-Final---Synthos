import { useEffect, useState } from 'react'
import useAuth from '../../hooks/useAuth.js'
import { listPlaylists, subscribeToPlaylists } from '../../services/playlistsService.js'
import { mapApiError } from '../../utils/mapError.js'

/**
 * Las playlists del usuario: las que creó y las colaborativas donde entró, que
 * el backend devuelve en la misma respuesta (`getUserPlaylists`).
 *
 * El Sidebar sobrevive a la navegación, así que los datos no se remontan al crear
 * o borrar desde una pantalla: el hook se suscribe a `subscribeToPlaylists` y un
 * `version` en las deps vuelve a pedir la lista.
 */
export default function usePlaylistList() {
  const { user, loading: authLoading } = useAuth()
  const userId = user?.id ?? null

  const [response, setResponse] = useState({ key: null, playlists: [], error: null })
  const [version, setVersion] = useState(0)

  useEffect(() => {
    if (!userId) return undefined

    let active = true

    listPlaylists(userId)
      .then((playlists) => {
        if (active) setResponse({ key: userId, playlists, error: null })
      })
      .catch((cause) => {
        if (active) setResponse({ key: userId, playlists: [], error: mapApiError(cause) })
      })

    return () => {
      active = false
    }
  }, [userId, version])

  useEffect(() => subscribeToPlaylists(() => setVersion((prev) => prev + 1)), [])

  const isCurrent = response.key === userId

  return {
    playlists: isCurrent ? response.playlists : [],
    error: isCurrent ? response.error : null,
    // Sin sesión no hay dueño: la biblioteca está vacía, no "cargando".
    loading: authLoading || (userId !== null && !isCurrent),
  }
}