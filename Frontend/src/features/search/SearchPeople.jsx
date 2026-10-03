import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import useDebounce from '../../hooks/useDebounce.js'
import buildPageRange from '../../lib/pageRange.js'
import { searchUsers, SEARCH_PAGE_SIZE } from '../../services/usersService.js'
import Avatar from '../../components/ui/Avatar.jsx'
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

const DEBOUNCE_MS = 300

const EMPTY_RESULTS = { items: [], total: 0, page: 1, pageSize: 1, totalPages: 1 }

export default function SearchPeople() {
  const [searchParams, setSearchParams] = useSearchParams()

  // Igual que en SearchSongs: la query y la página viven en la URL para que el
  // resultado sea compartible y el "atrás" del browser funcione.
  const query = searchParams.get('q') ?? ''
  const page = Math.max(Number(searchParams.get('page')) || 1, 1)

  const debouncedQuery = useDebounce(query, DEBOUNCE_MS)

  // La respuesta se guarda con la key que la pidió: el loading se deriva en vez
  // de setear un booleano, y nunca se ve un resultado viejo con la query nueva.
  const requestKey = `${debouncedQuery}::${page}`
  const [response, setResponse] = useState({ key: null, data: null, error: null })

  useEffect(() => {
    let active = true

    searchUsers(debouncedQuery, page, SEARCH_PAGE_SIZE)
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
    }
  }, [debouncedQuery, page, requestKey])

  const isCurrent = response.key === requestKey
  const isLoading = !isCurrent
  const error = isCurrent ? response.error : null
  const results = isCurrent ? (response.data ?? EMPTY_RESULTS) : EMPTY_RESULTS

  // Si la URL pedía una página que ya no existe (el total bajó al cambiar la
  // query), se corrige acá en vez de mostrar un "sin resultados" engañoso.
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
              <li key={person.id}>
                {/* Todo el ítem es el link: con mouse o teclado se llega al
                    perfil público del mismo modo. */}
                <Link
                  to={`/profile/${person.id}`}
                  className="SurfaceLight CardRadius Elevation1 flex items-center gap-4 p-4 hover:opacity-90"
                >
                  <Avatar src={person.avatarUrl} name={person.username} className="h-12 w-12" />

                  <div className="min-w-0">
                    <p className="text-foreground TextRegluar truncate">{person.username}</p>
                    <p className="text-muted-foreground TextMedium mt-0.5 truncate">
                      {person.bio || 'Sin bio todavía.'}
                    </p>
                  </div>
                </Link>
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
