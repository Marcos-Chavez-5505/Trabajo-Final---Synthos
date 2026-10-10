import { NavLink, useLocation } from 'react-router-dom'
import { motion } from 'motion/react'
import { Disc3, Flame, Home, ListMusic, Mic2, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import MisPlaylists from '../../features/playlists/MisPlaylists.jsx'
import ProfileSummary from '../../features/social/ProfileSummary.jsx'
import roomIcon from '../../assets/join_music_room.svg'
import logoSynthos from '../../assets/logo_synthos.svg'
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
  { label: 'Home', to: '/home', icon: Home },
  { label: 'Populares', to: '/populares', icon: Flame },
  // TS-17: "Salas" entra con ícono del set propio (`join_music_room.svg`),
  // importado como URL y renderizado con `<img>` según la regla 10 de AGENTS.md.
  // El resto de los ítems sigue con lucide-react, que es la deuda que ya está
  // anotada en docs/PENDIENTES.md §2.
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
  // docs/PENDIENTES.md §2); `item.src` es un SVG del set propio, que va como URL. Los
  // dos se dibujan acá para que la lista pueda ir migrando de a uno.
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
        {item.src ? (
          <img
            src={item.src}
            alt=""
            aria-hidden="true"
            className={`size-4 shrink-0${isActive ? ' invert' : ''}`}
          />
        ) : (
          <Icon />
        )}
        <SidebarLabel>{item.label}</SidebarLabel>
      </SidebarMenuButton>
    </SidebarMenuItem>
  )
}

// El wordmark consume `useSidebarLabelMotion()` desde ADENTRO de `SidebarRoot`.
// Si el hook se llamara en el componente `Sidebar()` (acá arriba, fuera del
// provider que monta el `Sidebar` de `sidebar.tsx`), el context daría `null` y el
// texto caería al fallback `group-data-[collapsible=icon]:hidden`: desaparecería
// de golpe en vez de deslizarse sobre el logo.
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

// "Mis Salas" sigue vacío hasta el sprint de Salas. "Mis Playlists" (TS-09) y el
// resumen del usuario (TS-10) se delegan en la feature para no meter lógica de
// fetching dentro de un componente de layout.
export default function Sidebar() {
  const location = useLocation()

  return (
    <SidebarRoot collapsible="icon">
      <SidebarHeader>
        {/* Un solo nodo, por la misma razón que el avatar de `ProfileSummary`:
            bifurcar en JSX según `state` remontaría el logo y la transición no
            tendría de dónde interpolar. Con un nodo, el alto baja de 48px a 32px
            con `transition-[width,height,padding]`, y como el header está anclado
            arriba de la columna el logo se desliza 8px hacia arriba, mientras que
            en el footer el avatar baja. Las clases son las mismas que lleva
            `SidebarMenuButton` con `size="lg"`, para que ambos extremos se
            comporten igual.

            El logo queda de 32px porque es el ancho usable que deja el `p-2` de
            `SidebarHeader` sobre los `3rem` del sidebar contraído, igual que el
            avatar. Un logo más chico quedaría pegado al borde en vez de centrado.
            El wordmark se borra con el mismo spring de ancho que el resto de los
            labels (ver `useSidebarLabelMotion` en `sidebar.tsx`): un wipe con
            `clip-path` que lo desvanece de izquierda a derecha SIN moverlo (el
            texto no viaja, se recorta en su lugar) en vez de saltar con `hidden`.
            Al estar dentro de este header `overflow-hidden`, además queda
            recortado si el wipe y el encogido del bloque se desfasan. En mobile
            no hay `data-collapsible`, así que logo y nombre se ven siempre.

            El `fill` del SVG ya es `#EF2F62`, que es `--ds-fucsia`, y viene
            hardcodeado como el resto del set: no se recolorea desde CSS. */}
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