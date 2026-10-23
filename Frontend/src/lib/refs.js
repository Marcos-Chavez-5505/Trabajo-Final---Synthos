import * as React from "react"

/**
 * Combina varios refs (objetos o callbacks) en uno solo. Se usa para que las
 * primitivas puedan guardar su propio nodo y, a la vez, respetar el `ref` que
 * reciben desde afuera.
 */
export function useComposedRefs(...refs) {
  return React.useCallback((node) => {
    for (const ref of refs) {
      if (!ref) continue
      if (typeof ref === "function") {
        ref(node)
      } else {
        ref.current = node
      }
    }
    // `refs` es un array nuevo en cada render, pero su contenido es estable
    // (refs de React o el mismo `ref` del componente).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, refs)
}
