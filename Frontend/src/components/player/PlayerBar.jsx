import musicNoteIcon from '../../assets/music_note.svg'
import usePlayer from '../../hooks/usePlayer.js'
import PlayerControls from './PlayerControls.jsx'
import ProgressBar from './ProgressBar.jsx'

function SongCover({ song }) {
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded Wall">
      {song?.coverUrl ? (
        <img
          src={song.coverUrl}
          alt={song.album ?? song.title}
          className="h-full w-full rounded object-cover"
        />
      ) : (
        <img src={musicNoteIcon} alt="" aria-hidden="true" className="h-6 w-6" />
      )}
    </div>
  )
}

/** Reproductor completo, solo desktop. Presentación del PlayerContext. */
export default function PlayerBar() {
  const { song, currentTime, duration, seek, hasQueue } = usePlayer()

  if (!hasQueue) return null

  return (
    <footer className="flex items-center gap-4 border-t border-sidebar-border px-4 py-3 md:px-6">
      <SongCover song={song} />

      <div className="min-w-0 flex-1">
        <p className="truncate TextRegluar">{song?.title ?? 'Nada reproduciendo'}</p>
        <p className="truncate TextMedium opacity-70">{song?.artist ?? '—'}</p>
      </div>

      <div className="flex flex-1 flex-col items-center gap-1">
        <PlayerControls />
        <ProgressBar
          currentTime={currentTime}
          duration={duration}
          onSeek={seek}
          className="max-w-xl"
        />
      </div>
    </footer>
  )
}
