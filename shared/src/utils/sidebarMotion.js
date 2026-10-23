// Spring que gobierna el colapso del sidebar: el ancho se mueve con este y, con
// él, el wipe de los labels (`useSidebarLabelSlides` de `ui/sidebar.tsx`).
//
// Vive en `lib/` y no adentro de `sidebar.tsx` porque lo comparte
// `components/layout/SidebarAnimatedGroup.jsx`, que cierra los grupos con datos
// del sidebar con la misma sensación táctil. De paso evita que ese archivo
// exporte una constante junto a sus componentes, que es lo que oxlint marca con
// `react(only-export-components)` (fast refresh).
//
// El `stiffness` alto con `damping` bajo le da el rebote al llegar al objetivo.
export const SIDEBAR_SPRING = { stiffness: 300, damping: 20, mass: 0.6 }
