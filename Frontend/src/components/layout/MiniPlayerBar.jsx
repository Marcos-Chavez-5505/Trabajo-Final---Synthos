import playIcon from '../../assets/play.svg'
import nextIcon from '../../assets/next_track.svg'

/**
 * Shell de UI del mini reproductor mobile (sin estado real).
 * TS-06 lo conecta al PlayerContext global.
 */
export default function MiniPlayerBar() {
  return (
    <div className="fixed inset-x-0 bottom-14 z-10 rounded-t-2xl SurfaceLight Elevation1 md:hidden">
      <div className="flex items-center gap-3 px-4 py-2">
        <div className="min-w-0 flex-1">
          <p className="truncate TextRegluar">Título</p>
          <p className="truncate TextMedium opacity-70">Artista</p>
        </div>

        <button
          type="button"
          aria-label="Reproducir"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full Lighter"
        >
          <img src={playIcon} alt="" aria-hidden="true" className="h-5 w-5 invert" />
        </button>

        <button
          type="button"
          aria-label="Siguiente"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full Light"
        >
          <img src={nextIcon} alt="" aria-hidden="true" className="h-5 w-5 invert" />
        </button>
      </div>

      {/* TODO(agente, TS-06): progreso real y conectado al PlayerContext */}
      <div className="h-0.5 w-full Volume">
        <div className="h-0.5 w-1/4 Fucsia" />
      </div>
    </div>
  )
}
