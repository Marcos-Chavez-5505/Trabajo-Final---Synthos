import { useEffect, useRef, useState } from 'react'
import queueIcon from '../../assets/queue.svg'
import checkIcon from '../../assets/check.svg'
import usePlayer from '../../hooks/usePlayer.js'

// Cuánto queda el tilde de confirmación antes de volver al ícono de cola.
const FEEDBACK_MS = 1600

/**
 * Botón de "añadir a la cola" para una canción concreta.
 *
 * La canción entra después de la que está sonando y después de las que ya se
 * encolaron (FIFO), siempre antes de la próxima canción original de la lista.
 * El botón confirma con un tilde durante `FEEDBACK_MS` y se deshabilita en modo
 * sala, donde la cola la manda el servidor.
 *
 * El ícono sale de `assets/` (regla 10) y el tamaño se ajusta con `iconClassName`
 * para que sirva tanto en una fila de playlist como en la barra del reproductor.
 */
export default function AddToQueueButton({
  song,
  className = 'Volume hover:opacity-80',
  iconClassName = 'h-5 w-5',
}) {
  const { addToQueue, roomMode } = usePlayer()
  const [added, setAdded] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => () => clearTimeout(timerRef.current), [])

  function handleClick() {
    if (!addToQueue(song)) return

    setAdded(true)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setAdded(false), FEEDBACK_MS)
  }

  const label = added ? 'Añadida a la cola' : 'Añadir a la cola'
  const disabled = roomMode || !song?.id
  const title = roomMode ? 'No disponible en una sala' : label

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-label={label}
      title={title}
      className={`shrink-0 rounded-full p-2 transition-opacity disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
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
