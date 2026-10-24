import { useEffect, useState } from 'react'
import { getUserById } from '../../services/usersService.js'
import { mapApiError } from '../../utils/mapError.js'

/**
 * Estado del perfil público de otra persona.
 */
export default function useProfilePublic(id) {
  const [result, setResult] = useState({ id: null, person: null, error: false })

  useEffect(() => {
    if (!id) return undefined

    const controller = new AbortController()
    let active = true

    getUserById(id, { signal: controller.signal })
      .then((found) => {
        if (active) setResult({ id, person: found, error: false })
      })
      .catch((error) => {
        if (!active || error.name === 'AbortError') return
        setResult({ id, person: null, error: true })
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [id])

  const isCurrent = result.id === id
  const person = isCurrent ? result.person : null
  const hasError = isCurrent ? result.error : false

  return { isCurrent, person, hasError }
}