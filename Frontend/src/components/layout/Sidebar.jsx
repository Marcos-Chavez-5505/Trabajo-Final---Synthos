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

// Los grupos con datos (Mis Salas, Mis Playlists, Playlists Colaborativas) se
// delegan enteros en la feature, no solo la lista: cada uno arma su propio
// `SidebarGroup` con su label y, si no tiene nada que mostrar, lo cierra con
// `SidebarAnimatedGroup` en vez de dejar un label colgado sobre un grupo vacío.
// Con el `SidebarGroup` acá abajo y el label suelto, los grupos vacíos dejaban
// ese label y una caja de padding sin contenido, y desaparecían de golpe.
// Navegación y "Mi Colección" son estáticos, así se quedan acá.
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