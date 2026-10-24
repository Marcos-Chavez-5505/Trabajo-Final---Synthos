import { useCallback, useState } from 'react'
import { listSongsByMood } from '../../services/songsService.js'
import { mapApiError } from '../../utils/mapError.js'

/**
 * Estado de las canciones para un estado de ánimo (TS-20).
 *
 * La detección por cámara y el permiso viven en el componente (web); acá solo
 * se resuelve la carga de canciones y el estado derivado.
 */
export default function useMoodSongs() {
  const [mood, setMood] = useState(null)
  const [songs, setSongs] = useState(null)
  const [songsError, setSongsError] = useState(null)

  const loadSongs = useCallback(async (nextMood) => {
    setMood(nextMood)
    setSongs(null)
    setSongsError(null)

    try {
      setSongs(await listSongsByMood(nextMood))
    } catch (cause) {
      setSongsError(mapApiError(cause, 'No pudimos buscar canciones.'))
    }
  }, [])

  return { mood, songs, songsError, loadSongs, setSongs, setSongsError }
}