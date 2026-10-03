import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Avatar from '../../components/ui/Avatar.jsx'
import UserRow from '../../components/cards/UserRow.jsx'
import useAuth from '../../hooks/useAuth.js'
import {
  getUserById,
  listFollowers,
  listFollowing,
} from '../../services/usersService.js'

const TIPOS = ['seguidores', 'siguiendo']

/**
 * Lista de seguidores o seguidos (TS-10).
 *
 * Una sola pantalla para las cuatro rutas: `/perfil/seguidores`,
 * `/perfil/siguiendo` (las propias) y `/profile/:id/seguidores`,
 * `/profile/:id/siguiendo` (de otra persona). El `id` de la URL decide a quién
 * se le piden los datos; si no viene, es el usuario de la sesión.
 *
 * La relación llega por prop y no por `:tipo` en la URL a propósito: con rutas
 * literales, `/perfil/cualquiera` no matchea nada y cae en el catch-all, en vez
 * de mostrar una lista equivocada. Igual se valida, porque el día que estas
 * rutas se armen con un parámetro el default silencioso es un bug esperando.
 *
 * Las listas son cortas y no se paginan: el criterio del plan pide verlas, y en
 * el mock son un puñado de personas. Si más adelante hacen falta páginas, el
 * contrato es el mismo de `searchUsers`.
 */
export default function FollowList({ relation: requested }) {
  const { id } = useParams()
  const { user } = useAuth()

  const isOwn = !id
  const personId = isOwn ? (user?.id ?? null) : id
  const relation = TIPOS.includes(requested) ? requested : 'seguidores'

  // La lista se pide con la key que la pidió, igual que en SearchPeople: al
  // navegar de una persona a otra nunca se ve la lista anterior.
  const requestKey = `${personId ?? 'anon'}::${relation}`
  const [response, setResponse] = useState({ key: null, people: [], error: null })

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
        if (active) setResponse({ key: requestKey, people: [], error: cause.message })
      })

    return () => {
      active = false
    }
  }, [personId, relation, requestKey])

  if (!personId) {
    return (
      <div className="px-6 py-4 md:px-10">
        <p className="text-muted-foreground TextRegluar">
          Iniciá sesión para ver tu lista.
        </p>
      </div>
    )
  }

  const isCurrent = response.key === requestKey
  const people = isCurrent ? response.people : []
  const title = relation === 'seguidores' ? 'Seguidores' : 'Seguidos'

  // La persona a la que pertenece la lista. Puede no estar (el id viene de la
  // URL), y en ese caso el encabezado degrada a un título sin avatar.
  const person = getUserById(personId)
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
          <Avatar src={person.avatarUrl} name={person.username} className="h-14 w-14" />
        )}

        <div className="min-w-0">
          <h1 className="Header3">{title}</h1>
          <p className="text-muted-foreground TextMedium truncate">
            {person ? person.username : 'Persona'}
          </p>
        </div>
      </div>

      {!isCurrent ? (
        <p className="text-muted-foreground TextRegluar mt-8">Cargando…</p>
      ) : response.error ? (
        <p className="text-muted-foreground TextRegluar mt-8">{response.error}</p>
      ) : people.length === 0 ? (
        <div className="mt-8">
          <p className="text-foreground Header4 mb-1">
            {isOwn ? 'Todavía no hay nadie' : 'Sin nadie por ahora'}
          </p>
          <p className="text-muted-foreground TextRegluar">{empty}</p>
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
