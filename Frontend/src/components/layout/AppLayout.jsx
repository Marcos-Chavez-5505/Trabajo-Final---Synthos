import usePlayer from '../../hooks/usePlayer.js'
import Sidebar from './Sidebar.jsx'
import TopBar from './TopBar.jsx'
import PlayerBar from '../player/PlayerBar.jsx'
import ExpandedPlayer from '../player/ExpandedPlayer.jsx'
import TransportControls from '../player/TransportControls.jsx'
import ActionControls from '../player/ActionControls.jsx'
import ProgressBar from '../player/ProgressBar.jsx'
import UpNext from '../player/UpNext.jsx'
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
 * Layout raíz, solo desktop: Sidebar (shadcn/ui) + TopBar + contenido + PlayerBar.
 * Sin lógica de negocio: solo composición visual. El mobile se rehará aparte
 * (ver `docs/PENDIENTES.md` §8).
 */
export default function AppLayout({ children }) {
  const { song, isPlaying, currentTime, duration, seek, isExpanded, expandedOrigin, collapse } =
    usePlayer()

  // Overlay de reproducción expandida: se monta UNA vez en el layout raíz y lee
  // el estado global (PlayerContext), así sobrevive a la navegación. Los
  // controles entran por slots para reutilizar los componentes reales del player.
  const expandedPlayer = (
    <ExpandedPlayer
      open={isExpanded}
      onClose={collapse}
      origin={expandedOrigin}
      coverUrl={song?.coverUrl ?? ''}
      title={song?.title ?? 'Nada reproduciendo'}
      artist={song?.artist ?? '—'}
      sourceName={song?.source}
      isPlaying={isPlaying}
      progressSlot={
        <ProgressBar currentTime={currentTime} duration={duration} onSeek={seek} />
      }
      transportSlot={<TransportControls />}
      actionsSlot={<ActionControls songId={song?.id} />}
      upNextSlot={<UpNext />}
    />
  )

  return (
    <SidebarProvider
      defaultOpen={getDefaultSidebarOpen()}
      className="Surface relative h-dvh min-h-0 overflow-hidden"
    >
      {/* Colapsa/expande el sidebar solo al cruzar el umbral de 1280px.
          El trigger y Ctrl+B siguen mandando sobre el estado manual. */}
      <SidebarAutoCollapse />
      <div className="isolate flex min-h-0 min-w-0 flex-1">
        <Sidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
          {/* Dentro de la columna de contenido: el sidebar-gap (shadcn) reserva el
              ancho con transition-[width], así que el reproductor se adapta a su
              lado derecho y se ensancha al contraerse el sidebar. */}
          <PlayerBar />
          {expandedPlayer}
        </div>
      </div>
    </SidebarProvider>
  )
}
