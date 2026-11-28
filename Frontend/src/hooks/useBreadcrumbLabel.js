import { useContext, useEffect } from 'react'
import { BreadcrumbLabelsContext } from './breadcrumbLabelsContext.js'

/**
 * Publica el label de una miga dinámica mientras la página está montada.
 *
 * - Pasar `undefined` mientras el dato carga (la miga muestra un skeleton).
 * - Pasar `null` si falló o no existe (la miga usa el `fallback` de la ruta).
 *
 * No hace fetch: la página publica el dato que ya cargó.
 */
export default function useBreadcrumbLabel(patron, label) {
  const context = useContext(BreadcrumbLabelsContext)
  // Solo las funciones (estables con useCallback): si dependiera del objeto del
  // contexto, cada label nuevo re-dispararía el efecto en círculo.
  const setLabel = context?.setLabel
  const clearLabel = context?.clearLabel

  useEffect(() => {
    if (!setLabel || !clearLabel) return undefined

    setLabel(patron, label)
    return () => clearLabel(patron, label)
  }, [setLabel, clearLabel, patron, label])
}
