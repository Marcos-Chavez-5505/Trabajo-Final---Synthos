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
import BreadcrumbProvider from './BreadcrumbProvider.jsx'
import AppBreadcrumbs from './AppBreadcrumbs.jsx'
import { SidebarProvider } from '@/components/ui/sidebar.tsx'

function getDefaultSidebarOpen() {
  if (typeof window === 'undefined' || !window.matchMedia) return true
  return !window.matchMedia(SIDEBAR_AUTO_COLLAPSE_QUERY).matches
}

export default function AppLayout({ children }) {
  const { song, isPlaying, seek, isExpanded, expandedOrigin, collapse } = usePlayer()
  const { currentTime, duration } = usePlayerTime()

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
      <SidebarAutoCollapse />
      <div className="isolate flex min-h-0 min-w-0 flex-1">
        <Sidebar />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <main className="min-h-0 flex-1 overflow-y-auto">
            <BreadcrumbProvider>
              <div className="pointer-events-none sticky top-0 z-10 h-0">
                <div className="absolute inset-x-0 top-0 h-[calc(var(--ds-height-button)+2*var(--ds-space-lg)+2rem)] bg-linear-to-b from-surface via-surface/90 to-transparent" />
              </div>
              <div className="pointer-events-none sticky top-0 z-20">
                <TopBar />
              </div>
              <AppBreadcrumbs />
              {children}
            </BreadcrumbProvider>
          </main>
          <PlayerBar />
          {expandedPlayer}
        </div>
      </div>
    </SidebarProvider>
  )
}