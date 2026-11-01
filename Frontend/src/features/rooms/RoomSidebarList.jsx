import { NavLink, useLocation } from 'react-router-dom'
import {
  SidebarLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '../../components/ui/sidebar.tsx'
import roomIcon from '../../assets/headphones.svg'

/**
 * Filas de sala para el grupo "Mis Salas" del Sidebar: presentacional, recibe la
 * lista ya filtrada y no pide datos (mismo patrón que `PlaylistSidebarList`).
 *
 * A diferencia de las salas privadas, acá una sala con código sí tiene que
 * aparecer: es la que el usuarioítulos tiene abierta, y sin esta fila no
 * habría forma de volver a entrar después de salir del listado.
 */
export default function RoomSidebarList({ rooms }) {
  const location = useLocation()

  if (!rooms || rooms.length === 0) return null

  return (
    <SidebarMenu>
      {rooms.map((room) => {
        const to = `/salas/${room.id}`
        const isActive = location.pathname === to

        return (
          <SidebarMenuItem key={room.id}>
            <SidebarMenuButton
              render={<NavLink to={to} />}
              isActive={isActive}
              tooltip={room.name}
              className={
                isActive
                  ? 'data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground'
                  : ''
              }
            >
              <img
                src={roomIcon}
                alt=""
                aria-hidden="true"
                className={`h-4 w-4${isActive ? ' invert' : ''}`}
              />
              <SidebarLabel>{room.name}</SidebarLabel>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}