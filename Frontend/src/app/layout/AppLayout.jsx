import { usePlayer, usePlayerTime } from '@synthos/shared'
import Sidebar from './Sidebar.jsx'
import TopBar from './TopBar.jsx'
import PlayerBar from '@/features/player/components/PlayerBar.jsx'
import ExpandedPlayer from '@/features/player/components/ExpandedPlayer.jsx'
import TransportControls from '@/features/player/components/TransportControls.jsx'
import ActionControls from '@/features/player/components/ActionControls.jsx'
import ProgressBar from '@/features/player/components/ProgressBar.jsx'
import UpNext from '@/features/player/components/UpNext.jsx'
import SidebarAutoCollapse, { SIDEBAR_AUTO_COLLAPSE_QUERY } from './SidebarAutoCollapse.jsx'
import { SidebarProvider } from '@/components/ui/sidebar.tsx'

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
  const { song, isPlaying, seek, isExpanded, expandedOrigin, collapse } = usePlayer()
  const { currentTime, duration } = usePlayerTime()

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
          <main className="min-h-0 flex-1 overflow-y-auto">
            {/* Sticky dentro del scroller: el contenido puede pasar por debajo
                y el degradé tapa el corte de los fondos que sangran hacia
                arriba (PlaylistDetail usa --cover-url para eso). */}
            {/* El degradé se extiende 2rem por debajo del header con un
                pseudo-elemento: así la parte oscura baja más sin empujar el
                contenido (el header mantiene su altura). */}
            <div className="before:pointer-events-none before:absolute before:inset-x-0 before:top-0 before:-z-10 before:h-[calc(100%+2rem)] before:bg-linear-to-b before:from-surface before:via-surface/90 before:to-transparent sticky top-0 z-20">
              <TopBar />
            </div>
            {children}
          </main>
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
