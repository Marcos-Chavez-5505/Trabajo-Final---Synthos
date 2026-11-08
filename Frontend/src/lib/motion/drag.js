// Valores de la animación de arrastre de filas (playlist y favoritos).
// Viven en `lib/` porque son geometría de la UI web, no lógica compartida con mobile.
export const DRAG_SCALE = 1.02
export const DRAG_SCALE_X = 1.02
export const NEIGHBOR_SEPARATION = 10
export const DRAG_SPRING = { type: 'spring', stiffness: 500, damping: 30 }
export const DRAG_SETTLE_SPRING = { type: 'spring', stiffness: 400, damping: 25 }
