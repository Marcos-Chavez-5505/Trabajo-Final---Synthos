import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ListMusic } from 'lucide-react'
import useAuth from '../../hooks/useAuth.js'
import { listPlaylists } from '../../services/playlistsService.js'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '../../components/ui/sidebar.tsx'

/**
 * Playlists del usuario para la sección "Mis Playlists" del Sidebar (TS-09).
 *
 * Vive en `features/playlists/` y no dentro de `components/layout/Sidebar.jsx`
 * porque consulta un service: los componentes de layout no piden datos
 * (AGENTS.md, regla 5).
 *
 * El Sidebar sobrevive a la navegación (vive en `AppLayout`, arriba de la ruta),
 * así que para que "quitar canción" se refleje sin recargar hay que volver a
 * pedir la lista. La firma de ids+nombre es la dependencia: comparar el `length`
 * no alcanza, porque quitar una y agregar otra deja el mismo número.
 */
export default function MisPlaylists() {
  const { user } = useAuth()
  const location = useLocation()
  const userId = user?.id ?? null

  const [response, setResponse] = useState({ key: null, playlists: [] })

  // Firma de lo que se muestra: cambia solo si cambia el nombre o el contenido.
  const signature = response.playlists
    .map((playlist) => `${playlist.id}:${playlist.name}:${playlist.songIds.join('.')}`)
    .join('|')

  useEffect(() => {
    if (!userId) return undefined

    let active = true

    listPlaylists(userId)
      .then((playlists) => {
        if (active) setResponse({ key: userId, playlists })
      })
      .catch(() => {
        if (active) setResponse({ key: userId, playlists: [] })
      })

    return () => {
      active = false
    }
  }, [userId, signature])

  if (response.key !== userId || response.playlists.length === 0) return null

  return (
    <SidebarMenu>
      {response.playlists.map((playlist) => {
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
              <ListMusic />
              <span className="group-data-[collapsible=icon]:hidden truncate">
                {playlist.name}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )
      })}
    </SidebarMenu>
  )
}
