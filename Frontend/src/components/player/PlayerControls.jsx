import shuffleIcon from '../../assets/shuffle.svg'
import previousIcon from '../../assets/previous_track.svg'
import nextIcon from '../../assets/next_track.svg'
import playIcon from '../../assets/play.svg'
import pauseIcon from '../../assets/pause.svg'
import repeatIcon from '../../assets/repeat.svg'
import repeatOneIcon from '../../assets/repeat_only_one.svg'
import usePlayer from '../../hooks/usePlayer.js'

const REPEAT_LABELS = {
  off: 'Repetir desactivado',
  track: 'Repetir canción',
  list: 'Repetir lista',
}

function ControlButton({ label, onClick, active = false, disabled = false, children }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full p-2 transition-opacity disabled:opacity-40 ${
        active ? 'Fucsia' : 'Volume hover:opacity-80'
      }`}
    >
      {children}
    </button>
  )
}

/** Play/pause + skip + shuffle + repeat. Consume el estado global del player. */
export default function PlayerControls() {
  const {
    isPlaying,
    hasQueue,
    shuffle,
    repeat,
    togglePlay,
    next,
    previous,
    toggleShuffle,
    cycleRepeat,
  } = usePlayer()

  const repeatCurrent = repeat === 'track' ? repeatOneIcon : repeatIcon

  return (
    <div className="flex items-center gap-1">
      <ControlButton
        label="Aleatorio"
        onClick={toggleShuffle}
        active={shuffle}
        disabled={!hasQueue}
      >
        <img src={shuffleIcon} alt="" aria-hidden="true" className="h-5 w-5" />
      </ControlButton>

      <ControlButton label="Anterior" onClick={previous} disabled={!hasQueue}>
        <img src={previousIcon} alt="" aria-hidden="true" className="h-5 w-5" />
      </ControlButton>

      <ControlButton
        label={isPlaying ? 'Pausar' : 'Reproducir'}
        onClick={togglePlay}
        disabled={!hasQueue}
      >
        <img
          src={isPlaying ? pauseIcon : playIcon}
          alt=""
          aria-hidden="true"
          className="h-7 w-7"
        />
      </ControlButton>

      <ControlButton label="Siguiente" onClick={next} disabled={!hasQueue}>
        <img src={nextIcon} alt="" aria-hidden="true" className="h-5 w-5" />
      </ControlButton>

      <ControlButton
        label={REPEAT_LABELS[repeat]}
        onClick={cycleRepeat}
        active={repeat !== 'off'}
        disabled={!hasQueue}
      >
        <img src={repeatCurrent} alt="" aria-hidden="true" className="h-5 w-5" />
      </ControlButton>
    </div>
  )
}
