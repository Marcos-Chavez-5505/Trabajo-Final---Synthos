import { useCallback, useEffect, useState } from 'react'
import useAuth from '../../hooks/useAuth.js'
import {
  followUser,
  getFollowCounts,
  isFollowing,
  unfollowUser,
} from '../../services/usersService.js'

/**
 * Estado de "seguir" entre la sesión y una persona, con los contadores de esa
 * persona (TS-10).
 *
 * Vive en la feature y no en un Context porque su alcance es una pantalla: el
 * `PlayerContext` es el único estado realmente global de la app y este no calza.
 *
 * Se usa una sola vez por pantalla y se pasa por props a `FollowButton` y
 * `FollowStats`, en vez de que cada uno llame al service por su cuenta: si el
 * botón y el contador tuvieran cada uno su estado, al seguir a alguien el
 * número de seguidores tardaría en moverse o se movería dos veces.
 *
 * Los contadores se piden siempre, incluso sin sesión o sobre el propio
 * perfil: son datos públicos. El botón solo se habilita cuando hay sesión y
 * la persona mirada es otra (`canFollow`).
 *
 * @param {string} personId Persona cuyo perfil se está mirando.
 * @returns {{canFollow: boolean, isFollowing: boolean, followerCount: number,
 *   followingCount: number, loading: boolean, pending: boolean, error: string|null,
 *   toggle: () => Promise<void>}}
 */
export default function useFollow(personId) {
  const { user } = useAuth()
  const viewerId = user?.id ?? null

  // Sin sesión no hay botón, pero los contadores igual se piden. La key
  // incluye al viewer para que cambiar de cuenta recargue la relación.
  const canFollow = Boolean(viewerId) && viewerId !== personId
  const requestKey = personId ? `${viewerId ?? 'anon'}->${personId}` : null

  const [response, setResponse] = useState({
    key: null,
    isFollowing: false,
    followerCount: 0,
    followingCount: 0,
    pending: false,
    error: null,
  })

  useEffect(() => {
    if (!requestKey) return undefined

    let active = true

    // El conteo y la relación son dos llamadas distintas en el service; se
    // resuelven juntas para que la pantalla aparezca con los dos números ya.
    const relation = canFollow
      ? isFollowing(viewerId, personId).then((value) => ({ isFollowing: value }))
      : Promise.resolve({ isFollowing: false })

    Promise.all([relation, getFollowCounts(personId)])
      .then(([{ isFollowing: following }, counts]) => {
        if (!active) return

        setResponse({
          key: requestKey,
          isFollowing: following,
          followerCount: counts.followers,
          followingCount: counts.following,
          pending: false,
          error: null,
        })
      })
      .catch((cause) => {
        if (!active) return

        setResponse({
          key: requestKey,
          isFollowing: false,
          followerCount: 0,
          followingCount: 0,
          pending: false,
          error: cause.message,
        })
      })

    return () => {
      active = false
    }
  }, [requestKey, canFollow, viewerId, personId])

  const isCurrent = response.key === requestKey
  const loading = requestKey !== null && !isCurrent

  const toggle = useCallback(async () => {
    if (!canFollow || response.pending) return

    // Optimista: el botón cambia al instante y se revierte solo si el service
    // falla. Un click esperando un round trip se siente como una app rota.
    const previous = response
    const optimistic = !previous.isFollowing

    setResponse({
      ...previous,
      isFollowing: optimistic,
      followerCount: previous.followerCount + (optimistic ? 1 : -1),
      pending: true,
      error: null,
    })

    try {
      const action = optimistic ? followUser : unfollowUser
      const next = await action(viewerId, personId)

      setResponse({
        key: requestKey,
        isFollowing: next.isFollowing,
        followerCount: next.followerCount,
        followingCount: next.followingCount,
        pending: false,
        error: null,
      })
    } catch (cause) {
      setResponse({
        ...previous,
        pending: false,
        error: cause.message,
      })
    }
  }, [canFollow, response, requestKey, viewerId, personId])

  return {
    canFollow,
    isFollowing: loading ? false : response.isFollowing,
    followerCount: loading ? 0 : response.followerCount,
    followingCount: loading ? 0 : response.followingCount,
    loading,
    pending: response.pending,
    error: response.error,
    toggle,
  }
}
