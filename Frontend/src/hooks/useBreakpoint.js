import { useEffect, useState } from 'react'

const MOBILE_BREAKPOINT = 768 // px, coincide con `md` de Tailwind

/**
 * Devuelve 'mobile' o 'desktop' según el ancho de viewport actual.
 * Usado por AppLayout para alternar Sidebar (desktop) vs BottomNav (mobile).
 */
export default function useBreakpoint() {
  const [breakpoint, setBreakpoint] = useState(
    typeof window !== 'undefined' && window.innerWidth < MOBILE_BREAKPOINT
      ? 'mobile'
      : 'desktop'
  )

  useEffect(() => {
    function handleResize() {
      setBreakpoint(window.innerWidth < MOBILE_BREAKPOINT ? 'mobile' : 'desktop')
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return breakpoint
}
