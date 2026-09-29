import { NavLink } from 'react-router-dom'

const ITEMS = [
  { label: 'Home', to: '/home' },
  { label: 'Salas', to: '/salas' },
  { label: 'Buscar', to: '/buscar' },
  { label: 'Playlists', to: '/playlists' },
]

export default function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 flex h-14 justify-around md:hidden Shadow">
      {ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-1 px-3 TextTiny ${
              isActive ? 'text-accent' : 'opacity-70'
            }`
          }
        >
          {/* TODO(agente): reemplazar por íconos */}
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}