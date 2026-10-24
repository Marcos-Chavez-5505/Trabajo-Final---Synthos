import { useEffect, useState } from 'react'
import { listAlbums } from '../../services/albumsService.js'
import { mapApiError } from '../../utils/mapError.js'

const EMPTY_RESULTS = { items: [], total: 0, page: 1, pageSize: 1, totalPages: 1 }

/**
 * Estado de la pantalla `/albums`: catálogo de discos paginado por URL.
 *
 * La página viene de la query string (responsabilidad del componente, que
 * maneja el router); acá solo se resuelve el fetch y el estado derivado.
 */
export default function useAlbums(page) {
  const requestKey = String(page)
  const [response, setResponse] = useState({ key: null, data: null, error: null })

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    listAlbums('', page, undefined, { signal: controller.signal })
      .then((data) => {
        if (!active) return

        setResponse({ key: requestKey, data, error: null })
      })
      .catch((cause) => {
        if (!active) return

        setResponse({ key: requestKey, data: null, error: mapApiError(cause) })
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [page, requestKey])

  const isCurrent = response.key === requestKey
  const error = isCurrent ? response.error : null
  const results = isCurrent ? (response.data ?? EMPTY_RESULTS) : EMPTY_RESULTS

  return { isCurrent, error, results }
}