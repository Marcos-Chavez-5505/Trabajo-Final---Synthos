import { useEffect, useState } from 'react'

/**
 * Retrasa la propagación de `value` hasta que deje de cambiar `delay` ms.
 * Se usa en los inputs de búsqueda (TS-07/TS-08) para no pedir resultados en
 * cada tecla.
 */
export default function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)

    return () => clearTimeout(id)
  }, [value, delay])

  return debounced
}