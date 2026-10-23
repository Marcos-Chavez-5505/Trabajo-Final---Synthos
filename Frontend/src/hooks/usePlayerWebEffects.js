import { useEffect } from 'react'
import { usePlayer } from '@synthos/shared'

/**
 * Efectos del reproductor que solo tienen sentido en la web (atajo de teclado
 * y atributo del body). Viven acá para que `PlayerContext` compartido no toque
 * `window` ni `document`.
 */
export default function usePlayerWebEffects() {
  const { togglePlay, isIdle, isExpanded } = usePlayer()

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code !== 'Space' || event.repeat || event.isComposing) return
      if (event.ctrlKey || event.metaKey || event.altKey) return
      if (isIdle) return

      const target = event.target

      if (
        typeof target?.closest === 'function' &&
        target.closest(
          'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]'
        )
      ) {
        return
      }

      event.preventDefault()
      event.stopPropagation()
      togglePlay()
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [togglePlay, isIdle])

  useEffect(() => {
    if (isExpanded) {
      document.body.setAttribute('data-player-expanded', 'true')
    } else {
      document.body.removeAttribute('data-player-expanded')
    }
    return () => {
      document.body.removeAttribute('data-player-expanded')
    }
  }, [isExpanded])
}