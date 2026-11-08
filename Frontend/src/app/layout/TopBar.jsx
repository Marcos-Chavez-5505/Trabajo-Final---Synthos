import { NavLink, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth, useUnreadNotificationsCount } from '@synthos/shared'
import { SidebarTrigger } from '@/components/ui/sidebar.tsx'
import RecentSearchesCombobox from '@/features/search/components/RecentSearchesCombobox.jsx'
import cameraAiIcon from '@synthos/shared/assets/icons/camera_ai.svg'
import notificationIcon from '@synthos/shared/assets/icons/notification.svg'

export default function TopBar() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const unreadCount = useUnreadNotificationsCount()
  const { user } = useAuth()

  const query = searchParams.get('q') ?? ''

  const search = (term) => {
    navigate(term ? `/buscar?q=${encodeURIComponent(term)}` : '/buscar')
  }

  return (
    <header className="flex min-w-0 items-center gap-3 px-3 py-4">

      <SidebarTrigger className="-ml-1" />

      <div className="hidden gap-2">
        <button type="button" className="rounded-full Volume px-2 py-1 Button">←</button>
        <button type="button" className="rounded-full Volume px-2 py-1 Button">→</button>
      </div>

      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div role="search" className="w-full min-w-0 max-w-72">
          <RecentSearchesCombobox
            userId={user?.id}
            value={query}
            onSearch={search}
          />
        </div>

        <NavLink
          to="/animo"
          aria-label="Recomendaciones por estado de ánimo"
          title="Recomendaciones por estado de ánimo"
          className="SurfaceLight flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <img src={cameraAiIcon} alt="" aria-hidden="true" className="h-5 w-5" />
        </NavLink>
      </div>

      <NavLink
        to="/notificaciones"
        aria-label={unreadCount > 0 ? `Notificaciones, ${unreadCount} sin leer` : 'Notificaciones'}
        title="Notificaciones"
        className="SurfaceLight relative ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
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