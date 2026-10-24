import { useEffect, useState } from 'react'
import { getUserById, listFollowers, listFollowing } from '../../services/usersService.js'
import { mapApiError } from '../../utils/mapError.js'

const TIPOS = ['seguidores', 'siguiendo']

/**
 * Estado de la lista de seguidores/seguidos.
 *
 * `personId` y `relation` vienen del componente (router + sesión).
 */
export default function useFollowList(personId, relation) {
  const requestKey = `${personId ?? 'anon'}::${relation}`
  const [response, setResponse] = useState({ key: null, people: [], error: null })
  const [personResult, setPersonResult] = useState({ id: null, person: null })

  useEffect(() => {
    if (!personId) return undefined

    let active = true

    const request =
      relation === 'seguidores' ? listFollowers(personId) : listFollowing(personId)

    request
      .then((people) => {
        if (active) setResponse({ key: requestKey, people, error: null })
      })
      .catch((cause) => {
        if (active) setResponse({ key: requestKey, people: [], error: mapApiError(cause) })
      })

    return () => {
      active = false
    }
  }, [personId, relation, requestKey])

  useEffect(() => {
    if (!personId) return undefined

    const controller = new AbortController()
    let active = true

    getUserById(personId, { signal: controller.signal })
      .then((found) => {
        if (active) setPersonResult({ id: personId, person: found })
      })
      .catch((error) => {
        if (!active || error.name === 'AbortError') return
        setPersonResult({ id: personId, person: null })
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [personId])

  const isCurrent = response.key === requestKey
  const people = isCurrent ? response.people : []
  const person = personResult.id === personId ? personResult.person : null

  return { isCurrent, people, person, error: response.error }
}