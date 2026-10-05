import { NavLink, useLocation } from 'react-router-dom'
import { Disc3, Flame, Home, ListMusic, Mic2, User } from 'lucide-react'
import MisPlaylists from '../../features/playlists/MisPlaylists.jsx'
import ProfileSummary from '../../features/social/ProfileSummary.jsx'
import roomIcon from '../../assets/join_music_room.svg'
import {
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarFooter,
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
  // TS-17: "Salas" entra con ícono del set propio (`join_music_room.svg`),
  // importado como URL y renderizado con `<img>` según la regla 10 de AGENTS.md.
  // El resto de los ítems sigue con lucide-react, que es la deuda que ya está
  // anotada en PENDIENTES.md §2.
  { label: 'Salas', to: '/salas', src: roomIcon },
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

  // `item.icon` es un componente de lucide-react (deuda pendiente en
  // PENDIENTES.md §2); `item.src` es un SVG del set propio, que va como URL. Los
  // dos se dibujan acá para que la lista pueda ir migrando de a uno.
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
        {item.src ? (
          // Los SVG del set traen `#F4F0F9` hardcodeado (= token `Lighter`), así que
          // no heredan el color del texto y quedan igual de claros sobre el fondo
          // `Fucsia` del ítem activo, con el `text-sidebar-primary-foreground`
          // oscuro de los íconos de lucide al lado (regla 10 de AGENTS.md).
          // `invert` los pasa a oscuros para que acompañen al texto. Es el mismo
          // truco que usan las carátulas sin `coverUrl` (`MediaCard`, `PlaylistTile`).
          // El hover no lo necesita: ahí el texto también queda en `Lighter`.
          <img
            src={item.src}
            alt=""
            aria-hidden="true"
            className={`h-5 w-5${isActive ? ' invert' : ''}`}
          />
        ) : (
          <Icon />
        )}
        <span className="group-data-[collapsible=icon]:hidden">{item.label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

// "Mis Salas" sigue vacío hasta el sprint de Salas. "Mis Playlists" (TS-09) y el
// resumen del usuario (TS-10) se delegan en la feature para no meter lógica de
// fetching dentro de un componente de layout.
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
          <MisPlaylists />
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <ProfileSummary />
      </SidebarFooter>

      <SidebarRail />
    </SidebarRoot>
  )
}