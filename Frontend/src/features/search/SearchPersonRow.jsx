import { useState } from 'react'
import UserRow from '../../components/cards/UserRow.jsx'
import FollowButton from '../social/FollowButton.jsx'
import useAuth from '../../hooks/useAuth.js'
import { followUser, unfollowUser } from '../../services/usersService.js'

/**
 * Resultado de la búsqueda de personas con botón seguir (TS-10b).
 *
 * A diferencia de `useFollow` (una persona por pantalla, pero dos llamadas por
 * cada una), acá la lista ya trae el estado en cada resultado desde
 * `GET /users/search`, así que la fila solo ejecuta la mutación puntual:
 * `followUser`/`unfollowUser` responden la relación post-cambio y no hace
 * falta volver a pedir la lista completa para actualizar un solo botón.
 *
 * El estado arranca del payload y la fila es dueña de su propio cambio
 * (optimista, con reversión si el service falla). Al cambiar de página el
 * padre cambia la `key` y la fila se remonta con el estado fresco.
 *
 * @param {{person: {id: string, username: string, avatarUrl?: string|null, bio?: string, isFollowing?: boolean, followsMe?: boolean}}} props
 */
export default function SearchPersonRow({ person }) {
  const { user } = useAuth()
  const viewerId = user?.id ?? null
  const canFollow = Boolean(viewerId) && String(viewerId) !== String(person.id)

  const [following, setFollowing] = useState(() => Boolean(person.isFollowing))
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)

  const toggle = async () => {
    if (!canFollow || pending) return

    setPending(true)
    setError(null)
    const previous = following
    const optimistic = !previous
    setFollowing(optimistic)

    try {
      const action = optimistic ? followUser : unfollowUser
      const next = await action(viewerId, person.id)
      setFollowing(next.isFollowing)
    } catch (cause) {
      setFollowing(previous)
      setError(cause.message)
    } finally {
      setPending(false)
    }
  }

  return (
    <UserRow
      person={person}
      action={
        canFollow ? (
          <div className="flex shrink-0 flex-col items-end gap-1">
            <FollowButton
              canFollow={canFollow}
              isFollowing={following}
              onToggle={toggle}
              pending={pending}
              className=""
            />
            {/* Sentido inverso: esa persona ya me sigue. Es dato del payload,
                no del estado local (seguirla a ella no cambia esto). */}
            {person.followsMe ? (
              <span className="TextTiny Volume rounded px-2 py-0.5">Te sigue</span>
            ) : null}
            {error ? <p className="TextTiny text-muted-foreground">{error}</p> : null}
          </div>
        ) : null
      }
    />
  )
}