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
      <div className="flex min-h-screen Surface">
        <div className="flex flex-1 flex-col">
          <main className="flex-1 overflow-y-auto pb-28">{children}</main>
          <MiniPlayerBar />
          <BottomNav />
        </div>
      </div>
    )
  }

  return (
    <SidebarProvider className="Surface flex-col">
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </div>

      {/* Fuera de la fila: el reproductor ocupa el ancho completo de la ventana. */}
      <PlayerBar />
    </SidebarProvider>
  )
}
