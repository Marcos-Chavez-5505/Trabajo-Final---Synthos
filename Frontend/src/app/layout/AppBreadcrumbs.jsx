import { Fragment, useContext, useMemo } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb.tsx'
import { Skeleton } from '@/components/ui/skeleton.tsx'
import { BreadcrumbLabelsContext } from '@/hooks/breadcrumbLabelsContext.js'
import { buildBreadcrumbs } from '@/lib/breadcrumbs.js'

/**
 * Franja de breadcrumbs de la shell. Lee la ruta actual y los labels que
 * publicaron las páginas, arma la cadena con `buildBreadcrumbs` y la dibuja con
 * las primitivas de `components/ui/breadcrumb.tsx`.
 *
 * No conoce el detalle de las páginas ni hace fetch: los datos ya cargados los
 * publica cada página con `useBreadcrumbLabel`.
 */
export default function AppBreadcrumbs() {
  const { pathname } = useLocation()
  const contexto = useContext(BreadcrumbLabelsContext)
  const labels = contexto?.labels

  const migas = useMemo(
    () => buildBreadcrumbs(pathname, labels ?? {}),
    [pathname, labels]
  )

  // Una sola miga (Home) es ruido; fuera del mapa tampoco se muestra.
  if (migas.length < 2) return null

  return (
    <Breadcrumb className="min-w-0 px-6 pb-2 md:px-10">
      <BreadcrumbList className="TextMedium">
        {migas.map((miga, index) => {
          const esUltima = index === migas.length - 1

          return (
            <Fragment key={miga.patron}>
              <BreadcrumbItem>
                {miga.cargando ? (
                  <Skeleton className="h-3 w-24" />
                ) : esUltima ? (
                  <BreadcrumbPage className="inline-block max-w-40 truncate align-bottom sm:max-w-64">
                    {miga.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink
                    render={<Link to={miga.to} />}
                    className="inline-block max-w-28 truncate align-bottom sm:max-w-48"
                  >
                    {miga.label}
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>

              {!esUltima && <BreadcrumbSeparator />}
            </Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
