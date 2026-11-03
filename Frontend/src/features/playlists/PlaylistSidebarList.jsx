import { NavLink, useLocation } from 'react-router-dom'
import listMusicIcon from '@synthos/shared/assets/icons/list_music.svg'
import { SidebarLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '../../components/ui/sidebar.tsx'

/**
 * Filas de playlist para los grupos del Sidebar (TS-09/TS-12): presentacional,
 * recibe la lista ya filtrada y no pide datos.
 */
export default function PlaylistSidebarList({ playlists }) {
  const location = useLocation()

  if (playlists.length === 0) return null

  return (
    <SidebarMenu>
      {playlists.map((playlist) => {
        const to = `/playlists/${playlist.id}`
        const isActive = location.pathname === to

        return (
          <SidebarMenuItem key={playlist.id}>
            <SidebarMenuButton
              render={<NavLink to={to} />}
              isActive={isActive}
              tooltip={playlist.name}
              className={
                isActive
                  ? 'data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground'
                  : ''
              }
            >
              <img
                src={listMusicIcon}
                alt=""
                aria-hidden="true"
                className={`size-4 shrink-0${isActive ? ' invert' : ''}`}
              />
              <SidebarLabel>{playlist.name}</SidebarLabel>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}