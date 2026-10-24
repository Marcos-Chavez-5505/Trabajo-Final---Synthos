import { useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { usePlayer, buildPageRange, useSearchSongs } from '@synthos/shared'
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

export default function SearchSongs() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { playSongs, addToQueue } = usePlayer()

  const query = searchParams.get('q') ?? ''
  const page = Math.max(Number(searchParams.get('page')) || 1, 1)

  const { isLoading, error, results } = useSearchSongs(query, page)

  // El service acota la página a un rango válido. Si la URL pedía una que ya no
  // existe (bajó el total de resultados al cambiar la query), se corrige en la
  // URL en vez de mostrar un "sin resultados" engañoso.
  useEffect(() => {
    if (results.total > 0 && results.page !== page) {
      setSearchParams({ q: query, page: String(results.page) }, { replace: true })
    }
  }, [results, page, query, setSearchParams])

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
        subtitle="Buscá por título, artista, género o álbum."
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
                  onAddToQueue={() => addToQueue(song)}
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