import playIcon from '../../assets/play.svg'
import pauseIcon from '../../assets/pause.svg'
import nextIcon from '../../assets/next_track.svg'
import usePlayer from '../../hooks/usePlayer.js'
import FavoriteButton from '../../features/playlists/FavoriteButton.jsx'
import { ControlButton } from '../player/PlayerControls.jsx'
import ProgressBar from '../player/ProgressBar.jsx'

/**
 * Mini reproductor mobile, apoyado sobre el BottomNav. Consume el PlayerContext
 * global (mismo estado que el reproductor desktop) y muestra tiempo con etiquetas.
 */
export default function MiniPlayerBar() {
  const {
    song,
    isPlaying,
    hasQueue,
    currentTime,
    duration,
    togglePlay,
    next,
    seek,
  } = usePlayer()

  if (!hasQueue) return null

  return (
    <div className="fixed inset-x-0 bottom-14 z-10 rounded-t-2xl SurfaceLight Elevation1 md:hidden">
      <div className="flex items-center gap-3 px-4 py-2">
        <div className="min-w-0 flex-1">
          <p className="truncate TextRegluar">{song?.title ?? 'Nada reproduciendo'}</p>
          <p className="truncate TextMedium opacity-70">{song?.artist ?? '—'}</p>
        </div>

        <ControlButton
          label={isPlaying ? 'Pausar' : 'Reproducir'}
          onClick={togglePlay}
          tone="solid"
        >
          <img
            src={isPlaying ? pauseIcon : playIcon}
            alt=""
            aria-hidden="true"
            className="h-5 w-5 invert"
          />
        </ControlButton>

        <ControlButton label="Siguiente" onClick={next} tone="soft">
          <img src={nextIcon} alt="" aria-hidden="true" className="h-5 w-5 invert" />
        </ControlButton>

        {/* El mini reproductor es angosto: solo el favorito, que no necesita
            panel. "Agregar a playlist" queda en la versión desktop. */}
        <FavoriteButton songId={song?.id} className="p-1.5" />
      </div>

      <ProgressBar
        currentTime={currentTime}
        duration={duration}
        onSeek={seek}
        size="sm"
        className="px-4 pb-2"
      />
    </div>
  )
}
