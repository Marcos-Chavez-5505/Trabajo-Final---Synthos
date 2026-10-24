import { NavLink } from 'react-router-dom'
import { useUnreadNotificationsCount } from '@synthos/shared'
import notificationIcon from '../../assets/notification.svg'

const ITEMS = [
  { label: 'Home', to: '/home' },
  { label: 'Salas', to: '/salas' },
  { label: 'Buscar', to: '/buscar' },
  { label: 'Notificaciones', to: '/notificaciones', icon: notificationIcon },
  { label: 'Playlists', to: '/playlists' },
]

export default function BottomNav() {
  const unreadCount = useUnreadNotificationsCount()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex h-14 justify-around md:hidden Shadow">
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `relative flex flex-col items-center justify-center gap-1 px-3 TextTiny ${
              isActive ? 'text-accent' : 'opacity-70'
            }`
          }
        >
          {item.icon ? (
            <div className="relative">
              <img src={item.icon} alt="" aria-hidden="true" className="size-5" />
              {item.to === '/notificaciones' && unreadCount > 0 && (
                <span className="Fucsia absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-0.5 text-[9px] text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
          ) : (
            <span>{item.label}</span>
          )}
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}