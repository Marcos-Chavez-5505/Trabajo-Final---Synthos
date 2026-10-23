/** Origen de la animación de apertura del reproductor expandido (solo web). */
export function getExpandOrigin(element) {
  const rect = element.getBoundingClientRect()
  const view = element.ownerDocument?.defaultView || window
  const x = rect.left + rect.width / 2
  const y = rect.top + rect.height / 2
  const radius = Math.hypot(
    Math.max(x, view.innerWidth - x),
    Math.max(y, view.innerHeight - y),
  )

  return { x, y, radius }
}