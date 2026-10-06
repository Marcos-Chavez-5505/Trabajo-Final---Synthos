import { useRef, useState } from 'react'
import { formatDuration } from '../../lib/formatTime.js'

const SEEK_STEP_SECONDS = 5

function ratioFromEvent(event, element) {
  const rect = element.getBoundingClientRect()

  if (rect.width === 0) return 0

  return Math.min(Math.max((event.clientX - rect.left) / rect.width, 0), 1)
}

/**
 * Barra de progreso: muestra el avance y permite saltar a cualquier punto
 * con click, arrastre o teclado. No conoce el reproductor, solo sus props.
 */
export default function ProgressBar({
  currentTime,
  duration,
  onSeek,
  size = 'md',
  className = '',
}) {
  const trackRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)

  const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0
  const progress = safeDuration > 0 ? Math.min(currentTime / safeDuration, 1) : 0
  const percent = `${progress * 100}%`

  const handlePointerDown = (event) => {
    if (safeDuration === 0) return

    event.preventDefault()
    trackRef.current?.setPointerCapture(event.pointerId)
    setIsDragging(true)
    onSeek(ratioFromEvent(event, trackRef.current) * safeDuration)
  }

  const handlePointerMove = (event) => {
    if (!isDragging || safeDuration === 0) return

    onSeek(ratioFromEvent(event, trackRef.current) * safeDuration)
  }

  const endDrag = (event) => {
    if (!isDragging) return

    trackRef.current?.releasePointerCapture(event.pointerId)
    setIsDragging(false)
  }

  const handleKeyDown = (event) => {
    if (safeDuration === 0) return

    if (event.key === 'ArrowRight') {
      event.preventDefault()
      onSeek(Math.min(currentTime + SEEK_STEP_SECONDS, safeDuration))
    }

    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      onSeek(Math.max(currentTime - SEEK_STEP_SECONDS, 0))
    }

    if (event.key === 'Home') {
      event.preventDefault()
      onSeek(0)
    }
  }

  const trackHeight = size === 'sm' ? 'h-1' : 'h-1.5'

  return (
    <div className={`flex w-full items-center gap-2 ${className}`}>
      <span className="w-10 shrink-0 text-right TextTiny opacity-70 tabular-nums">
        {formatDuration(currentTime)}
      </span>

      {/* Área clicable ampliada: el pseudo-elemento invisible (before:) extiende
          la zona de interacción del track arriba y abajo (-inset-y-3 = 12px)
          sin cambiar el layout ni el aspecto. Sus eventos llegan a los
          handlers del track. */}
      <div
        ref={trackRef}
        role="slider"
        tabIndex={safeDuration === 0 ? -1 : 0}
        aria-label="Progreso de la canción"
        aria-valuemin={0}
        aria-valuemax={Math.round(safeDuration)}
        aria-valuenow={Math.round(currentTime)}
        aria-valuetext={`${formatDuration(currentTime)} de ${formatDuration(safeDuration)}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={handleKeyDown}
        className={`group relative w-full cursor-pointer touch-none rounded-full Wall outline-none focus-visible:ring-2 focus-visible:ring-fucsia before:absolute before:inset-x-0 before:-inset-y-3 before:content-[''] ${trackHeight}`}
      >
        <div
          className="h-full rounded-full Fucsia"
          style={{ width: percent }}
        />

        <div
          className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full Lighter opacity-0 transition-opacity group-hover:opacity-100 ${
            isDragging ? 'opacity-100' : ''
          }`}
          style={{ left: percent }}
        />
      </div>

      <span className="w-10 shrink-0 TextTiny opacity-70 tabular-nums">
        {formatDuration(safeDuration)}
      </span>
    </div>
  )
}