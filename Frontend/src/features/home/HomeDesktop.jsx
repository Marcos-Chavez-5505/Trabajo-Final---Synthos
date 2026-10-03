import { useEffect, useState } from 'react'
import useAuth from '../../hooks/useAuth.js'
import usePlayer from '../../hooks/usePlayer.js'
import { listSongs } from '../../services/songsService.js'
import MediaCard from '../../components/cards/MediaCard.jsx'

// Cuántas canciones muestra la fila de novedades. Es una muestra del catálogo,
// no la grilla completa: esa vive en /buscar.
const NOVEDADES_COUNT = 6

export default function HomeDesktop() {
  const { user } = useAuth()
  const { playSongs } = usePlayer()

  // `error` se separa de `songs` para no ocupar el estado con dos flags: con la
  // lista vacía y sin error la fila simplemente no muestra nada.
  const [songs, setSongs] = useState([])
  const [error, setError] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    let active = true

    listSongs({ signal: controller.signal })
      .then((catalog) => {
        if (active) setSongs(catalog.slice(0, NOVEDADES_COUNT))
      })
      .catch((cause) => {
        if (active) setError(cause.message)
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [])

  return (
    <div className="p-6 md:p-10">
      <h1 className="Header2">Hola, {user?.username}</h1>

      <section className="mt-10">
        <h2 className="Header4 mb-4">Novedades</h2>

        {error ? (
          <p className="text-muted-foreground TextRegluar">No pudimos cargar las novedades.</p>
        ) : (
          /* La fila scrollea en vez de encoger las tarjetas (ancho fijo del
             diseño). La barra se oculta para no quedar pegada al PlayerBar:
             [scrollbar-width:none] para Firefox y la pseudo-elemento para WebKit. */
          <ul className="flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {songs.map((song, index) => (
              <li key={song.id}>
                <MediaCard
                  title={song.title}
                  artist={song.artist}
                  label={song.genre}
                  coverUrl={song.coverUrl}
                  onPlay={() => playSongs(songs, index)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}