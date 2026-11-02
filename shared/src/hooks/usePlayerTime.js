import { useContext } from 'react'
import { PlayerTimeContext } from '../context/playerTimeContext.js'

/**
 * Posición y duración de la canción actual. Vive en un contexto aparte de
 * `usePlayer()` para que el tick periódico de `currentTime` (cada ~500ms) solo
 * re-renderice a quien muestra el tiempo (barras de progreso y fila de tiempos).
 */
export default function usePlayerTime() {
  const context = useContext(PlayerTimeContext)

  if (context === null) {
    throw new Error('usePlayerTime debe usarse dentro de <PlayerProvider>.')
  }

  return context
}
