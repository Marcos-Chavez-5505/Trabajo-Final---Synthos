// hooks/useSongSearch.js
import { useEffect, useState } from 'react'
import { searchSongs, SEARCH_PAGE_SIZE } from '../services/songsService.js'

/**
 * Búsqueda de canciones con debounce, paginada por número de página.
 *
 * Encapsula el fetch al service (`searchSongs`) para que `SearchSongs` y el
 * modal de recomendación compartan la misma lógica sin duplicarla. La forma
 * del resultado es la del service: `{ items, total, page, pageSize, totalPages }`.
 *
 * @param {string} query Texto a buscar. Vacío limpia el resultado y no pega.
 */
export default function useSongSearch(query, options = {}) {
  const { page = 1, pageSize = SEARCH_PAGE_SIZE, enabled = true } = options

  const [state, setState] = useState({
    items: [],
    total: 0,
    page,
    pageSize,
    totalPages: 1,
    loading: false,
    error: null,
  })

  useEffect(() => {
    const term = query.trim()

    if (!enabled || !term) {
      setState({
        items: [],
        total: 0,
        page,
        pageSize,
        totalPages: 1,
        loading: false,
        error: null,
      })
      return undefined
    }

    const controller = new AbortController()
    let active = true

    setState((prev) => ({ ...prev, loading: true, error: null }))

    const t = setTimeout(() => {
      searchSongs(term, page, pageSize, { signal: controller.signal })
        .then((data) => {
          if (!active) return
          setState({
            items: data.items,
            total: data.total,
            page: data.page,
            pageSize: data.pageSize,
            totalPages: data.totalPages,
            loading: false,
            error: null,
          })
        })
        .catch((cause) => {
          if (!active || cause.name === 'AbortError') return
          setState({
            items: [],
            total: 0,
            page,
            pageSize,
            totalPages: 1,
            loading: false,
            error: cause.message,
          })
        })
    }, 250)

    return () => {
      active = false
      clearTimeout(t)
      controller.abort()
    }
  }, [query, page, pageSize, enabled])

  return state
}