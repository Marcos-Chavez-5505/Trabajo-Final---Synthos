import useBreakpoint from '../../hooks/useBreakpoint.js'
import Sidebar from './Sidebar.jsx'
import BottomNav from './BottomNav.jsx'
import MiniPlayerBar from './MiniPlayerBar.jsx'
import TopBar from './TopBar.jsx'
import PlayerBar from '../player/PlayerBar.jsx'
import SidebarAutoCollapse, { SIDEBAR_AUTO_COLLAPSE_QUERY } from './SidebarAutoCollapse.jsx'
import { SidebarProvider } from '../ui/sidebar.tsx'

/**
 * `defaultOpen` calculado con el MISMO query que el auto-colapso: si la
 * ventana arranca bajo el umbral, el sidebar nace colapsado sin parpadeo.
 * Protegido para renders sin `window` (SSR/prerender).
 */
function getDefaultSidebarOpen() {
  if (typeof window === 'undefined' || !window.matchMedia) return true
  return !window.matchMedia(SIDEBAR_AUTO_COLLAPSE_QUERY).matches
}

/**
 * Layout raíz. Alterna Sidebar (desktop, shadcn/ui) vs BottomNav + MiniPlayerBar (mobile).
 * Sin lógica de negocio: solo composición visual.
 */
export default function AppLayout({ children }) {
  const breakpoint = useBreakpoint()
  const isMobile = breakpoint === 'mobile'

  if (isMobile) {
    return (
      <div className="flex h-dvh Surface">
        <div className="flex flex-1 flex-col">
          <main className="min-h-0 flex-1 overflow-y-auto pb-28">{children}</main>
          <MiniPlayerBar />
          <BottomNav />
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider
      defaultOpen={getDefaultSidebarOpen()}
      className="Surface h-dvh min-h-0"
    >
      {/* Colapsa/expande el sidebar solo al cruzar el umbral de 1280px.
          El trigger y Ctrl+B siguen mandando sobre el estado manual. */}
      <SidebarAutoCollapse />
      <div className="isolate flex min-h-0 min-w-0 flex-1">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
          {/* Dentro de la columna de contenido: el sidebar-gap (shadcn) reserva el
              ancho con transition-[width], así que el reproductor se adapta a su
              lado derecho y se ensancha al contraerse el sidebar. */}
          <PlayerBar />
        </div>
      </div>
    </SidebarProvider>
  )
}
