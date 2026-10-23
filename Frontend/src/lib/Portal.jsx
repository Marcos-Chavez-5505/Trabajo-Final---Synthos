import { createPortal } from "react-dom"

/**
 * Portal mínimo. En SSR no hay `document`, así que no renderiza nada; la app
 * es client-only, pero evita romper cualquier render de prueba.
 */
export function Portal({ children, container }) {
  if (typeof document === "undefined") return null
  return createPortal(children, container ?? document.body)
}
