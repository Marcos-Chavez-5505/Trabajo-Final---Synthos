import { useState } from 'react'
import { NavLink, useNavigate, useSearchParams } from 'react-router-dom'
import { useUnreadNotificationsCount } from '@synthos/shared'
import { SidebarTrigger } from '../ui/sidebar.tsx'
import searchIcon from '../../assets/search.svg'
import cameraAiIcon from '../../assets/camera_ai.svg'
import notificationIcon from '../../assets/notification.svg'

/**
 * Input de búsqueda global. Escribe en la URL de /buscar (?q=) para que la
 * búsqueda sea compartible y el back del browser funcione.
 *
 * TS-08 ya sumó personas a esa pantalla vía las pestañas de `SearchTabs`; falta
 * sumar salas, que no tiene endpoint todavía.
 */
export default function TopBar() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const unreadCount = useUnreadNotificationsCount()

  // El input es controlled desde la URL: si ?q= cambia (por ejemplo al navegar
  // atrás) el input se entera sin duplicar estado.
  const query = searchParams.get('q') ?? ''
  const [text, setText] = useState(query)
  const [lastQuery, setLastQuery] = useState(query)

  // Sincronizar estado con la URL se hace durante el render y no en un efecto:
  // así no hay un render extra en cascada.
  if (query !== lastQuery) {
    setLastQuery(query)
    setText(query)
  }

  const submit = (event) => {
    event.preventDefault()

    const query = text.trim()

    // Sin `tipo` explícito la pantalla abre en canciones, que es lo que espera
    // quien escribe en el input global. `/buscar?tipo=personas` sigue funcionando
    // si se llega por un link directo.
    navigate(query ? `/buscar?q=${encodeURIComponent(query)}` : '/buscar')
  }

  return (
    <header className="flex items-center gap-4 px-3 py-4">
      {/* Dispara toggleSidebar (mismo estado que Ctrl+B). Va en el header del
          área de contenido, fuera del sidebar, como en el layout de shadcn. */}
      <SidebarTrigger className="-ml-1" />
      {/* TODO(agente): navegación atrás/adelante (historial de router) */}
      {/* `hidden` los apaga: nunca se conectaron a useNavigate, así que no
          hacen nada. Al implementarles onClick, sacar el `hidden`. */}
      <div className="hidden gap-2">
        <button type="button" className="rounded-full Volume px-2 py-1 Button">←</button>
        <button type="button" className="rounded-full Volume px-2 py-1 Button">→</button>
      </div>

      <div className="flex items-center gap-2">
        <form onSubmit={submit} role="search" className="w-72">
          <div className="Volume flex items-center gap-2 rounded-full px-4 py-2">
            <img src={searchIcon} alt="" aria-hidden="true" className="h-4 w-4 shrink-0" />
            <input
              type="search"
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Buscar canciones o personas"
              aria-label="Buscar canciones o personas"
              className="text-foreground TextRegluar placeholder-muted-foreground/60 w-full bg-transparent outline-none"
            />
          </div>
        </form>

        {/* Acceso directo a la detección de ánimo (misma pantalla que el ítem
            "Ánimo" del sidebar). Comparte el fondo de la barra de búsqueda
            (`Volume`) y usa el SVG del set propio como URL (regla 10). */}
        <NavLink
          to="/animo"
          aria-label="Recomendaciones por estado de ánimo"
          title="Recomendaciones por estado de ánimo"
          className="Volume flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <img src={cameraAiIcon} alt="" aria-hidden="true" className="h-5 w-5" />
        </NavLink>
      </div>

      {/* Notificaciones: antes vivía en el sidebar; ahora es la acción del
          extremo derecho del header. Mismo tratamiento visual que el botón de
          ánimo y badge con el mismo criterio que BottomNav. */}
      <NavLink
        to="/notificaciones"
        aria-label={unreadCount > 0 ? `Notificaciones, ${unreadCount} sin leer` : 'Notificaciones'}
        title="Notificaciones"
        className="Volume relative ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      >
        <img src={notificationIcon} alt="" aria-hidden="true" className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="Fucsia absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-0.5 text-[9px] text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </NavLink>
    </header>
  )
}