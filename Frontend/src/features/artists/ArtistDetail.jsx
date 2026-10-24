import { Link, useNavigate, useParams } from 'react-router-dom'
import { useArtistDetail, ALBUM_TYPE_LABELS } from '@synthos/shared'
import Avatar from '../../components/ui/Avatar.jsx'
import MiniMediaCard from '../../components/cards/MiniMediaCard.jsx'
import albumIcon from '../../assets/album.svg'

/**
 * `/artistas/:id`: cabecera del artista y grilla de sus álbumes.
 *
 * Cada disco usa `MiniMediaCard` y abre el detalle que ya existe en
 * `/albums/:id`; así el artista no duplica la vista de pistas del álbum.
 */
export default function ArtistDetail() {
  const { id } = useParams()
  const navigate = useNavigate()

  const { artist, error } = useArtistDetail(id)

  if (error) {
    return (
      <section className="px-6 py-4 md:px-10">
        <p className="mt-8 rounded px-3 py-2 Salmon TextMedium">{error}</p>
        <Link to="/artistas" className="text-accent mt-6 inline-block rounded px-4 py-2">
          Volver a artistas
        </Link>
      </section>
    )
  }

  if (!artist) {
    return (
      <section className="px-6 py-4 md:px-10">
        <p className="text-muted-foreground TextRegluar mt-8">Cargando artista…</p>
      </section>
    )
  }

  const albumsLabel = `${artist.albumsCount} ${
    artist.albumsCount === 1 ? 'álbum' : 'álbumes'
  }`
  const songsLabel = `${artist.songsCount} ${
    artist.songsCount === 1 ? 'canción' : 'canciones'
  }`

  return (
    <section className="px-6 py-4 md:px-10">
      <header className="flex flex-wrap items-center gap-6">
        <Avatar
          src={artist.pictureUrl}
          name={artist.name}
          className="h-44 w-44 Elevation1"
        />

        <div className="min-w-0 flex-1">
          <p className="text-accent TextTiny uppercase">Artista</p>
          <h1 className="Header3 mt-1 truncate">{artist.name}</h1>
          <p className="text-muted-foreground TextRegluar mt-1">
            {albumsLabel} · {songsLabel}
          </p>
        </div>
      </header>

      <h2 className="Header4 mt-10">Álbumes</h2>

      {artist.albums.length === 0 ? (
        <div className="py-12 text-center">
          <img
            src={albumIcon}
            alt=""
            aria-hidden="true"
            className="mx-auto h-10 w-10 opacity-50"
          />
          <p className="text-muted-foreground TextRegluar mt-4">
            Este artista todavía no tiene álbumes cargados.
          </p>
        </div>
      ) : (
        <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-6">
          {artist.albums.map((album) => (
            <li key={album.id}>
              <MiniMediaCard
                title={album.name}
                artist={album.releaseYear ? String(album.releaseYear) : 'Sin año'}
                label={`${ALBUM_TYPE_LABELS[album.type] ?? album.type} · ${album.songsCount} ${
                  album.songsCount === 1 ? 'canción' : 'canciones'
                }`}
                coverUrl={album.coverUrl}
                onPlay={() => navigate(`/albums/${album.id}`)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}