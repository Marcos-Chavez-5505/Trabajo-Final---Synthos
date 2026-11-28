import { useCallback, useMemo, useState } from 'react'
import { BreadcrumbLabelsContext } from '@/hooks/breadcrumbLabelsContext.js'

/**
 * Guarda los labels que publican las páginas de detalle, indexados por patrón de
 * ruta (`/salas/:id`, `/profile/:id`, …). El mapa de rutas de
 * `lib/breadcrumbs.js` es el que decide qué label mostrar.
 */
export default function BreadcrumbProvider({ children }) {
  const [labels, setLabels] = useState({})

  const setLabel = useCallback((patron, label) => {
    setLabels((previos) =>
      previos[patron] === label ? previos : { ...previos, [patron]: label }
    )
  }, [])

  // Solo borra si el valor sigue siendo el que publicó esta página: evita que
  // un cleanup tardío pise el label de la página siguiente.
  const clearLabel = useCallback((patron, label) => {
    setLabels((previos) => {
      if (previos[patron] !== label) return previos

      const siguientes = { ...previos }
      delete siguientes[patron]
      return siguientes
    })
  }, [])

  const value = useMemo(
    () => ({ labels, setLabel, clearLabel }),
    [labels, setLabel, clearLabel]
  )

  return (
    <BreadcrumbLabelsContext.Provider value={value}>
      {children}
    </BreadcrumbLabelsContext.Provider>
  )
}
