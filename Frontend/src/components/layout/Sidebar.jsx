import { NavLink, useLocation } from 'react-router-dom'
import { Disc3, Flame, Home, ListMusic, Mic2, User } from 'lucide-react'
import {
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '../ui/sidebar.tsx'

const NAV_ITEMS = [
  { label: 'Home', to: '/home', icon: Home },
  { label: 'Populares', to: '/populares', icon: Flame },
  { label: 'Perfil', to: '/perfil', icon: User },
]

const COLECCION_ITEMS = [
  { label: 'Playlists', to: '/playlists', icon: ListMusic },
  { label: 'Albums', to: '/albums', icon: Disc3 },
  { label: 'Artistas', to: '/artistas', icon: Mic2 },
]

function isActivePath(pathname, to) {
  if (to === '/') return pathname === '/'
  return pathname === to || pathname.startsWith(`${to}/`)
}

function MenuItem({ item, isActive }) {
  const Icon = item.icon
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={<NavLink to={item.to} />}
        isActive={isActive}
        tooltip={item.label}
        className={
          isActive
            ? 'data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground'
            : ''
        }
      >
        <Icon />
        <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

// TODO(agente): "Mis Salas" y "Mis Playlists" se completan con datos reales
// en TS-09 (playlists) y en el sprint de Salas. Por ahora, secciones vacías.
export default function Sidebar() {
  const location = useLocation()

  return (
    <SidebarRoot collapsible="icon">
      <SidebarHeader>
        <div className="flex h-8 items-center rounded-md px-2">
          <span className="Header4">Synthos</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {NAV_ITEMS.map((item) => (
              <MenuItem
                key={item.to}
                item={item}
                isActive={isActivePath(location.pathname, item.to)}
              />
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Mi Colección</SidebarGroupLabel>
          <SidebarMenu>
            {COLECCION_ITEMS.map((item) => (
              <MenuItem
                key={item.to}
                item={item}
                isActive={isActivePath(location.pathname, item.to)}
              />
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Mis Salas</SidebarGroupLabel>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Mis Playlists</SidebarGroupLabel>
        </SidebarGroup>
      </SidebarContent>

      <SidebarRail />
    </SidebarRoot>
  )
}