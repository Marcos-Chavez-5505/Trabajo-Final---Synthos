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

  const [songs, setSongs] = useState([])

  useEffect(() => {
    let active = true

    listSongs().then((catalog) => {
      if (active) setSongs(catalog.slice(0, NOVEDADES_COUNT))
    })

    return () => {
      active = false
    }
  }, [])

  return (
    <div className="p-6 md:p-10">
      <h1 className="Header2">Hola, {user?.username}</h1>

      <section className="mt-10">
        <h2 className="Header4 mb-4">Novedades</h2>

        {/* La fila scrollea en vez de encoger las tarjetas (ancho fijo del
            diseño). La barra se oculta para no quedar pegada al PlayerBar:
            [scrollbar-width:none] para Firefox y la pseudo-elemento para WebKit. */}
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
      </section>
    </div>
  )
}