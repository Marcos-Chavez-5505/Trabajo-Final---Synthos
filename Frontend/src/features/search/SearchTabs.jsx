import { Link, useSearchParams } from 'react-router-dom'

/**
 * Pestañas de /buscar: una pantalla, varias clases de resultado.
 *
 * El tipo vive en la URL (`?tipo=`) junto a la query, así la búsqueda sigue
 * siendo compartible y el botón "atrás" del browser funciona entre pestañas. Por
 * eso las tabs son `Link` y no un `useState`.
 *
 * `PageHeader` mantiene el mismo esqueleto (h1 + bajada) que las pantallas de
 * `SearchSongs`/`SearchPeople`, y these las pasan por prop para que el texto
 * siga siendo de cada búsqueda.
 */

const TABS = [
  { tipo: 'canciones', label: 'Canciones' },
  { tipo: 'personas', label: 'Personas' },
]

export default function SearchTabs({ tipo, title, subtitle }) {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q') ?? ''

  // Cambiar de pestaña vuelve a la página 1: la página 4 de canciones no
  // significa nada en personas, y los resultados son de otra colección.
  const tabHref = (target) => {
    const params = new URLSearchParams()

    params.set('tipo', target)
    if (query) params.set('q', query)

    return `/buscar?${params.toString()}`
  }

  return (
    <header className="mb-6">
      <h1 className="text-foreground Header3 mb-1">{title}</h1>
      <p className="text-muted-foreground TextMedium">{subtitle}</p>

      <nav className="mt-4 flex gap-2" aria-label="Tipo de búsqueda">
        {TABS.map((tab) => {
          const isActive = tab.tipo === tipo

          return (
            <Link
              key={tab.tipo}
              to={tabHref(tab.tipo)}
              aria-current={isActive ? 'page' : undefined}
              className={
                isActive
                  ? 'rounded-full px-4 py-1.5 Fucsia Button'
                  : 'rounded-full px-4 py-1.5 TextRegluar Volume opacity-70 hover:opacity-100'
              }
            >
              {tab.label}
            </Link>
          )
        })}
      </nav>
    </header>
  )
}
