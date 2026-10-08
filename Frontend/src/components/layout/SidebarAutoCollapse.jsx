import * as React from 'react'
import { useSidebar } from '../ui/sidebar.tsx'

/**
 * Umbral único de auto-colapso. Query compartido por el estado inicial
 * (`defaultOpen` en AppLayout) y por este listener, para que no haya
 * parpadeo al cargar. 1279px o menos = colapsado; 1280px o más = expandido.
 */
export const SIDEBAR_AUTO_COLLAPSE_QUERY = '(max-width: 1279px)'

/**
 * Colapsa/expande el sidebar SOLO al cruzar el umbral (evento `change` de
 * matchMedia), nunca en cada resize:
 * - Cruce hacia abajo (matches true) → colapsa.
 * - Cruce hacia arriba (matches false) → expande.
 *
 * No intercepta el trigger ni Ctrl+B: si el usuario expande estando bajo el
 * umbral, esa expansión manual se respeta hasta el próximo cruce.
 *
 * Vive como hijo de SidebarProvider (recibe `setOpen` por contexto) y no
 * renderiza nada, así que no agrega nodos al layout.
 */
function SidebarAutoCollapse() {
  const { setOpen } = useSidebar()

  React.useEffect(() => {
    const mql = window.matchMedia(SIDEBAR_AUTO_COLLAPSE_QUERY)

    const handleChange = (event) => {
      setOpen(!event.matches)
    }

    mql.addEventListener('change', handleChange)
    return () => mql.removeEventListener('change', handleChange)
  }, [setOpen])

  return null
}

export default SidebarAutoCollapse
