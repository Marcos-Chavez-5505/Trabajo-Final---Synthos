import { useEffect, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { buildPageRange, useAlbums, ALBUM_TYPE_LABELS } from '@synthos/shared'
import MiniMediaCard from '../../components/cards/MiniMediaCard.jsx'
import albumIcon from '../../assets/album.svg'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '../../components/ui/pagination'

/**
 * `/albums`: el catálogo de discos de la sección "Mi Colección" del Sidebar.
 *
 * Acá solo se lista: la búsqueda de discos vive en la pestaña `?tipo=albumes` de
 * `/buscar`, junto a la de canciones y personas, así que esta pantalla no tiene
 * input. El listado sale de `GET /songs/search?type=albums`, que pagina por número
 * como la búsqueda de canciones, de modo que solo queda la paginación en la URL.
 */
export default function Albums() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const page = Math.max(Number(searchParams.get('page')) || 1, 1)

  const { isCurrent, error, results } = useAlbums(page)

  // Si la URL pedía una página que ya no existe, se corrige la URL en vez de
  // mostrar un vacío engañoso.
  useEffect(() => {
    if (results.total > 0 && results.page !== page) {
      setSearchParams({ page: String(results.page) }, { replace: true })
    }
  }, [results, page, setSearchParams])

  const pageHref = (target) => (target > 1 ? `?page=${target}` : '/albums')

  const isFirstPage = results.page <= 1
  const isLastPage = results.page >= results.totalPages

  const pages = useMemo(
    () => buildPageRange(results.page, results.totalPages),
    [results.page, results.totalPages],
  )

  return (
    <section className="px-6 py-4 md:px-10">
      <h1 className="Header3">Albums</h1>
      <p className="text-muted-foreground TextRegluar mt-1">
        El catálogo completo.{' '}
        <Link to="/buscar?tipo=albumes" className="text-accent">
          Buscá un disco por nombre o por artista
        </Link>
        .
      </p>

      {error ? (
        <div className="py-12 text-center">
          <p className="text-foreground Header4 mb-1">No pudimos cargar los álbumes</p>
          <p className="text-muted-foreground TextRegluar">{error}</p>
        </div>
      ) : results.items.length === 0 ? (
        <EmptyState isLoading={!isCurrent} />
      ) : (
        <>
          <ul className="mt-8 flex flex-wrap gap-x-4 gap-y-6">
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

function EmptyState({ isLoading }) {
  if (isLoading) {
    return <p className="text-muted-foreground TextRegluar mt-8">Cargando álbumes…</p>
  }

  return (
    <div className="py-16 text-center">
      <img
        src={albumIcon}
        alt=""
        aria-hidden="true"
        className="mx-auto h-10 w-10 invert opacity-50"
      />
      <p className="text-foreground Header4 mt-4">Todavía no hay álbumes</p>
      <p className="text-muted-foreground TextRegluar mt-1">
        Cuando se cargue el catálogo, los discos aparecen acá.
      </p>
    </div>
  )
}