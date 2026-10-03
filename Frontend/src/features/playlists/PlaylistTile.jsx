import { Link } from 'react-router-dom'
import playlistIcon from '../../assets/playlist.svg'

/**
 * Tarjeta de una playlist en la grilla de `/playlists`.
 *
 * Muestra la cantidad de canciones y si es la de favoritos. No reproduce: una
 * playlist sin resolver contra la API todavía no tiene la cola, y el detalle es
 * quien la arma (con `playSongs`).
 */
export default function PlaylistTile({ playlist }) {
  const count = playlist.songIds.length

  return (
    <article>
      <Link
        to={`/playlists/${playlist.id}`}
        className="SurfaceLight CardRadius Elevation1 block p-4 hover:opacity-90"
      >
        <div className="Light CardRadius flex aspect-square items-center justify-center">
          <img
            src={playlistIcon}
            alt=""
            aria-hidden="true"
            className="h-10 w-10 invert opacity-70"
          />
        </div>

        <h3 className="text-foreground TextRegluar mt-3 truncate">{playlist.name}</h3>

        <p className="text-muted-foreground TextMedium mt-0.5 truncate">
          {playlist.isFavorites
            ? 'Generada automáticamente'
            : `${count} ${count === 1 ? 'canción' : 'canciones'}`}
        </p>
      </Link>
    </article>
  )
}
