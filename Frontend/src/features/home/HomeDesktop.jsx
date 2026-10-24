import { useAuth, useHomeSongs } from '@synthos/shared'
import MediaCard from '../../components/cards/MediaCard.jsx'

export default function HomeDesktop() {
  const { user } = useAuth()
  const { songs, error, playSongs, addToQueue } = useHomeSongs()

  return (
    <div className="p-6 md:p-10">
      <h1 className="Header2">Hola, {user?.username}</h1>

      <section className="mt-10">
        <h2 className="Header4 mb-4">Novedades</h2>

        {error ? (
          <p className="text-muted-foreground TextRegluar">No pudimos cargar las novedades.</p>
        ) : (
          <ul className="flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {songs.map((song, index) => (
              <li key={song.id}>
                <MediaCard
                  title={song.title}
                  artist={song.artist}
                  label={song.genre}
                  coverUrl={song.coverUrl}
                  onPlay={() => playSongs(songs, index)}
                  onAddToQueue={() => addToQueue(song)}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}