const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  day: 'numeric',
  month: 'short',
})

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
