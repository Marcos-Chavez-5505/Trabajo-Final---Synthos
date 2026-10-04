import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { ListMusic } from 'lucide-react'
import useAuth from '../../hooks/useAuth.js'
import { listPlaylists, subscribeToPlaylists } from '../../services/playlistsService.js'
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '../../components/ui/sidebar.tsx'

/**
 * Playlists del usuario para la sección "Mis Playlists" del Sidebar (TS-09).
 *
 * Vive en `features/playlists/` y no dentro de `components/layout/Sidebar.jsx`
 * porque consulta un service: los componentes de layout no piden datos
 * (AGENTS.md, regla 5).
 *
 * El Sidebar sobrevive a la navegación (vive en `AppLayout`, arriba de la ruta),
 * así que sus datos no se remontan al crear, renombrar o borrar desde una
 * pantalla. Por eso se suscribe a `subscribeToPlaylists`: cada mutación avisa y
 * acá se vuelve a pedir la lista. Un `version` en las deps dispara el fetch sin
 * que el callback de la suscripción toque el estado del fetch anterior.
 */
export default function MisPlaylists() {
  const { user } = useAuth()
  const location = useLocation()
  const userId = user?.id ?? null

  const [response, setResponse] = useState({ key: null, playlists: [] })
  const [version, setVersion] = useState(0)

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
  }, [userId, version])

  useEffect(() => subscribeToPlaylists(() => setVersion((prev) => prev + 1)), [])

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
