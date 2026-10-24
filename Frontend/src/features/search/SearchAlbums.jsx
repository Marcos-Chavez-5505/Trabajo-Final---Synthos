import { useEffect, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { buildPageRange, useSearchAlbums, ALBUM_TYPE_LABELS } from '@synthos/shared'
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

export default function SearchAlbums() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const query = searchParams.get('q') ?? ''
  const page = Math.max(Number(searchParams.get('page')) || 1, 1)

  const { isLoading, error, results } = useSearchAlbums(query, page)

  useEffect(() => {
    if (results.total > 0 && results.page !== page) {
      setSearchParams({ tipo: 'albumes', q: query, page: String(results.page) }, { replace: true })
    }
  }, [results, page, query, setSearchParams])

  const pageHref = (target) => {
    const params = new URLSearchParams()

    params.set('tipo', 'albumes')
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
        tipo="albumes"
        title="Buscar álbumes"
        subtitle="Buscá por nombre del disco o del artista."
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
              ? `No encontramos álbumes para "${query}". Probá con otro término.`
              : 'No hay álbumes para mostrar.'}
          </p>
        </div>
      ) : (
        <>
          <ul className="flex flex-wrap gap-x-4 gap-y-6">
            {results.items.map((album) => (
              <li key={album.id}>
                <MiniMediaCard
                  title={album.name}
                  artist={album.artistName ?? 'Artista desconocido'}
                  label={ALBUM_TYPE_LABELS[album.type] ?? album.type}
                  coverUrl={album.coverUrl}
                  onPlay={() => navigate(`/albums/${album.id}`)}
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