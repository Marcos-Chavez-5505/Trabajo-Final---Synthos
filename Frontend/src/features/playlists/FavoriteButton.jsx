import { useState } from 'react'
import emptyHeartIcon from '../../assets/empty_heart.svg'
import fullHeartIcon from '../../assets/full_heart.svg'
import useFavorites from '../../hooks/useFavorites.js'
import usePlayer from '../../hooks/usePlayer.js'

/**
 * Corazón de favorito de la canción que está sonando.
 *
 * Va en el reproductor y no en cada card porque el favorito pertenece a la
 * biblioteca: se marca una vez desde lo que estás escuchando y después se ve
 * marcado en todos lados. Marcarlo en cada card obligaría a repetir el botón en
 * `MediaCard`, `MiniMediaCard` y las filas de búsqueda.
 *
 * Presenta `empty_heart` / `full_heart` según el estado. Los SVG traen `#F4F0F9`
 * hardcodeado y no se recolorean (AGENTS.md, regla 10), así que el estado
 * activo se marca con el fondo `Fucsia` del botón, no con el color del ícono.
 */
export default function FavoriteButton({ songId, className = '' }) {
  const { isFavorite, toggleFavorite } = useFavorites()
  const { removeFromFavoritesQueue } = usePlayer()
  const [pending, setPending] = useState(false)

  if (!songId) return null

  const active = isFavorite(songId)

  async function handleClick() {
    // Se bloquea el botón mientras escribe: `toggleFavorite` es un toggle, no un
    // set, así que dos clics seguidos se anularían.
    if (pending) return

    setPending(true)

    try {
      const nowFavorite = await toggleFavorite(songId)

      // Desmarcar quita la canción de "Mis Favoritos". Si lo que está sonando es
      // justamente esa playlist, hay que sacarla de la cola también o seguiría
      // reproduciéndose. `removeFromFavoritesQueue` es no-op en cualquier otra
      // fuente: marcar o desmarcar no invalida una canción del catálogo.
      if (!nowFavorite) {
        removeFromFavoritesQueue(songId)
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      aria-pressed={active}
      aria-label={active ? 'Quitar de favoritos' : 'Marcar como favorita'}
      title={active ? 'Quitar de favoritos' : 'Marcar como favorita'}
      className={`shrink-0 rounded-full p-2 transition-opacity disabled:opacity-50 ${
        active ? 'Fucsia' : 'Volume hover:opacity-80'
      } ${className}`}
    >
      <img
        src={active ? fullHeartIcon : emptyHeartIcon}
        alt=""
        aria-hidden="true"
        className="h-5 w-5"
      />
    </button>
  )
}
