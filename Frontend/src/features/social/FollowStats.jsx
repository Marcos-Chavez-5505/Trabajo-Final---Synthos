import { Link } from 'react-router-dom'

/**
 * Contadores de seguidores y seguidos con acceso a las listas (TS-10).
 *
 * Reemplaza los números fijos ("100"/"32") que venían del diseño: ahora salen
 * de la relación real del usuario. Se usa igual en el perfil propio y en el de
 * otra persona, cambiando solo el `basePath` de los enlaces.
 *
 * @param {object} props
 * @param {string} props.basePath Prefijo de las rutas de lista (`/perfil` o
 *   `/profile/:id`).
 * @param {number} props.followerCount
 * @param {number} props.followingCount
 */
export default function FollowStats({ basePath, followerCount, followingCount }) {
  return (
    <div className="mt-4 flex gap-6">
      <Link
        to={`${basePath}/seguidores`}
        className="TextRegluar text-accent hover:underline"
      >
        <span>{followerCount}</span>
        <span className="ml-1.5 text-muted-foreground">
          {followerCount === 1 ? 'Seguidor' : 'Seguidores'}
        </span>
      </Link>

      <Link
        to={`${basePath}/siguiendo`}
        className="TextRegluar text-accent hover:underline"
      >
        <span>{followingCount}</span>
        <span className="ml-1.5 text-muted-foreground">
          {followingCount === 1 ? 'Seguido' : 'Seguidos'}
        </span>
      </Link>
    </div>
  )
}
