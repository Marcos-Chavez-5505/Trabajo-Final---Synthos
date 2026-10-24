import { useContext } from 'react'
import { PlayerContext } from '../context/playerContext.js'

export default function usePlayer() {
  const context = useContext(PlayerContext)

  if (context === null) {
    throw new Error('usePlayer debe usarse dentro de <PlayerProvider>.')
  }

  return context
}
