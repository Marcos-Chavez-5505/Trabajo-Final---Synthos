import musicNoteIcon from '../../assets/music_note.svg'
import fullHeartIcon from '../../assets/full_heart.svg'
import AddToQueueButton from '../../components/player/AddToQueueButton.jsx'

/**
 * Fila de canción dentro del detalle de una playlist.
 *
 * Es presentacional: no pide datos ni decide la reproducción. `onPlay` reproduce
 * la cola de la playlist desde esta posición; `onRemove` saca la canción de la
 * playlist. El corazón se dibuja según `isFavorite` pero no cambia el favorito:
 * acá solo informa (el toggle vive en el reproductor), y por eso no es un botón.
 * La acción de encolar sí consume el `PlayerContext` a través de
 * `AddToQueueButton`, igual que el resto de los botones de acción del reproductor.
 */
export default function PlaylistSongRow({
  song,
  index,
  isFavorite,
  onPlay,
  onRemove,
  canRemove = true,
}) {
  const handleKeyDown = (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return

    event.preventDefault()
    onPlay()
  }

  return (
    <article className="SurfaceLight CardRadius flex items-center gap-3 px-3 py-2">
      <span className="text-muted-foreground TextMedium w-5 shrink-0 text-right">
        {index + 1}
      </span>

      <div
        onClick={onPlay}
        role="button"
        tabIndex={0}
        onKeyDown={handleKeyDown}
        className="Light CardRadius h-10 w-10 shrink-0 cursor-pointer overflow-hidden"
      >
        {song.coverUrl ? (
          <img
            src={song.coverUrl}
            alt={`Carátula de ${song.title}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <img src={musicNoteIcon} alt="" aria-hidden="true" className="h-4 w-4 invert opacity-60" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-foreground TextRegluar truncate">{song.title}</p>
        <p className="text-muted-foreground TextMedium truncate">{song.artist}</p>
      </div>

      {isFavorite && (
        <img
          src={fullHeartIcon}
          alt="Es una de tus favoritas"
          title="Es una de tus favoritas"
          className="h-4 w-4 shrink-0"
        />
      )}

      <AddToQueueButton song={song} iconClassName="h-4 w-4" />

      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Sacar ${song.title} de la playlist`}
          title="Sacar de la playlist"
          className="shrink-0 rounded px-2 py-1 TextMedium hover:opacity-70"
        >
          Quitar
        </button>
      )}
    </article>
  )
}
