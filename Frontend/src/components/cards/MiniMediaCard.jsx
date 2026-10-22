import musicNoteIcon from '../../assets/music_note.svg'
import queueIcon from '../../assets/queue.svg'

/**
 * Tarjeta de canción compacta, sin overlay: carátula cuadrada y texto debajo
 * (título, artista, label). Es la variante plana de las filas secundarias del
 * Home.
 *
 * Medidas fijas del diseño (ver `temp/MediaCard _ MiniMediaCard — preview.html`):
 * ancho 150px, radio 6px, thumb 1:1, separación carátula→título 8px y 2px entre
 * las líneas de texto. Los valores salen de `utilities.css` → `tokens.css`.
 *
 * Presentacional: no pide datos ni toca el player. Quien la usa pasa `onPlay` y,
 * si quiere ofrecer la acción, `onAddToQueue`. El botón de cola queda siempre
 * visible en mobile y aparece al hover desde `md`.
 */
export default function MiniMediaCard({
  title,
  artist,
  label,
  coverUrl = null,
  onPlay,
  onAddToQueue,
}) {
  const handleKeyDown = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return

    event.preventDefault()
    onPlay()
  }

  return (
    <article className="group relative MiniMediaCardWidth shrink-0">
      <div
        onClick={onPlay}
        role={onPlay ? 'button' : undefined}
        tabIndex={onPlay ? 0 : undefined}
        onKeyDown={onPlay ? handleKeyDown : undefined}
        className="Light mb-2 flex aspect-square w-full cursor-pointer items-center justify-center overflow-hidden CardRadius"
      >
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={`Carátula de ${title}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <img src={musicNoteIcon} alt="" aria-hidden="true" className="h-8 w-8 invert opacity-60" />
        )}
      </div>

      {onAddToQueue && (
        <button
          type="button"
          onClick={onAddToQueue}
          aria-label={`Añadir ${title} a la cola`}
          title="Añadir a la cola"
          className="Volume absolute right-1.5 top-1.5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full opacity-100 transition-opacity duration-150 md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100"
        >
          <img src={queueIcon} alt="" aria-hidden="true" className="h-4 w-4" />
        </button>
      )}

      <p className="text-foreground TextRegluar truncate">{title}</p>
      <p className="text-muted-foreground TextMedium mt-0.5 truncate">{artist}</p>
      <p className="text-accent TextTiny mt-0.5 truncate uppercase">{label}</p>
    </article>
  )
}