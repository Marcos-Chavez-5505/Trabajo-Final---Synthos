import MediaCard from '../../components/cards/MediaCard.jsx'
import { usePlayer } from '@synthos/shared'
import { MOOD_LABELS } from './moodDetection.js'

/**
 * Lista de canciones para el estado de ánimo detectado (TS-20).
 *
 * Reusa `MediaCard` (regla 2 de AGENTS.md) y el reproductor global: la cola se
 * arma con la lista completa para que el usuario pueda seguir con siguiente o
 * anterior sin volver a la pantalla.
 */
export default function MoodResults({ mood, songs, onRescan }) {
  const { playSongs, addToQueue } = usePlayer()

  if (songs === null) return null

  return (
    <section className="mt-8">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="Header4">
          {mood ? `Para cuando estás ${MOOD_LABELS[mood].toLowerCase()}` : 'Sin canciones'}
        </h2>

        <button
          type="button"
          onClick={onRescan}
          className="rounded px-3 py-2 Volume Button hover:brightness-110"
        >
          {mood ? 'Volver a escanear' : 'Escanear de nuevo'}
        </button>
      </div>

      {songs.length === 0 ? (
        <p className="mt-3 TextRegluar opacity-70">
          No hay canciones con ese estado de ánimo en el catálogo todavía.
        </p>
      ) : (
        <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
          {songs.map((song) => (
            <MediaCard
              key={song.id}
              title={song.title}
              artist={song.artist}
              label={song.genre ?? ''}
              coverUrl={song.coverUrl}
              onPlay={() => playSongs(songs, songs.indexOf(song), { type: 'mood', mood })}
              onAddToQueue={() => addToQueue(song)}
            />
          ))}
        </div>
      )}
    </section>
  )
}