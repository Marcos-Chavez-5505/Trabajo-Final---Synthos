// Tokens de movimiento compartidos por los componentes adaptados de beUI.
// La curva CSS equivalente es `cubic-bezier(0.16, 1, 0.3, 1)`; los springs son
// la física canónica del proyecto para intercambios de contenido.

export const EASE_OUT = [0.16, 1, 0.3, 1] as const;

/** Intercambio de slots (label/icono) dentro de un control. */
export const SPRING_SWAP = {
  type: "spring",
  stiffness: 460,
  damping: 30,
  mass: 0.55,
} as const;

/** Deslizamiento de layout compartido: pills, indicadores y paneles. */
export const SPRING_LAYOUT = {
  type: "spring",
  stiffness: 360,
  damping: 22,
  mass: 0.6,
} as const;
