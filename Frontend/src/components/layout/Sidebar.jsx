import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import MisPlaylists from '../../features/playlists/MisPlaylists.jsx'
import CollabPlaylists from '../../features/playlists/CollabPlaylists.jsx'
import MyRooms from '../../features/rooms/MyRooms.jsx'
import ProfileSummary from '../../features/social/ProfileSummary.jsx'
import albumIcon from '@synthos/shared/assets/icons/album.svg'
import flameIcon from '@synthos/shared/assets/icons/flame.svg'
import houseIcon from '@synthos/shared/assets/icons/house.svg'
import listMusicIcon from '@synthos/shared/assets/icons/list_music.svg'
import microphoneIcon from '@synthos/shared/assets/icons/microphone.svg'
import userIcon from '@synthos/shared/assets/icons/user.svg'
import roomIcon from '@synthos/shared/assets/icons/headphones.svg'
import logoSynthos from '@synthos/shared/assets/brand/logo_synthos.svg'
import {
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebarLabelMotion,
} from '../ui/sidebar.tsx'

const NAV_ITEMS = [
  { label: 'Home', to: '/home', src: houseIcon },
  { label: 'Populares', to: '/populares', src: flameIcon },
  { label: 'Salas', to: '/salas', src: roomIcon },
  { label: 'Perfil', to: '/perfil', src: userIcon },
]

const COLECCION_ITEMS = [
  { label: 'Playlists', to: '/playlists', src: listMusicIcon },
  { label: 'Albums', to: '/albums', src: albumIcon },
  { label: 'Artistas', to: '/artistas', src: microphoneIcon },
]

function isActivePath(pathname, to) {
  if (to === '/') return pathname === '/'
  return pathname === to || pathname.startsWith(`${to}/`)
}

function MenuItem({ item, isActive }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={<NavLink to={item.to} />}
        isActive={isActive}
        tooltip={item.label}
        className={
          isActive
            ? 'data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground overflow-x-hidden'
            : ''
        }
      >
        <div className="relative flex size-4 shrink-0 items-center justify-center">
          <img
            src={item.src}
            alt=""
            aria-hidden="true"
            className={`size-4 shrink-0 block mx-auto${isActive ? ' invert' : ''}`}
          />
        </div>
        <SidebarLabel className="flex items-center gap-2">
          {item.label}
        </SidebarLabel>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

function SidebarWordmark() {
  const slides = useSidebarLabelMotion()
  const { opacity, clipPath } = slides ?? {}

  return (
    <motion.span
      style={{ opacity, clipPath }}
      className={cn(
        'LogoSynthos TextFucsia truncate text-lg tracking-wider',
        !slides && 'group-data-[collapsible=icon]:hidden',
      )}
    >
      Synthos
    </motion.span>
  )
}

export default function Sidebar() {
  const location = useLocation()

  return (
    <SidebarRoot collapsible="icon">
      <SidebarHeader>
        <div className="flex h-12 w-full items-center gap-2 overflow-hidden rounded-md p-2 transition-[width,height,padding] group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-0!">
          <img src={logoSynthos} alt="" aria-hidden="true" className="size-8 shrink-0" />
          <SidebarWordmark />
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

        <MyRooms />

        <MisPlaylists />

        <CollabPlaylists />
      </SidebarContent>

      <SidebarFooter>
        <ProfileSummary />
      </SidebarFooter>

      <SidebarRail />
    </SidebarRoot>
  )
}