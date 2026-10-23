import shuffleIcon from '../../assets/shuffle.svg'
import previousIcon from '../../assets/previous_track.svg'
import nextIcon from '../../assets/next_track.svg'
import playIcon from '../../assets/play.svg'
import pauseIcon from '../../assets/pause.svg'
import repeatIcon from '../../assets/repeat.svg'
import repeatOneIcon from '../../assets/repeat_only_one.svg'
import { usePlayer } from '@synthos/shared'
import { Tooltip, TooltipTrigger, TooltipContent } from '../ui/tooltip.tsx'
import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

// Mecánica de pulsado tomada del TransportControls del reproductor expandido:
// spring de ancho, grow 1.1 mientras se sostiene el clic y suelta a los 220ms.
// Acá la usa solo el play/pause de la barra (los demás botones no animan ancho).
const SIDEBAR_SPRING = { stiffness: 300, damping: 20, mass: 0.6 }
const SPRING = { type: 'spring', ...SIDEBAR_SPRING }
const RELEASE_DELAY = 220

const REPEAT_LABELS = {
  off: 'Repetir desactivado',
  track: 'Repetir canción',
  list: 'Repetir lista',
}

const TONES = {
  ghost: (active) => (active ? 'Fucsia' : 'Volume hover:opacity-80'),
  solid: () => 'Lighter hover:opacity-80',
  soft: () => 'Light hover:opacity-80',
}

/** Botón circular reutilizable por la barra desktop y el mini reproductor mobile.
 *
 * Con `grow` definido se renderiza como `motion.button` que anima su flex-grow
 * (misma mecánica que TransportControls): el presionado se expande y los demás
 * encogen dentro de un contenedor de ancho fijo. Sin `grow` (MiniPlayerBar) es un
 * `<button>` plano como antes.
 */
export function ControlButton({
  label,
  onClick,
  tone = 'ghost',
  active = false,
  disabled = false,
  className = '',
  tooltip = false,
  grow,
  children,
}) {
  const toneClass = (TONES[tone] ?? TONES.ghost)(active)
  const isMotion = grow !== undefined

  const button = isMotion ? (
    <motion.button
      type="button"
      initial={false}
      animate={{ flexGrow: grow }}
      transition={SPRING}
      aria-label={label}
      title={tooltip ? undefined : label}
      onClick={onClick}
      disabled={disabled}
      className={`flex min-w-0 shrink items-center justify-center rounded-full p-2 transition-opacity disabled:opacity-40 ${toneClass} ${className}`}
    >
      {children}
    </motion.button>
  ) : (
    <button
      type="button"
      aria-label={label}
      title={tooltip ? undefined : label}
      onClick={onClick}
      disabled={disabled}
      className={`flex shrink-0 items-center justify-center rounded-full p-2 transition-opacity disabled:opacity-40 ${toneClass} ${className}`}
    >
      {children}
    </button>
  )

  if (!tooltip) return button

  return (
    <Tooltip>
      <TooltipTrigger render={button} />
      <TooltipContent side="top">{label}</TooltipContent>
    </Tooltip>
  )
}

/** Play/pause + skip + shuffle + repeat. Consume el estado global del player. */
export default function PlayerControls() {
  const {
    isPlaying,
    hasQueue,
    shuffle,
    repeat,
    roomMode,
    playBlocked,
    togglePlay,
    next,
    previous,
    toggleShuffle,
    cycleRepeat,
    playPulse,
  } = usePlayer()

  // Solo el play/pause anima su ancho con flex-grow: en reposo es un círculo
  // (grow 0, ancho natural) y al pulsarlo absorbe el espacio libre del
  // contenedor de ancho fijo y se estira a píldora (rounded-full). Se suelta a
  // los 220ms con el mismo spring que el TransportControls del player expandido.
  const [press, setPress] = useState(null)
  const timer = useRef()
  // Ref con el último pulso visto: en el montaje arranca igual al actual, así no
  // anima al aparecer (AppLayout se remonta por ruta y `playPulse` ya podría ser > 0).
  const lastPulse = useRef(playPulse)

  useEffect(() => () => clearTimeout(timer.current), [])

  // El play/pause anima cuando llega un pulso del contexto: cubre el clic y la
  // barra espaciadora, que llama a `togglePlay` sin pasar por acá.
  useEffect(() => {
    if (playPulse === lastPulse.current) return

    lastPulse.current = playPulse
    setPress('play')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setPress(null), RELEASE_DELAY)
  }, [playPulse])

  const grow = (type) => (press === type ? 0.1 : 0)

  const repeatCurrent = repeat === 'track' ? repeatOneIcon : repeatIcon

  // En una sala los cinco botones siguen a la vista para no cambiar la forma de
  // la barra, pero los cuatro que deciden la lista quedan inertes: la cola la
  // manda el servidor (el anfitrión, o la votación de skip), y mover el índice
  // desde acá dejaría a esta persona sola y desfasada. Están `disabled` además de
  // negados en el PlayerContext, para que sacarles el atributo no alcance.
  //
  // Play/pause sí funciona mientras la sala suena: es el audio de esta persona y
  // bajarlo o volver a subirlo no le cambia el estado a nadie. Con la sala en
  // pausa o detenida queda bloqueado, porque arrancarlo la dejaría sonando sola.
  if (roomMode) {
    return (
      <div className="flex min-w-0 w-60 items-center justify-center gap-0.5 sm:w-64 sm:gap-1 [&>button]:min-w-0 [&>button]:shrink [&_img]:min-w-0">
        <ControlButton label={"Aleatorio"} tooltip disabled>
          <img
            src={shuffleIcon}
            alt=""
            aria-hidden="true"
            className="h-5 w-5 opacity-55"
          />
        </ControlButton>

        <ControlButton label={"Anterior"} tooltip disabled>
          <img src={previousIcon} alt="" aria-hidden="true" className="h-5 w-5" />
        </ControlButton>

        <ControlButton
          label={isPlaying ? "Pausar" : "Reproducir"}
          tooltip
          grow={grow('play')}
          onClick={togglePlay}
          tone="solid"
          disabled={!hasQueue || playBlocked}
        >
          <img
            src={isPlaying ? pauseIcon : playIcon}
            alt=""
            aria-hidden="true"
            className="h-5 w-5 invert"
          />
        </ControlButton>

        <ControlButton label={"Siguiente"} tooltip disabled>
          <img src={nextIcon} alt="" aria-hidden="true" className="h-5 w-5" />
        </ControlButton>

        <ControlButton label={REPEAT_LABELS[repeat]} tooltip disabled>
          <img src={repeatCurrent} alt="" aria-hidden="true" className="h-5 w-5" />
        </ControlButton>
      </div>
    )
  }

  return (
    <div className="flex min-w-0 w-60 items-center justify-center gap-0.5 sm:w-64 sm:gap-1 [&>button]:min-w-0 [&>button]:shrink [&_img]:min-w-0">
      <ControlButton
        label={"Aleatorio"}
        tooltip
        onClick={toggleShuffle}
        active={shuffle}
        disabled={!hasQueue}
      >
        <img src={shuffleIcon} alt="" aria-hidden="true" className="h-5 w-5" />
      </ControlButton>

      <ControlButton label={"Anterior"} tooltip onClick={previous} disabled={!hasQueue}>
        <img src={previousIcon} alt="" aria-hidden="true" className="h-5 w-5" />
      </ControlButton>

      <ControlButton
        label={isPlaying ? "Pausar" : "Reproducir"}
        tooltip
        grow={grow('play')}
        onClick={togglePlay}
        tone="solid"
        disabled={!hasQueue}
      >
        <img
          src={isPlaying ? pauseIcon : playIcon}
          alt=""
          aria-hidden="true"
          className="h-5 w-5 invert"
        />
      </ControlButton>

      <ControlButton label={"Siguiente"} tooltip onClick={next} disabled={!hasQueue}>
        <img src={nextIcon} alt="" aria-hidden="true" className="h-5 w-5" />
      </ControlButton>

      <ControlButton
        label={REPEAT_LABELS[repeat]}
        tooltip
        onClick={cycleRepeat}
        active={repeat !== 'off'}
        disabled={!hasQueue}
      >
        <img src={repeatCurrent} alt="" aria-hidden="true" className="h-5 w-5" />
      </ControlButton>
    </div>
  )
}