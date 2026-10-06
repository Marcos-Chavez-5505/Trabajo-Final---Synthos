import { Link, useLocation } from 'react-router-dom'
import Avatar from '../../components/ui/Avatar.jsx'
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuPopup,
  DropdownMenuPositioner,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu.tsx'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '../../components/ui/sidebar.tsx'
import useAuth from '../../hooks/useAuth.js'
import useFollow from './useFollow.js'
import logoutIcon from '../../assets/logout.svg'
import playlistIcon from '../../assets/playlist.svg'
import userIcon from '../../assets/user.svg'
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
 * La fila es un `SidebarMenuItem` como el resto del menú, y abre el menú de
 * cuenta en los dos estados del sidebar. Editar el perfil NO vive acá: sigue
 * siendo un modo local de la vista de perfil.
 *
 * Es un único `SidebarMenuButton` para los dos estados a propósito. Antes se
 * bifurcaba en JSX según `state === 'collapsed'`, lo que remontaba el botón y el
 * avatar: el nodo nuevo ya nacía con la altura final de 32px y la
 * `transition-[width,height,padding]` de `SidebarMenuButton` no tenía de dónde
 * interpolar, así que el avatar saltaba de golpe al piso. Con un nodo solo, el
 * alto interpola de 48px a 32px y, como el footer está anclado abajo de la
 * columna, el avatar se desliza 8px hacia abajo. El texto se oculta con
 * `group-data-[collapsible=icon]:hidden`, igual que el resto del sidebar.
 *
 * Perder el link directo a /perfil no deja nada inaccesible: está el ítem
 * "Perfil" de la navegación y el ítem "Mi perfil" de este mismo menú.
 *
 * Vive en la feature y no en `components/layout/Sidebar.jsx` porque consulta
 * un service, igual que `MisPlaylists` de TS-09.
 */
export default function ProfileSummary() {
  const { user, logout } = useAuth()
  const userId = user?.id ?? null
  const { followerCount, followingCount } = useFollow(userId)
  const onProfile = useLocation().pathname.startsWith('/perfil')

  if (!user) return null

  const avatar = <Avatar src={user.avatarUrl} name={user.username} className="h-8 w-8" />

  const menu = (
    <DropdownMenuPortal>
      <DropdownMenuPositioner side="top" align="end">
        <DropdownMenuPopup>
          <DropdownMenuGroup>
            <DropdownMenuGroupLabel>
              <span className="truncate TextMedium">{user.username}</span>
              {user.email && (
                <span className="truncate TextTiny text-muted-foreground">
                  {user.email}
                </span>
              )}
            </DropdownMenuGroupLabel>
          </DropdownMenuGroup>

          <DropdownMenuSeparator />

          <DropdownMenuLinkItem
            render={<Link to="/perfil" />}
            label="Mi perfil"
            closeOnClick
          >
            <img src={userIcon} alt="" aria-hidden="true" />
            Mi perfil
          </DropdownMenuLinkItem>

          <DropdownMenuLinkItem
            render={<Link to="/playlists" />}
            label="Mis playlists"
            closeOnClick
          >
            <img src={playlistIcon} alt="" aria-hidden="true" />
            Mis playlists
          </DropdownMenuLinkItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            render={<button type="button" onClick={logout} />}
            nativeButton
            label="Cerrar sesión"
          >
            <img src={logoutIcon} alt="" aria-hidden="true" />
            Cerrar sesión
          </DropdownMenuItem>
        </DropdownMenuPopup>
      </DropdownMenuPositioner>
    </DropdownMenuPortal>
  )

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                isActive={onProfile}
                tooltip="Menú de la cuenta"
              />
            }
          >
            {avatar}
            <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
              <p className="truncate TextMedium">{user.username}</p>
              <p className="truncate TextTiny text-muted-foreground">
                {followerCount} {followerCount === 1 ? 'seguidor' : 'seguidores'} ·{' '}
                {followingCount} {followingCount === 1 ? 'seguido' : 'seguidos'}
              </p>
            </div>
          </DropdownMenuTrigger>

          {menu}
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}