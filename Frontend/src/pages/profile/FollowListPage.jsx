import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { toastMessages } from '@/lib/toastMessages.js'
import Avatar from '@/components/ui/Avatar.jsx'
import UserRow from '@/components/cards/UserRow.jsx'
import { useAuth, useFollowList } from '@synthos/shared'
import useBreadcrumbLabel from '@/hooks/useBreadcrumbLabel.js'

const TIPOS = ['seguidores', 'siguiendo']

export default function FollowListPage({ relation: requested }) {
  const [attempt, setAttempt] = useState(0)

  return (
    <FollowListContent
      key={attempt}
      relation={requested}
      onRetry={() => setAttempt((value) => value + 1)}
    />
  )
}

function FollowListContent({ relation: requested, onRetry }) {
  const { id } = useParams()
  const { user } = useAuth()

  const isOwn = !id
  const personId = isOwn ? (user?.id ?? null) : id
  const relation = TIPOS.includes(requested) ? requested : 'seguidores'

  const { isCurrent, people, person, error } = useFollowList(personId, relation)

  // En la lista ajena, la miga del padre `/profile/:id` la publica esta página
  // con el username que ya carga `useFollowList`.
  useBreadcrumbLabel(
    '/profile/:id',
    isOwn ? null : isCurrent ? (person?.username ?? null) : undefined
  )

  useEffect(() => {
    if (error) toastMessages.followListLoadError(error)
  }, [error])

  if (!personId) {
    return (
      <div className="px-6 py-4 md:px-10">
        <p className="text-muted-foreground TextRegluar">
          Iniciá sesión para ver tu lista.
        </p>
      </div>
    )
  }

  const title = relation === 'seguidores' ? 'Seguidores' : 'Seguidos'

  const backTo = isOwn ? '/perfil' : `/profile/${personId}`

  const empty = (() => {
    if (relation === 'seguidores') {
      return isOwn
        ? 'Tu lista de seguidores está vacía.'
        : 'Esta persona todavía no tiene seguidores.'
    }
    return isOwn ? 'No seguís a nadie todavía.' : 'Esta persona no sigue a nadie.'
  })()

  return (
    <div className="px-6 py-4 md:px-10">
      <div className="flex items-center gap-4">
        {person && (
          <Avatar
            src={person.avatarUrl}
            name={person.username}
            to={backTo}
            className="h-14 w-14"
          />
        )}

        <div className="min-w-0">
          <h1 className="Header3">{title}</h1>
          <p className="text-muted-foreground TextMedium truncate">
            {person ? (
              <Link to={backTo} className="hover:underline">
                {person.username}
              </Link>
            ) : (
              'Persona'
            )}
          </p>
        </div>
      </div>

      {!isCurrent ? (
        <p className="text-muted-foreground TextRegluar mt-8">Cargando…</p>
      ) : people.length === 0 ? (
        <div className="mt-8">
          <p className="text-foreground Header4 mb-1">
            {isOwn ? 'Todavía no hay nadie' : 'Sin nadie por ahora'}
          </p>
          <p className="text-muted-foreground TextRegluar">{empty}</p>
          {error && (
            <button
              type="button"
              onClick={onRetry}
              className="TextRegluar Volume mt-4 rounded px-4 py-2"
            >
              Reintentar
            </button>
          )}
        </div>
      ) : (
        <ul className="mt-8 flex max-w-2xl flex-col gap-3">
          {people.map((entry) => (
            <li key={entry.id}>
              <UserRow person={entry} />
            </li>
          ))}
        </ul>
      )}

      <Link to={backTo} className="TextRegluar Volume mt-8 inline-block rounded px-4 py-2">
        Volver al perfil
      </Link>
    </div>
  )
}