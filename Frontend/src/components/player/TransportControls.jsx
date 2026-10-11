import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import previousIcon from '../../assets/previous_track.svg'
import playIcon from '../../assets/play.svg'
import pauseIcon from '../../assets/pause.svg'
import nextIcon from '../../assets/next_track.svg'
import usePlayer from '../../hooks/usePlayer.js'

/* ======================================================
   TRANSPORT - valores de expansión originales
   pulsado: 1.1 / resto: 0.65 / delay de release: 220ms
   flex-grow y border-radius animados con spring
   Consume el estado global del player (PlayerContext).
====================================================== */
const SIDEBAR_SPRING = { stiffness: 300, damping: 20, mass: 0.6 }
const SPRING = { type: 'spring', ...SIDEBAR_SPRING }
const RELEASE_DELAY = 220

/**
 * Transporte del reproductor expandido: anterior / play-pause / siguiente.
 * Es la versión adaptada del `PlaybackControls` de `temp/`: mismos valores de
 * animación, pero controlado por el PlayerContext y con los íconos del set de
 * assets del proyecto (`<img>`, regla 10 de AGENTS.md).
 */
export default function TransportControls() {
  const { isPlaying, hasQueue, togglePlay, next, previous, playPulse } = usePlayer()

  // Último botón pulsado: mientra es `null` todos tienen ancho igual; al pulsar
  // uno crece (1.1) y los otros se encogen (0.65), y se suelta a los 220ms.
  const [press, setPress] = useState(null)
  const timer = useRef()
  // Ref con el último pulso visto: en el montaje arranca igual al actual, así no
  // anima al aparecer.
  const lastPulse = useRef(playPulse)

  useEffect(() => () => clearTimeout(timer.current), [])

  // El play/pause anima también con la barra espaciadora: el contexto emite un
  // pulso en cada `togglePlay` y acá se traduce a la animación de pulsado.
  useEffect(() => {
    if (playPulse === lastPulse.current) return

    lastPulse.current = playPulse
    setPress('play')
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setPress(null), RELEASE_DELAY)
  }, [playPulse])

  const trigger = (type, cb) => {
    setPress(type)
    cb?.()
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setPress(null), RELEASE_DELAY)
  }

  const grow = (type) => (press === null ? 1 : press === type ? 1.1 : 0.65)

  return (
    <div className="flex h-20 w-full max-w-80 gap-1.5">
      {/* PREV */}
      <motion.button
        type="button"
        initial={false}
        animate={{ flexGrow: grow('prev') }}
        transition={SPRING}
        onClick={() => trigger('prev', previous)}
        disabled={!hasQueue}
        aria-label={"Anterior"}
        title={"Anterior"}
        className="SurfaceLight flex h-full min-w-0 cursor-pointer select-none items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-40"
      >
        <img src={previousIcon} alt="" aria-hidden="true" className="h-7 w-7" />
      </motion.button>

      {/* PLAY / PAUSE */}
      <motion.button
        type="button"
        initial={false}
        animate={{
          flexGrow: grow('play'),
          borderRadius: isPlaying ? 60 : 26,
        }}
        transition={SPRING}
        onClick={togglePlay}
        disabled={!hasQueue}
        aria-label={isPlaying ? "Pausar" : "Reproducir"}
        aria-pressed={isPlaying}
        title={isPlaying ? "Pausar" : "Reproducir"}
        className="Fucsia flex h-full min-w-0 cursor-pointer select-none items-center justify-center disabled:cursor-not-allowed disabled:opacity-40"
      >
        <div className="relative h-9 w-9">
          <img
            src={playIcon}
            alt=""
            aria-hidden="true"
            className={`absolute left-0 top-0 h-9 w-9 transition-opacity duration-[220ms] ease-in-out ${
              isPlaying ? 'opacity-0' : 'opacity-100'
            }`}
          />
          <img
            src={pauseIcon}
            alt=""
            aria-hidden="true"
            className={`absolute left-0 top-0 h-9 w-9 transition-opacity duration-[220ms] ease-in-out ${
              isPlaying ? 'opacity-100' : 'opacity-0'
            }`}
          />
        </div>
      </motion.button>

      {/* NEXT */}
      <motion.button
        type="button"
        initial={false}
        animate={{ flexGrow: grow('next') }}
        transition={SPRING}
        onClick={() => trigger('next', next)}
        disabled={!hasQueue}
        aria-label={"Siguiente"}
        title={"Siguiente"}
        className="SurfaceLight flex h-full min-w-0 cursor-pointer select-none items-center justify-center rounded-full disabled:cursor-not-allowed disabled:opacity-40"
      >
        <img src={nextIcon} alt="" aria-hidden="true" className="h-7 w-7" />
      </motion.button>
    </div>
  )
}