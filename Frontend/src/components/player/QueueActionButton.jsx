import { useEffect, useRef, useState } from 'react'
import queueIcon from '../../assets/add_to_queue.svg'
import checkIcon from '../../assets/check.svg'

// Cuánto queda el tilde de confirmación antes de volver al ícono de cola.
const FEEDBACK_MS = 1600

/**
 * Botón de "añadir a la cola" con confirmación visual.
 *
 * Es presentacional: recibe `onAdd` (que puede devolver `false` si no se pudo
 * encolar) y no conoce el `PlayerContext`. Así lo reutilizan tanto las tarjetas
 * como `AddToQueueButton`, y el feedback es idéntico en todas las pantallas:
 * el ícono cambia a un tilde, el botón se achica al presionar y queda un anillo
 * durante `FEEDBACK_MS`. El cambio de etiqueta se anuncia por `role="status"`.
 */
export default function QueueActionButton({
  onAdd,
  label = 'Añadir a la cola',
  title,
  className = '',
  iconClassName = 'h-4 w-4',
  disabled = false,
}) {
  const [added, setAdded] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  function handleClick() {
    const result = onAdd?.()
    if (result === false) return

    setAdded(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setAdded(false), FEEDBACK_MS)
  }

  const stateLabel = added ? 'Añadida a la cola' : label

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={stateLabel}
      title={title ?? stateLabel}
      className={`flex shrink-0 cursor-pointer items-center justify-center rounded-full transition duration-150 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40 ${
        added ? 'ring-2 ring-white/40' : ''
      } ${className}`}
    >
      <img
        src={added ? checkIcon : queueIcon}
        alt=""
        aria-hidden="true"
        className={`${iconClassName} shrink-0`}
      />
      <span className="sr-only" role="status">
        {added ? 'Añadida a la cola' : ''}
      </span>
    </button>
  )
}
