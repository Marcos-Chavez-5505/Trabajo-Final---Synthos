const SECONDS_PER_MINUTE = 60

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  day: 'numeric',
  month: 'short',
})

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

/**
 * Fecha relativa corta para la bandeja: minutos, horas y días; después pasa a
 * una fecha sin año (la bandeja se lee de lo más nuevo a lo más viejo).
 *
 * @param {string} value Fecha ISO que manda el backend.
 */
export function formatRelativeTime(value) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return ''

  const minutes = Math.floor((Date.now() - date.getTime()) / 60_000)

  if (minutes < 1) return 'Ahora'
  if (minutes < 60) return `Hace ${minutes} min`

  const hours = Math.floor(minutes / 60)

  if (hours < 24) return `Hace ${hours} h`

  const days = Math.floor(hours / 24)

  if (days < 7) return `Hace ${days} d`

  return dateFormatter.format(date)
}
