import { useEffect, useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { buildPageRange, useSearchPeople } from '@synthos/shared'
import SearchPersonRow from './SearchPersonRow.jsx'
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

export default function SearchPeople() {
  const [searchParams, setSearchParams] = useSearchParams()

  const query = searchParams.get('q') ?? ''
  const page = Math.max(Number(searchParams.get('page')) || 1, 1)

  const { isLoading, error, results } = useSearchPeople(query, page)

  useEffect(() => {
    if (results.total > 0 && results.page !== page) {
      setSearchParams(
        { tipo: 'personas', q: query, page: String(results.page) },
        { replace: true }
      )
    }
  }, [results, page, query, setSearchParams])

  const pageHref = (target) => {
    const params = new URLSearchParams()

    params.set('tipo', 'personas')
    if (query) params.set('q', query)
    if (target > 1) params.set('page', String(target))

    return `?${params.toString()}`
  }

  const isFirstPage = results.page <= 1
  const isLastPage = results.page >= results.totalPages

  const pages = useMemo(
    () => buildPageRange(results.page, results.totalPages),
    [results.page, results.totalPages]
  )

  return (
    <section className="px-6 py-4">
      <SearchTabs
        tipo="personas"
        title="Buscar personas"
        subtitle="Buscá por nombre de usuario."
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
              ? `No encontramos personas para "${query}". Probá con otro término.`
              : 'No hay personas para mostrar.'}
          </p>
        </div>
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {results.items.map((person) => (
              <li key={`${results.page}-${person.id}`}>
                <SearchPersonRow person={person} />
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
                  )
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