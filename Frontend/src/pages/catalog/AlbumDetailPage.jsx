import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { usePlayer } from '@synthos/shared'
import { getAlbumById } from '@synthos/shared'
import { toastMessages } from '@/lib/toastMessages.js'
import MiniMediaCard from '@/components/cards/MiniMediaCard.jsx'
import albumIcon from '@synthos/shared/assets/icons/album.svg'

const TYPE_LABELS = { single: 'Sencillo', ep: 'EP', album: 'Álbum' }

/**
 * Detalle de un álbum: carátula, tipo y año arriba, y las canciones del disco.
 *
 * El botón "Reproducir" usa la cola del `PlayerContext` con las canciones que ya
 * trajo el endpoint, así que no hace falta una segunda request para escuchar.
 */
export default function AlbumDetailPage() {
  const { id } = useParams()
  const { playSongs, addToQueue } = usePlayer()

  const [response, setResponse] = useState({ key: null, album: null, error: false })
  const [reloadToken, setReloadToken] = useState(0)

  useEffect(() => {
    let active = true

    setResponse({ key: String(id), album: null, error: false })

    getAlbumById(id)
      .then((album) => {
        if (active) setResponse({ key: String(id), album, error: false })
      })
      .catch((cause) => {
        if (!active) return

        setResponse({ key: String(id), album: null, error: true })
        toastMessages.albumDetailError(cause)
      })

    return () => {
      active = false
    }
  }, [id, reloadToken])

  const isCurrent = response.key === String(id)
  const album = isCurrent ? response.album : null
  const error = isCurrent ? response.error : null

  if (error) {
    return (
      <section className="px-6 py-4 md:px-10">
        <p className="text-foreground Header4 mt-8">No hay un álbum para mostrar</p>
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setReloadToken((value) => value + 1)}
            className="TextRegluar Volume rounded px-4 py-2"
          >
            Reintentar
          </button>
          <Link to="/albums" className="text-accent inline-block rounded px-4 py-2">
            Volver a albums
          </Link>
        </div>
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
