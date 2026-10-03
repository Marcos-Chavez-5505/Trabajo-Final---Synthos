import { Link, useParams } from 'react-router-dom'
import Avatar from '../../components/ui/Avatar.jsx'
import useAuth from '../../hooks/useAuth.js'
import { getUserById } from '../../services/usersService.js'

/**
 * Perfil público de otra persona (TS-08). Es la vista básica del criterio de
 * aceptación: avatar, username y bio, más el enlace para volver.
 *
 * No confundir con `ProfileView.jsx`, que es el perfil propio y editable
 * (`/perfil`). Esta pantalla es de lectura y no depende de que haya sesión, así
 * que vive fuera de `Protected`.
 */
export default function ProfilePublic() {
  const { id } = useParams()
  const { user: currentUser } = useAuth()
  const person = getUserById(id)

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
