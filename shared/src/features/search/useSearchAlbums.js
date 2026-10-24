import { useEffect, useState } from 'react'
import useDebounce from '../../hooks/useDebounce.js'
import { listAlbums } from '../../services/albumsService.js'
import { mapApiError } from '../../utils/mapError.js'

const EMPTY_RESULTS = { items: [], total: 0, page: 1, pageSize: 1, totalPages: 1 }

// Mismo tamaño de página que la pestaña de canciones: son las dos grillas de
// MiniMediaCard, así que paginan igual.
const PAGE_SIZE = 10

export default function useSearchAlbums(query, page) {
  const debouncedQuery = useDebounce(query, 300)
  const requestKey = `${debouncedQuery}::${page}`
  const [response, setResponse] = useState({ key: null, data: null, error: null })

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    listAlbums(debouncedQuery, page, PAGE_SIZE, { signal: controller.signal })
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
  const isLoading = !isCurrent
  const error = isCurrent ? response.error : null
  const results = isCurrent ? (response.data ?? EMPTY_RESULTS) : EMPTY_RESULTS

  return { debouncedQuery, isCurrent, isLoading, error, results }
}