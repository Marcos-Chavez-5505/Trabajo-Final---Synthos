import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { usePlayer } from '@synthos/shared'
import { getAlbumById } from '@synthos/shared'
import MiniMediaCard from '../../components/cards/MiniMediaCard.jsx'
import albumIcon from '../../assets/album.svg'
import { mapApiError } from '@synthos/shared'

const TYPE_LABELS = { single: 'Sencillo', ep: 'EP', album: 'Álbum' }

/**
 * Detalle de un álbum: carátula, tipo y año arriba, y las canciones del disco.
 *
 * El botón "Reproducir" usa la cola del `PlayerContext` con las canciones que ya
 * trajo el endpoint, así que no hace falta una segunda request para escuchar.
 */
export default function AlbumDetail() {
  const { id } = useParams()
  const { playSongs, addToQueue } = usePlayer()

  const [response, setResponse] = useState({ key: null, album: null, error: null })

  useEffect(() => {
    let active = true

    getAlbumById(id)
      .then((album) => {
        if (active) setResponse({ key: String(id), album, error: null })
      })
      .catch((cause) => {
        if (active) setResponse({ key: String(id), album: null, error: mapApiError(cause) })
      })

    return () => {
      active = false
    }
  }, [id])

  const isCurrent = response.key === String(id)
  const album = isCurrent ? response.album : null
  const error = isCurrent ? response.error : null

  if (error) {
    return (
      <section className="px-6 py-4 md:px-10">
        <p className="mt-8 rounded px-3 py-2 Salmon TextMedium">{error}</p>
        <Link to="/albums" className="text-accent mt-6 inline-block rounded px-4 py-2">
          Volver a albums
        </Link>
      </section>
    )
  }

  if (!album) {
    return (
      <section className="px-6 py-4 md:px-10">
        <p className="text-muted-foreground TextRegluar mt-8">Cargando álbum…</p>
      </section>
    )
  }

  return (
    <section className="px-6 py-4 md:px-10">
      <header className="flex flex-wrap items-start gap-6">
        <div className="Light CardRadius h-44 w-44 shrink-0 overflow-hidden">
          {album.coverUrl ? (
            <img
              src={album.coverUrl}
              alt={`Carátula de ${album.name}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <img
              src={albumIcon}
              alt=""
              aria-hidden="true"
              className="mx-auto h-10 w-10 invert opacity-50"
            />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-accent TextTiny uppercase">
            {TYPE_LABELS[album.type] ?? album.type}
            {album.releaseYear ? ` · ${album.releaseYear}` : ''}
          </p>
          <h1 className="Header3 mt-1 truncate">{album.name}</h1>
          <p className="text-muted-foreground TextRegluar mt-1 truncate">
            {album.artistName ?? 'Artista desconocido'}
          </p>
          <p className="text-muted-foreground TextMedium mt-1">
            {album.songs.length} {album.songs.length === 1 ? 'canción' : 'canciones'}
          </p>

          <button
            type="button"
            onClick={() => playSongs(album.songs, 0)}
            disabled={album.songs.length === 0}
            className="mt-4 rounded px-4 py-2 Fucsia Button hover:brightness-110 disabled:opacity-50 disabled:hover:brightness-100"
          >
            Reproducir
          </button>
        </div>
      </header>

      {album.songs.length === 0 ? (
        <p className="text-muted-foreground TextRegluar mt-10">
          Este álbum todavía no tiene canciones cargadas.
        </p>
      ) : (
        <ul className="mt-10 flex flex-wrap gap-x-4 gap-y-6">
          {album.songs.map((song, index) => (
            <li key={song.id}>
              <MiniMediaCard
                title={song.title}
                artist={song.artist ?? album.artistName ?? 'Artista desconocido'}
                label={song.genre}
                coverUrl={song.coverUrl}
                onPlay={() => playSongs(album.songs, index)}
                onAddToQueue={() => addToQueue(song)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
