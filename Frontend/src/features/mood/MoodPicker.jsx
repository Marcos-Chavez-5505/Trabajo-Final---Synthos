import { MOODS, MOOD_LABELS } from './moodDetection.js'

/**
 * Selector manual de estado de ánimo (TS-20).
 *
 * Es el camino que nunca falla: sin cámara (desktop sin webcam), permiso
 * denegado, detector que no se pudo descargar o simplemente porque la persona
 * no quiere usar la cámara. Manda el mismo `onPick` que la detección, así que
 * desde arriba no se distingue de dónde salió el estado.
 */
export default function MoodPicker({ onPick, disabled = false, title = 'Elegí a mano' }) {
  return (
    <div className="SurfaceLight rounded p-4">
      <p className="TextMedium opacity-70">{title}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {MOODS.map((mood) => (
          <button
            key={mood}
            type="button"
            disabled={disabled}
            onClick={() => onPick(mood)}
            className="rounded px-4 py-2 Volume Button hover:brightness-110 disabled:opacity-50"
          >
            {MOOD_LABELS[mood]}
          </button>
        ))}
      </div>
    </div>
  )
}