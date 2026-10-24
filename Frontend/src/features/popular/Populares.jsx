import { usePopularSongs } from '@synthos/shared'
import MediaCard from '../../components/cards/MediaCard.jsx'
import fullHeartIcon from '../../assets/full_heart.svg'

/**
 * `/populares`: ranking semanal de canciones por favoritos.
 *
 * La ventana y el mínimo los decide el backend (semana actual y 3 personas
 * distintas). Acá solo se muestra el resultado y se reutiliza `MediaCard` para
 * que la tarjeta sea la misma del resto de la app.
 */
export default function Populares() {
  const { data, error, songs, minimumFavorites, playSongs, addToQueue } = usePopularSongs()

  return (
    <section className="px-6 py-4 md:px-10">
      <h1 className="Header3">Populares</h1>
      <p className="text-muted-foreground TextRegluar mt-1">
        Las canciones que más personas distintas marcaron como favoritas esta semana.
        Entran las que reúnen al menos {minimumFavorites} favoritos.
      </p>

      {data?.week && (
        <p className="text-muted-foreground TextMedium mt-2">{formatWeek(data.week)}</p>
      )}

      {error ? (
        <div className="py-12 text-center">
          <p className="text-foreground Header4 mb-1">No pudimos cargar los populares</p>
          <p className="text-muted-foreground TextRegluar">{error}</p>
        </div>
      ) : !data ? (
        <p className="text-muted-foreground TextRegluar mt-8">Cargando populares…</p>
      ) : songs.length === 0 ? (
        <EmptyState minimumFavorites={minimumFavorites} />
      ) : (
        <ul className="mt-8 flex flex-wrap gap-x-4 gap-y-6">
          {songs.map((song, index) => (
            <li key={song.id}>
              <MediaCard
                title={song.title}
                artist={song.artist}
                label={`#${index + 1} · ${song.favoriteCount} ${
                  song.favoriteCount === 1 ? 'favorito' : 'favoritos'
                }`}
                coverUrl={song.coverUrl}
                onPlay={() => playSongs(songs, index)}
                onAddToQueue={() => addToQueue(song)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function EmptyState({ minimumFavorites }) {
  return (
    <div className="py-16 text-center">
      <img
        src={fullHeartIcon}
        alt=""
        aria-hidden="true"
        className="mx-auto h-10 w-10 opacity-50"
      />
      <p className="text-foreground Header4 mt-4">Todavía no hay populares esta semana</p>
      <p className="text-muted-foreground TextRegluar mt-1">
        Una canción entra cuando al menos {minimumFavorites} personas distintas la marcan
        como favorita dentro de la misma semana.
      </p>
    </div>
  )
}

// La ventana viene como instantes UTC. Se formatea en UTC para que el lunes a la
// madrugada no se muestre como domingo en una zona horaria negativa.
function formatWeek({ from, to }) {
  const start = new Date(from)
  const end = new Date(new Date(to).getTime() - 24 * 60 * 60 * 1000)
  const format = new Intl.DateTimeFormat('es', {
    day: 'numeric',
    month: 'long',
    timeZone: 'UTC',
  })

  return `Semana del ${format.format(start)} al ${format.format(end)}`
}