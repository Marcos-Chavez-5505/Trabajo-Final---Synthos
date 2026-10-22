import usePlayer from '../../hooks/usePlayer.js'
import QueueActionButton from './QueueActionButton.jsx'

/**
 * Botón de "añadir a la cola" para una canción concreta.
 *
 * La canción entra después de la que está sonando y después de las que ya se
 * encolaron (FIFO), siempre antes de la próxima canción original de la lista.
 * El feedback visual lo resuelve `QueueActionButton`; acá solo se conecta el
 * `PlayerContext` y se deshabilita en modo sala, donde la cola la manda el
 * servidor.
 *
 * El ícono sale de `assets/` (regla 10) y el tamaño se ajusta con `iconClassName`
 * para que sirva tanto en una fila de playlist como en una tarjeta.
 */
export default function AddToQueueButton({
  song,
  className = 'Volume hover:opacity-80',
  iconClassName = 'h-5 w-5',
}) {
  const { addToQueue, roomMode } = usePlayer()
  const disabled = roomMode || !song?.id

  return (
    <QueueActionButton
      onAdd={() => addToQueue(song)}
      title={roomMode ? 'No disponible en una sala' : undefined}
      className={`p-2 ${className}`}
      iconClassName={iconClassName}
      disabled={disabled}
    />
  )
}
