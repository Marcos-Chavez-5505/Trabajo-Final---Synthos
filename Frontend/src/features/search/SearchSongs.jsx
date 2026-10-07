import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import useDebounce from '../../hooks/useDebounce.js'
import usePlayer from '../../hooks/usePlayer.js'
import buildPageRange from '../../lib/pageRange.js'
import { searchSongs } from '../../services/songsService.js'
import MiniMediaCard from '../../components/cards/MiniMediaCard.jsx'
import SearchTabs from './SearchTabs.jsx'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../../components/ui/pagination'

export const DEBOUNCE_MS = 300

const EMPTY_RESULTS = { items: [], total: 0, page: 1, pageSize: 1, totalPages: 1 }

export default function SearchSongs() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { playSongs } = usePlayer()

  // La query vive en la URL: la búsqueda se puede compartir y el input de
  // TopBar (/buscar?q=) apunta a esta misma pantalla.
  const query = searchParams.get('q') ?? ''
  const page = Math.max(Number(searchParams.get('page')) || 1, 1)

  // Se busca con la query ya debounceada: tipear rápido no dispara una
  // búsqueda por tecla.
  const debouncedQuery = useDebounce(query, DEBOUNCE_MS)

  // Cada respuesta se guarda junto a la query+página que la pidió. El loading se
  // deriva comparando keys en vez de setear un booleano, así no hay un render
  // extra en cascada y nunca se muestra un resultado viejo con la query nueva.
  const requestKey = `${debouncedQuery}::${page}`
  const [response, setResponse] = useState({ key: null, data: null, error: null })

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    searchSongs(debouncedQuery, page, undefined, { signal: controller.signal })
      .then((data) => {
        if (!active) return

        setResponse({ key: requestKey, data, error: null })
      })
      .catch((cause) => {
        if (!active) return

        setResponse({ key: requestKey, data: null, error: cause.message })
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

  // El service acota la página a un rango válido. Si la URL pedía una que ya no
  // existe (bajó el total de resultados al cambiar la query), se corrige en la
  // URL en vez de mostrar un "sin resultados" engañoso.
  useEffect(() => {
    if (results.total > 0 && results.page !== page) {
      setSearchParams({ q: query, page: String(results.page) }, { replace: true })
    }
  }, [results, page, query, setSearchParams])

  // Href de cada página. Sin query no se escribe ?q= vacío en la URL, y `tipo` se
  // arrastra para que la paginación no salte a la pestaña de personas.
  const pageHref = (target) => {
    const params = new URLSearchParams()

    params.set('tipo', 'canciones')
    if (query) params.set('q', query)
    if (target > 1) params.set('page', String(target))

    return `?${params.toString()}`
  }

  const isFirstPage = results.page <= 1
  const isLastPage = results.page >= results.totalPages

  const pages = useMemo(
    () => buildPageRange(results.page, results.totalPages),
    [results.page, results.totalPages],
  )

  return (
    <section className="px-6 py-4">
      <SearchTabs
        tipo="canciones"
        title="Buscar canciones"
        /* El backend no tiene columna `album` ni busca por él (ver docs/PENDIENTES.md),
           así que el copy promete solo lo que el endpoint puede cumplir. Cuando se
           agregue el filtro por álbum, vuelve "álbumo" acá. */
        subtitle="Buscá por título, artista o género."
      />

      {isLoading ? (
        <p className="text-muted-foreground TextRegluar">Buscando…</p>
      ) : error ? (
        <div className="py-12 text-center">
          <p className="text-foreground Header4 mb-1">No pudimos buscar</p>
          <p className="text-muted-foreground TextRegluar">{error}</p>
        </div>
      ) : results.items.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-foreground Header4 mb-1">Sin resultados</p>
          <p className="text-muted-foreground TextRegluar">
            {query
              ? `No encontramos canciones para "${query}". Probá con otro término.`
              : 'No hay canciones para mostrar.'}
          </p>
        </div>
      ) : (
        <>
          <ul className="flex flex-wrap gap-x-4 gap-y-6">
            {results.items.map((song, index) => (
              <li key={song.id}>
                <MiniMediaCard
                  title={song.title}
                  artist={song.artist}
                  label={song.genre}
                  coverUrl={song.coverUrl}
                  onPlay={() => playSongs(results.items, index)}
                />
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