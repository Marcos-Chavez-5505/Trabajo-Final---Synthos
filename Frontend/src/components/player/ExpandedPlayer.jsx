import { motion, useReducedMotion } from 'motion/react'
import { CoverDisc, PlayingFrom, TrackInfo } from './Parts.jsx'

/**
 * Fallback del origen cuando el overlay se abre sin una medición del botón:
 * abajo a la derecha, cerca de donde vive el botón del PlayerBar, con radio
 * suficiente para cubrir la pantalla.
 */
function defaultOrigin() {
  if (typeof window === 'undefined') return { x: 0, y: 0, radius: 0 }

  return {
    x: window.innerWidth - 40,
    y: window.innerHeight - 40,
    radius: Math.hypot(window.innerWidth, window.innerHeight),
  }
}

/**
 * Overlay de reproducción expandida, presentacional, sin estado propio.
 *
 * Consume del layout los datos de la canción actual, `open`/`onClose` (estado
 * global en PlayerContext) y `origin`: el centro/radio desde donde crece el
 * revelado circular al abrir. Los controles entran por slots para reutilizar los
 * componentes reales del player (`ProgressBar`, `TransportControls`,
 * `ActionControls`) en vez de duplicar su lógica.
 */
export default function ExpandedPlayer({
  open,
  onClose,
  origin,
  coverUrl,
  title,
  artist,
  sourceName,
  isPlaying,
  progressSlot, // <ProgressBar />
  transportSlot, // anterior / play-pause / siguiente
  actionsSlot, // shuffle / repetir / favorito / añadir a playlist
}) {
  const reduceMotion = useReducedMotion()
  const point = origin ?? defaultOrigin()
  const from = `circle(0px at ${point.x}px ${point.y}px)`
  const to = `circle(${point.radius}px at ${point.x}px ${point.y}px)`

  return (
    <motion.section
      inert={!open}
      initial={false}
      animate={{ clipPath: open ? to : from }}
      transition={reduceMotion ? { duration: 0 } : { duration: 0.5, ease: [0.2, 0, 0, 1] }}
      style={{ pointerEvents: open ? 'auto' : 'none' }}
      className="Volume fixed left-0 right-0 top-0 z-[1000] h-dvh overflow-y-auto pb-[env(safe-area-inset-bottom)] text-[var(--ds-lighter)]"
      data-state={open ? 'open' : 'closed'}
      role="dialog"
      aria-label="Reproductor expandido"
      aria-hidden={!open}
    >
      <button
        type="button"
        className="fixed right-4 top-[calc(env(safe-area-inset-top,0px)+12px)] z-[2] grid h-10 w-10 cursor-pointer place-items-center rounded-full border-0 bg-background/30 text-[var(--ds-lighter)] focus-visible:outline-2 focus-visible:outline-offset-2"
        onClick={onClose}
        aria-label="Minimizar reproductor"
        tabIndex={open ? 0 : -1}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      <div className="mx-auto flex min-h-full w-[min(600px,calc(100%_-_32px))] flex-col">
        <CoverDisc
          src={coverUrl}
          alt={`Carátula de ${title}`}
          spinning={isPlaying && open}
        />
        <TrackInfo title={title} artist={artist} />
        <PlayingFrom name={sourceName} />
        <div className="px-[18px] pt-[clamp(12px,3vh,28px)]">{progressSlot}</div>
        <div className="mt-[clamp(12px,4vh,40px)] flex justify-center gap-2">{transportSlot}</div>
        <div className="my-[clamp(12px,4vh,32px)] flex justify-center">{actionsSlot}</div>
      </div>
    </motion.section>
  )
}
