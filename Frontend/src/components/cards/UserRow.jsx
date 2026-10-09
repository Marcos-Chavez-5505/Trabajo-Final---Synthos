import { Link } from 'react-router-dom'
import Avatar from '../ui/Avatar.jsx'

/**
 * Fila de persona en una lista: avatar, nombre y bio, con el perfil como
 * destino (TS-10).
 *
 * Va en `components/` y no en la feature porque ya lo usan dos pantallas
 * distintas: la búsqueda de personas (TS-08) y las listas de seguidores y
 * seguidos (TS-10). Es presentacional: no pide datos ni conoce el service, la
 * persona le llega por prop.
 *
 * Opcionalmente recibe `action` (un nodo React, ej. el botón de seguir de
 * TS-10b): se renderiza a la derecha, fuera del link, para no anidar
 * interactivos dentro de otro interactivo. Sin `action` la fila es idéntica a
 * un link a todo el ancho.
 *
 * @param {object} props
 * @param {{id: string, username: string, avatarUrl?: string|null, bio?: string}} props.person
 * @param {import('react').ReactNode} [props.action]
 */
export default function UserRow({ person, action = null }) {
  return (
    <div className="SurfaceLight CardRadius Elevation1 flex items-center gap-3 p-4">
      <Link
        to={`/profile/${person.id}`}
        className="flex min-w-0 flex-1 items-center gap-4 hover:opacity-90"
      >
        <Avatar src={person.avatarUrl} name={person.username} className="h-12 w-12" />

        <div className="min-w-0">
          <p className="text-foreground TextRegluar truncate">{person.username}</p>
          <p className="text-muted-foreground TextMedium mt-0.5 truncate">
            {person.bio || 'Sin bio todavía.'}
          </p>
        </div>
      </Link>

      {action}
    </div>
  )
}
