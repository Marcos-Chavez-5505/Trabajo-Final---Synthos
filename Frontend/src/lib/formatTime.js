const SECONDS_PER_MINUTE = 60

/** Convierte segundos a "m:ss" (o "h:mm:ss" si pasa la hora). */
export function formatDuration(totalSeconds) {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '0:00'

  const seconds = Math.floor(totalSeconds)
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / SECONDS_PER_MINUTE)
  const rest = seconds % SECONDS_PER_MINUTE

  const paddedRest = String(rest).padStart(2, '0')

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${paddedRest}`
  }

  return `${minutes}:${paddedRest}`
}
