import { useCallback, useEffect, useState } from 'react'
import useAuth from './useAuth.js'
import {
  listFavoriteSongIds,
  subscribeToPlaylists,
  toggleFavorite as toggleFavoriteService,
} from '../services/playlistsService.js'

// Referencia estable para cuando todavía no hay respuesta: si se creara un `[]`
// literal en cada render, el `useCallback` de `isFavorite` se invalidaría siempre.
const NO_IDS = []

/**
 * Favoritos del usuario actual.
 *
 * Los favoritos son una playlist con `isFavorites`, no un estado aparte (ver
 * `playlistsService`). Cada consumidor tiene su propia instancia del hook (el
 * `FavoriteButton` del reproductor, las filas y el panel de "agregar a"), así
 * que para que todas coincidan el hook se suscribe a `subscribeToPlaylists`:
 * cualquier alta/baja de favoritos, venga de donde venga, dispara un refetch de
 * los ids. Sin eso, quitar una canción desde el detalle dejaba al reproductor
 * mostrándola como favorita hasta recargar.
 *
 * No es un Context porque no hay un Provider global de playlists en el árbol:
 * lo consumen pantallas bajo `AppLayout`, y el `PlayerBar`, que sí es global,
 * toma el estado de acá.
 *
 * La respuesta se guarda con el `userId` que la pidió y el loading se deriva
 * comparando esa key, en vez de setear un booleano. Es el mismo patrón que usan
 * las pantallas de búsqueda: evita el render en cascada y no hay que sincronizar
 * un `setLoading(true)` en cada pasada.
 *
 * @returns {{favoriteIds: (number|string)[], isFavorite: (songId: any) => boolean,
 *   toggleFavorite: (songId: any) => Promise<boolean>, loading: boolean}}
 */
export default function useFavorites() {
  const { user, loading: authLoading } = useAuth()
  const userId = user?.id ?? null

  const [response, setResponse] = useState({
    key: null,
    ids: [],
    loading: true,
  })
  const [version, setVersion] = useState(0)

  useEffect(() => subscribeToPlaylists(() => setVersion((prev) => prev + 1)), [])

  useEffect(() => {
    if (!userId) return undefined

    let active = true

    listFavoriteSongIds(userId)
      .then((ids) => {
        if (active) setResponse({ key: userId, ids, loading: false })
      })
      .catch(() => {
        if (active) setResponse({ key: userId, ids: [], loading: false })
      })

    return () => {
      active = false
    }
  }, [userId, version])

  const isCurrent = response.key === userId
  const favoriteIds = isCurrent ? response.ids : NO_IDS
  const loading = authLoading || (userId !== null && !isCurrent)

  // Se comparan como string: el id de la canción llega del backend como number
  // y del storage puede haber quedado como texto, y `43886 !== "43886"`.
  const isFavorite = useCallback(
    (songId) => favoriteIds.some((id) => String(id) === String(songId)),
    [favoriteIds]
  )

  const toggleFavorite = useCallback(
    async (songId) => {
      if (!userId) return false

      const result = await toggleFavoriteService(userId, songId)

      setResponse({ key: userId, ids: result.playlist.songIds, loading: false })

      return result.isFavorite
    },
    [userId]
  )

  return { favoriteIds, isFavorite, toggleFavorite, loading }
}
