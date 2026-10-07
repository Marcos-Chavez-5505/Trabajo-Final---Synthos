import useBreakpoint from '../../hooks/useBreakpoint.js'
import Sidebar from './Sidebar.jsx'
import BottomNav from './BottomNav.jsx'
import MiniPlayerBar from './MiniPlayerBar.jsx'
import TopBar from './TopBar.jsx'
import PlayerBar from '../player/PlayerBar.jsx'
import { SidebarProvider } from '../ui/sidebar.tsx'

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
    <SidebarProvider className="Surface h-dvh min-h-0">
      <div className="flex min-h-0 min-w-0 flex-1">
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
