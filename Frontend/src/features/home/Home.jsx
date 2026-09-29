import useBreakpoint from '../../hooks/useBreakpoint.js'
import HomeDesktop from './HomeDesktop.jsx'
import HomeMobile from './HomeMobile.jsx'

/**
 * Home segun breakpoint. AppLayout ya resuelve Sidebar vs BottomNav,
 * aca solo se alterna el contenido.
 */
export default function Home() {
  const breakpoint = useBreakpoint()

  return breakpoint === 'mobile' ? <HomeMobile /> : <HomeDesktop />
}