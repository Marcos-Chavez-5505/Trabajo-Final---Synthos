import HomeDesktop from '@/features/home/components/HomeDesktop.jsx'

/**
 * Home sólo compone el contenido. El shell (sidebar, topbar y player) lo
 * resuelve AppLayout.
 */
export default function HomePage() {
  return <HomeDesktop />
}