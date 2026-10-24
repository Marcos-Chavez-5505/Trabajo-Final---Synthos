import { useEffect, useState } from 'react'
import usePlayer from '../../hooks/usePlayer.js'
import { listPopularSongs } from '../../services/songsService.js'
import { mapApiError } from '../../utils/mapError.js'

/**
 * Estado y handlers de la pantalla `/populares`: ranking semanal de canciones.
 *
 * Encapsula el fetch para que el componente quede solo con presentación.
 */
export default function usePopularSongs() {
  const { playSongs, addToQueue } = usePlayer()
  const [response, setResponse] = useState({ data: null, error: null })

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    listPopularSongs({ signal: controller.signal })
      .then((data) => {
        if (active) setResponse({ data, error: null })
      })
      .catch((cause) => {
        if (active) setResponse({ data: null, error: mapApiError(cause) })
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [])

  const { data, error } = response

  return {
    data,
    error,
    songs: data?.songs ?? [],
    minimumFavorites: data?.minimumFavorites ?? 3,
    playSongs,
    addToQueue,
  }
}