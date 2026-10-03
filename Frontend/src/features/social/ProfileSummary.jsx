import { Link } from 'react-router-dom'
import Avatar from '../../components/ui/Avatar.jsx'
import useAuth from '../../hooks/useAuth.js'
import useFollow from './useFollow.js'
/**
 * Resumen del usuario de la sesión para el pie del Sidebar (TS-10).
 *
 * Es el pedazo del criterio de aceptación que pedía convertir los contadores
 * fijos ("100"/"32") en datos reales: en la app implementada el Sidebar no
 * tenía ninguna tarjeta de usuario, así que el lugar donde esos números
 * aparecen hoy es acá abajo y en los dos perfiles.
 *
 * Reutiliza `useFollow` sobre el propio id: el botón no se muestra nunca
 * (`canFollow` es false para uno mismo) y solo quedan los contadores, que son
 * los que se piden en la primera carga.
 *
 * Vive en la feature y no en `components/layout/Sidebar.jsx` porque consulta
 * un service, igual que `MisPlaylists` de TS-09.
 */
export default function ProfileSummary() {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const { followerCount, followingCount } = useFollow(userId)

  if (!user) return null

  return (
    <div className="px-2 py-3">
      <Link to="/perfil" className="flex items-center gap-3 hover:opacity-90">
        <Avatar src={user.avatarUrl} name={user.username} className="h-10 w-10" />

        <div className="min-w-0">
          <p className="text-foreground TextMedium truncate">{user.username}</p>
          <p className="text-muted-foreground TextTiny truncate">
            {followerCount} {followerCount === 1 ? 'seguidor' : 'seguidores'} ·{' '}
            {followingCount} {followingCount === 1 ? 'seguido' : 'seguidos'}
          </p>
        </div>
      </Link>
    </div>
  )
}
