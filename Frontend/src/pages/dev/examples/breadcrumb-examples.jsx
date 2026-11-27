import { Link, MemoryRouter } from 'react-router-dom'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb.tsx'
import { Skeleton } from '@/components/ui/skeleton.tsx'

// Los ejemplos no dependen de las rutas reales: los enlaces viven en un
// MemoryRouter y no navegan a ninguna pantalla de la app.
function DemoBreadcrumb({ children }) {
  return (
    <MemoryRouter>
      <Breadcrumb>
        <BreadcrumbList className="TextMedium">{children}</BreadcrumbList>
      </Breadcrumb>
    </MemoryRouter>
  )
}

export function BreadcrumbExampleBasic() {
  return (
    <DemoBreadcrumb>
      <BreadcrumbItem>
        <BreadcrumbLink render={<Link to="/home" />}>Inicio</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink render={<Link to="/playlists" />}>Playlists</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbPage className="inline-block max-w-64 truncate align-bottom">
          Favoritos
        </BreadcrumbPage>
      </BreadcrumbItem>
    </DemoBreadcrumb>
  )
}

export function BreadcrumbExampleLoading() {
  return (
    <DemoBreadcrumb>
      <BreadcrumbItem>
        <BreadcrumbLink render={<Link to="/home" />}>Inicio</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink render={<Link to="/salas" />}>Salas</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <Skeleton className="h-3 w-24" />
      </BreadcrumbItem>
    </DemoBreadcrumb>
  )
}

export function BreadcrumbExampleLongLabel() {
  return (
    <DemoBreadcrumb>
      <BreadcrumbItem>
        <BreadcrumbLink render={<Link to="/home" />}>Inicio</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink render={<Link to="/playlists" />}>Playlists</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbPage className="inline-block max-w-64 truncate align-bottom">
          Una playlist colaborativa con un nombre larguísimo que no debería romper el
          layout
        </BreadcrumbPage>
      </BreadcrumbItem>
    </DemoBreadcrumb>
  )
}
