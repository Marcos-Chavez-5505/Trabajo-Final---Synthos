import { createContext } from 'react'

// Contexto separado del PlayerContext para que el tick de `currentTime` no
// re-renderice a todos los consumidores de `usePlayer()`.
export const PlayerTimeContext = createContext(null)
