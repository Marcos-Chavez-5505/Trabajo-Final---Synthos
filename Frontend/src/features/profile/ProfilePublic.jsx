import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Avatar from '../../components/ui/Avatar.jsx'
import useAuth from '../../hooks/useAuth.js'
import { getUserById } from '../../services/usersService.js'
import FollowButton from '../social/FollowButton.jsx'
import FollowStats from '../social/FollowStats.jsx'
import useFollow from '../social/useFollow.js'

/**
 * Perfil público de otra persona (TS-08). Es la vista básica del criterio de
 * aceptación: avatar, username y bio, más el enlace para volver.
 *
 * No confundir con `ProfileView.jsx`, que es el perfil propio y editable
 * (`/perfil`). Esta pantalla es de lectura y no depende de que haya sesión, así
 * que vive fuera de `Protected`.
 *
 * TS-10 le agrega el botón seguir/dejar de seguir y los contadores. Ambos salen
 * de un único `useFollow`, no de dos hooks pegados: seguir a alguien tiene que
 * mover el botón y el número de seguidores en la misma pantalla.
 *
 * El perfil se pide al backend de forma asincrónica. `result` guarda con qué
 * `id` se resolvió para derivar el estado en render (loading/ready/missing/error)
 * y no setear estado sincrónicamente dentro del efecto.
 */
export default function ProfilePublic() {
  const { id } = useParams()
  const { user: currentUser } = useAuth()
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

  // El hook va antes de cualquier return temprano: sin persona no hay sección
  // que mostrar, pero la lista de hooks tiene que ser estable entre renders.
  const follow = useFollow(person?.id ?? null)

  if (!id) {
    return (
      <div className="px-6 py-4 md:px-10">
        <p className="text-muted-foreground TextRegluar">No encontramos esa persona.</p>
        <Link to="/buscar?tipo=personas" className="text-accent TextRegluar mt-4 inline-block">
          Volver a buscar
        </Link>
      </div>
    )
  }

  if (!isCurrent) {
    return (
      <div className="px-6 py-4 md:px-10">
        <p className="text-muted-foreground TextRegluar">Cargando perfil…</p>
      </div>
    )
  }

  if (result.error) {
    return (
      <div className="px-6 py-4 md:px-10">
        <p className="text-muted-foreground TextRegluar">No pudimos cargar el perfil.</p>
        <Link to="/buscar?tipo=personas" className="text-accent TextRegluar mt-4 inline-block">
          Volver a buscar
        </Link>
      </div>
    )
  }

  if (!person) {
    return (
      <div className="px-6 py-4 md:px-10">
        <p className="text-muted-foreground TextRegluar">No encontramos esa persona.</p>
        <Link to="/buscar?tipo=personas" className="text-accent TextRegluar mt-4 inline-block">
          Volver a buscar
        </Link>
      </div>
    )
  }

  // El propio usuario tiene su perfil editable en /perfil: ahí lo mandamos en
  // vez de mostrar una versión de solo lectura de sí mismo.
  const isSelf = currentUser?.id === person.id

  return (
    <div className="px-6 py-4 md:px-10">
      <section className="SurfaceLight CardRadius max-w-md p-6">
        <div className="flex items-center gap-4">
          <Avatar src={person.avatarUrl} name={person.username} className="h-24 w-24" />
          <div className="min-w-0">
            <h2 className="Header3 truncate">{person.username}</h2>
            {isSelf && (
              <Link to="/perfil" className="text-accent TextMedium mt-0.5 inline-block">
                Es tu perfil — editar
              </Link>
            )}
          </div>
        </div>

        <p className="TextRegluar mt-4">{person.bio || 'Sin bio todavía.'}</p>

        <FollowStats
          basePath={`/profile/${person.id}`}
          followerCount={follow.followerCount}
          followingCount={follow.followingCount}
        />

        <FollowButton
          canFollow={follow.canFollow}
          isFollowing={follow.isFollowing}
          onToggle={follow.toggle}
          pending={follow.pending}
        />

        {follow.error && (
          <p className="text-muted-foreground TextTiny mt-2">{follow.error}</p>
        )}

        <Link
          to="/buscar?tipo=personas"
          className="TextRegluar Volume mt-6 inline-block rounded px-4 py-2"
        >
          Volver a buscar
        </Link>
      </section>
    </div>
  )
}
