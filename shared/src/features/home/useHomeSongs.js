import { useEffect, useState } from 'react'
import usePlayer from '../../hooks/usePlayer.js'
import { listSongs } from '../../services/songsService.js'
import { mapApiError } from '../../utils/mapError.js'

const NOVEDADES_COUNT = 6

/**
 * Estado de la fila de novedades del Home.
 */
export default function useHomeSongs() {
  const { playSongs, addToQueue } = usePlayer()
  const [songs, setSongs] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    listSongs({ signal: controller.signal })
      .then((catalog) => {
        if (active) setSongs(catalog.slice(0, NOVEDADES_COUNT))
      })
      .catch((cause) => {
        if (active) setError(mapApiError(cause))
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [])

  return { songs, error, playSongs, addToQueue }
}