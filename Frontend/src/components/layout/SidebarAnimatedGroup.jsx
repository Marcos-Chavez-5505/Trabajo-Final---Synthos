import { motion } from 'motion/react'
import { SIDEBAR_SPRING } from '@synthos/shared'

// El mismo cierre que hace un label del sidebar al colapsarlo a íconos (fade +
// wipe con `clip-path`, ver `useSidebarLabelSlides` en `ui/sidebar.tsx`), pero
// en vertical: el `inset` crece desde el borde inferior, así que la sección se
// cierra de abajo hacia arriba en vez de de derecha a izquierda.
//
// El `height` es el que libera el espacio; solo el `clip-path` dejaría el hueco
// de la sección en el layout.
const VARIANTS = {
  shown: { height: 'auto', opacity: 1, clipPath: 'inset(0 0 0% 0)' },
  hidden: { height: 0, opacity: 0, clipPath: 'inset(0 0 100% 0)' },
}

/**
 * `SidebarGroup` con entrada y salida animadas, para los grupos que dependen de
 * datos (Mis Salas, Mis Playlists, Playlists Colaborativas). No se desmonta
 * cuando queda vacío: se cierra con el spring del sidebar, así el label no se
 * corta de golpe y los grupos de abajo suben con la animación.
 *
 * `initial={false}` evita que la sección se despliegue al montar con la lista
 * todavía vacía: se anima recién cuando cambia `hasItems`.
 *
 * `inert` (React 19) además saca los enlaces del árbol de tabulación mientras
 * la sección está cerrada: con `height: 0` seguirían enfocables.
 */
export default function SidebarAnimatedGroup({ hasItems, children }) {
  return (
    <motion.div
      initial={false}
      animate={hasItems ? 'shown' : 'hidden'}
      variants={VARIANTS}
      transition={SIDEBAR_SPRING}
      aria-hidden={!hasItems}
      inert={!hasItems}
      data-slot="sidebar-animated-group"
      className="overflow-hidden"
    >
      {children}
    </motion.div>
  )
}
