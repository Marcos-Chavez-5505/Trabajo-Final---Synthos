import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import useDebounce from '../../hooks/useDebounce.js'
import buildPageRange from '../../lib/pageRange.js'
import { listArtists } from '../../services/artistsService.js'
import ArtistCard from '../../components/cards/ArtistCard.jsx'
import microphoneIcon from '../../assets/microphone.svg'
import searchIcon from '../../assets/search.svg'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../../components/ui/pagination'
import { mapApiError } from '../../utils/mapError.js'

const DEBOUNCE_MS = 300

const EMPTY_RESULTS = { items: [], total: 0, page: 1, pageSize: 1, totalPages: 1 }

/**
 * `/artistas`: catálogo de artistas de la sección "Mi Colección".
 *
 * Lista paginada y ordenada por nombre, con búsqueda opcional por nombre. La
 * query y la página viven en la URL (`?q=&page=`) para que el resultado sea
 * compartible y el "atrás" del browser funcione. Al abrir una tarjeta se va al
 * detalle, que trae los álbumes del artista.
 */
export default function Artists() {
  const [searchParams, setSearchParams] = useSearchParams()

  const query = searchParams.get('q') ?? ''
  const page = Math.max(Number(searchParams.get('page')) || 1, 1)

  const debouncedQuery = useDebounce(query, DEBOUNCE_MS)

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

  // Si la URL pedía una página fuera de rango (el total bajó al buscar), se
  // corrige acá en vez de mostrar un vacío que parezca "no hay artistas".
  useEffect(() => {
    if (results.total > 0 && results.page !== page) {
      const params = new URLSearchParams()

      if (query) params.set('q', query)
      if (results.page > 1) params.set('page', String(results.page))

      setSearchParams(params, { replace: true })
    }
  }, [results, page, query, setSearchParams])

  const handleQueryChange = (event) => {
    const value = event.target.value
    const params = new URLSearchParams()

    if (value) params.set('q', value)

    setSearchParams(params, { replace: true })
  }

  const pageHref = (target) => {
    const params = new URLSearchParams()

    if (query) params.set('q', query)
    if (target > 1) params.set('page', String(target))

    const queryString = params.toString()

    return queryString ? `?${queryString}` : '/artistas'
  }

  const isFirstPage = results.page <= 1
  const isLastPage = results.page >= results.totalPages

  const pages = useMemo(
    () => buildPageRange(results.page, results.totalPages),
    [results.page, results.totalPages],
  )

  return (
    <section className="px-6 py-4 md:px-10">
      <h1 className="Header3">Artistas</h1>
      <p className="text-muted-foreground TextRegluar mt-1">
        El catálogo completo. Abrí un artista para ver sus álbumes.
      </p>

      <div className="Volume mt-4 flex max-w-md items-center gap-2 rounded-full px-4 py-2">
        <img src={searchIcon} alt="" aria-hidden="true" className="h-4 w-4 shrink-0" />
        <input
          type="search"
          value={query}
          onChange={handleQueryChange}
          placeholder="Buscar artistas"
          aria-label="Buscar artistas"
          className="text-foreground TextRegluar placeholder-muted-foreground/60 w-full bg-transparent outline-none"
        />
      </div>

      {error ? (
        <div className="py-12 text-center">
          <p className="text-foreground Header4 mb-1">No pudimos cargar los artistas</p>
          <p className="text-muted-foreground TextRegluar">{error}</p>
        </div>
      ) : results.items.length === 0 ? (
        <EmptyState isLoading={!isCurrent} query={query} />
      ) : (
        <>
          <ul className="mt-8 flex flex-wrap gap-x-4 gap-y-6">
            {results.items.map((artist) => (
              <li key={artist.id}>
                <ArtistCard artist={artist} />
              </li>
            ))}
          </ul>

          {results.totalPages > 1 && (
            <Pagination className="mt-10">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    render={<Link to={pageHref(results.page - 1)} />}
                    aria-disabled={isFirstPage}
                    className={isFirstPage ? 'pointer-events-none opacity-50' : undefined}
                  />
                </PaginationItem>

                {pages.map((entry, index) =>
                  entry === null ? (
                    <PaginationItem key={`gap-${index}`}>
                      <PaginationEllipsis />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={entry}>
                      <PaginationLink
                        isActive={entry === results.page}
                        render={<Link to={pageHref(entry)} />}
                      >
                        {entry}
                      </PaginationLink>
                    </PaginationItem>
                  ),
                )}

                <PaginationItem>
                  <PaginationNext
                    render={<Link to={pageHref(results.page + 1)} />}
                    aria-disabled={isLastPage}
                    className={isLastPage ? 'pointer-events-none opacity-50' : undefined}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </>
      )}
    </section>
  )
}

function EmptyState({ isLoading, query }) {
  if (isLoading) {
    return <p className="text-muted-foreground TextRegluar mt-8">Cargando artistas…</p>
  }

  return (
    <div className="py-16 text-center">
      <img
        src={microphoneIcon}
        alt=""
        aria-hidden="true"
        className="mx-auto h-10 w-10 opacity-50"
      />
      <p className="text-foreground Header4 mt-4">
        {query ? 'Sin resultados' : 'Todavía no hay artistas'}
      </p>
      <p className="text-muted-foreground TextRegluar mt-1">
        {query
          ? `No encontramos artistas para "${query}". Probá con otro término.`
          : 'Cuando se cargue el catálogo, los artistas aparecen acá.'}
      </p>
    </div>
  )
}
