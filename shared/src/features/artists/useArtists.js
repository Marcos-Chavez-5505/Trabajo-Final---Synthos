import { useEffect, useState } from 'react'
import useDebounce from '../../hooks/useDebounce.js'
import { listArtists } from '../../services/artistsService.js'
import { mapApiError } from '../../utils/mapError.js'

const EMPTY_RESULTS = { items: [], total: 0, page: 1, pageSize: 1, totalPages: 1 }

/**
 * Estado del listado `/artistas`: búsqueda por nombre + paginación.
 *
 * La query y la página vienen de la URL (responsabilidad del componente).
 */
export default function useArtists(query, page) {
  const debouncedQuery = useDebounce(query, 300)

  const requestKey = `${debouncedQuery}::${page}`
  const [response, setResponse] = useState({ key: null, data: null, error: null })

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    listArtists(debouncedQuery, page, undefined, { signal: controller.signal })
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
  }, [debouncedQuery, page, requestKey])

  const isCurrent = response.key === requestKey
  const error = isCurrent ? response.error : null
  const results = isCurrent ? (response.data ?? EMPTY_RESULTS) : EMPTY_RESULTS

  return { debouncedQuery, isCurrent, error, results }
}