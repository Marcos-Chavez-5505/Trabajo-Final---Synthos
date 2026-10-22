import musicNoteIcon from '../../assets/music_note.svg'
import usePlayer from '../../hooks/usePlayer.js'

/**
 * Lista "A continuación" del reproductor expandido.
 *
 * Muestra lo que viene después de la canción actual y marca con una píldora las
 * canciones que el usuario añadió a la cola. Es presentación del estado global:
 * el orden ya lo resolvió `PlayerContext.addToQueue()` (las encoladas van
 * primero, en el orden en que se agregaron).
 *
 * Tocar una fila salta a esa posición (`jumpTo`), así que la lista sirve también
 * como navegación de la cola. En modo sala se oculta: ahí la cola la maneja el
 * servidor y el cliente no puede reordenarla ni saltar.
 */
export default function UpNext() {
  const { queue, index, roomMode, jumpTo } = usePlayer()

  if (roomMode) return null

  const upcoming = queue.slice(index + 1)

  if (upcoming.length === 0) return null

  return (
    <section className="w-full px-[18px] pb-10 pt-[clamp(8px,2vh,20px)]">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="Header4">A continuación</h2>
        <span className="TextTiny uppercase opacity-60">
          {upcoming.length} {upcoming.length === 1 ? 'canción' : 'canciones'}
        </span>
      </div>

      <ul className="mt-3 max-h-[38vh] overflow-y-auto">
        {upcoming.map((song, offset) => {
          const position = index + 1 + offset

          return (
            <li key={`${song.id}-${position}`}>
              <button
                type="button"
                onClick={() => jumpTo(position)}
                className="flex w-full cursor-pointer items-center gap-3 rounded px-2 py-2 text-left transition-colors hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <span className="Light flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded">
                  {song.coverUrl ? (
                    <img
                      src={song.coverUrl}
                      alt={`Carátula de ${song.title}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <img
                      src={musicNoteIcon}
                      alt=""
                      aria-hidden="true"
                      className="h-4 w-4 invert opacity-60"
                    />
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="TextRegluar block truncate">{song.title}</span>
                  <span className="TextMedium block truncate opacity-70">{song.artist}</span>
                </span>

                {song.queued && (
                  <span className="Fucsia TextTiny shrink-0 rounded-full px-2 py-0.5 uppercase">
                    En cola
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
