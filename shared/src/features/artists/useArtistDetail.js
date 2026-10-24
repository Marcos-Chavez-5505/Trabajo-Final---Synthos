import { useEffect, useState } from 'react'
import { getArtistById } from '../../services/artistsService.js'
import { mapApiError } from '../../utils/mapError.js'

/**
 * Estado del detalle `/artistas/:id`.
 */
export default function useArtistDetail(id) {
  const [response, setResponse] = useState({ key: null, artist: null, error: null })

  useEffect(() => {
    let active = true

    getArtistById(id)
      .then((artist) => {
        if (active) setResponse({ key: String(id), artist, error: null })
      })
      .catch((cause) => {
        if (active) {
          setResponse({ key: String(id), artist: null, error: mapApiError(cause) })
        }
      })

    return () => {
      active = false
    }
  }, [id])

  const isCurrent = response.key === String(id)
  const artist = isCurrent ? response.artist : null
  const error = isCurrent ? response.error : null

  return { artist, error }
}