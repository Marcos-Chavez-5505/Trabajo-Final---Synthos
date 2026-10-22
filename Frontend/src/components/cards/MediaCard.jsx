import playIcon from '../../assets/play.svg'
import queueIcon from '../../assets/queue.svg'
import musicNoteIcon from '../../assets/music_note.svg'

/**
 * Tarjeta de canción con overlay inferior (label/título/artista) y botón play
 * circular que aparece al hover. Es la variante de las primeras filas del Home.
 *
 * Medidas fijas del diseño (ver `temp/MediaCard _ MiniMediaCard — preview.html`):
 * ancho 180px, radio 6px, thumb 3:4, overlay padding 10px/12px, play 36px.
 * Los valores salen de `utilities.css` → `tokens.css`.
 *
 * Presentacional: no pide datos ni toca el player. Quien la usa pasa `onPlay` y,
 * si quiere ofrecer la acción, `onAddToQueue`. En mobile los botones quedan
 * siempre visibles (no hay hover); desde `md` aparecen al pasar el mouse.
 */
export default function MediaCard({ title, artist, label, coverUrl = null, onPlay, onAddToQueue }) {
  return (
    <article className="group relative MediaCardWidth shrink-0 cursor-pointer overflow-hidden CardRadius">
      <div className="Light flex aspect-3/4 w-full items-center justify-center">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={`Carátula de ${title}`}
            className="h-full w-full object-cover"
          />
        ) : (
          // Mismo fallback que la carátula del PlayerBar: sin coverUrl (los mocks
          // la traen en null) muestra el ícono de nota en vez de un bloque vacío.
          <img src={musicNoteIcon} alt="" aria-hidden="true" className="h-8 w-8 invert opacity-60" />
        )}
      </div>

      <div className="Volume absolute inset-x-0 bottom-0 px-3 py-2.5 opacity-92">
        <p className="text-accent TextTiny mb-0.5 truncate uppercase">{label}</p>
        <p className="text-foreground TextRegluar truncate">{title}</p>
        <p className="text-muted-foreground TextMedium truncate">{artist}</p>
      </div>

      <div className="absolute right-2.5 bottom-14.5 flex items-center gap-2 opacity-100 transition-opacity duration-150 md:opacity-0 md:group-hover:opacity-100 md:focus-within:opacity-100">
        {onAddToQueue && (
          <button
            type="button"
            onClick={onAddToQueue}
            aria-label={`Añadir ${title} a la cola`}
            title="Añadir a la cola"
            className="Volume MediaCardPlaySize flex cursor-pointer items-center justify-center rounded-full"
          >
            <img src={queueIcon} alt="" aria-hidden="true" className="h-4 w-4" />
          </button>
        )}

        <button
          type="button"
          onClick={onPlay}
          aria-label={`Reproducir ${title}`}
          className="Fucsia MediaCardPlaySize flex cursor-pointer items-center justify-center rounded-full"
        >
          <img src={playIcon} alt="" aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>
    </article>
  )
}