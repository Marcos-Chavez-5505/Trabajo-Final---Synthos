import shuffleIcon from '../../assets/shuffle.svg'
import repeatIcon from '../../assets/repeat.svg'
import repeatOneIcon from '../../assets/repeat_only_one.svg'
import usePlayer from '../../hooks/usePlayer.js'
import useFavorites from '../../hooks/useFavorites.js'
import FavoriteButton from '../../features/playlists/FavoriteButton.jsx'
import AddToPlaylistPanel from '../../features/playlists/AddToPlaylistPanel.jsx'

const REPEAT_LABELS = {
  off: 'Repetir desactivado',
  track: 'Repetir canción',
  list: 'Repetir lista',
}

/**
 * Acciones del reproductor expandido, dentro de una píldora contenedora.
 *
 * Los cuatro segmentos son iguales (flex-1, h-12, píldora) y reutilizan los
 * colores del design system: fondo `Fucsia` activo y `Volume` inactivo, igual
 * que `FavoriteButton` y `AddToPlaylistPanel`. Shuffle y repetir toman el color
 * del PlayerContext; favorito re-usa `isFavorite` para pintar la píldora y le
 * pasa a `FavoriteButton` un fondo transparente (utilidad Tailwind pisa la
 * clase del design system, AGENTS.md regla 11) para no duplicar su lógica.
 */
const SEG_BASE =
  'flex h-12 flex-1 items-center justify-center rounded-full transition-colors duration-[250ms] disabled:cursor-not-allowed disabled:opacity-40'

export default function ActionControls({ songId }) {
  const { shuffle, repeat, toggleShuffle, cycleRepeat, hasQueue } = usePlayer()
  const { isFavorite } = useFavorites()

  const repeatSrc = repeat === 'track' ? repeatOneIcon : repeatIcon
  const favorite = isFavorite(songId)

  return (
    <div className="flex w-[320px] max-w-full gap-1.5 rounded-full bg-surface/70 p-1.5">
      <button
        type="button"
        className={`${SEG_BASE} ${shuffle ? 'Fucsia' : 'Volume hover:opacity-80'}`}
        aria-pressed={shuffle}
        aria-label="Aleatorio"
        title="Aleatorio"
        onClick={toggleShuffle}
        disabled={!hasQueue}
      >
        <img
          src={shuffleIcon}
          alt=""
          aria-hidden="true"
          className={`h-5 w-5 transition-opacity duration-[250ms] ${
            shuffle ? 'opacity-100' : 'opacity-55'
          }`}
        />
      </button>

      <button
        type="button"
        className={`${SEG_BASE} ${repeat !== 'off' ? 'Fucsia' : 'Volume hover:opacity-80'}`}
        aria-pressed={repeat !== 'off'}
        aria-label={REPEAT_LABELS[repeat]}
        title={REPEAT_LABELS[repeat]}
        onClick={cycleRepeat}
        disabled={!hasQueue}
      >
        <img
          src={repeatSrc}
          alt=""
          aria-hidden="true"
          className={`h-5 w-5 transition-opacity duration-[250ms] ${
            repeat !== 'off' ? 'opacity-100' : 'opacity-55'
          }`}
        />
      </button>

      <div className={`${SEG_BASE} ${favorite ? 'Fucsia' : 'Volume'}`}>
        {/* El corazón estira el botón al 100% del slot: la píldora es el área
            clickeable y los 4 segmentos quedan del mismo tamaño. El fondo lo
            pinta el slot (Fucsia/Volume); acá va transparente (utilidad
            Tailwind pisa la clase del design system, AGENTS.md regla 11). */}
        <FavoriteButton
          songId={songId}
          className="flex h-full w-full items-center justify-center bg-transparent"
        />
      </div>

      <div className={SEG_BASE}>
        {/* Mismo patrón que el favorito: el slot define tamaño y píldora
            (`flex-1`, sin padding) y el botón interno se estira para llenarlo.
            Así los 4 segmentos miden igual: el `p-2` propio del panel ya no suma
            al `flex-basis` del segmento (con `flex-1` + border-box, el padding
            se clampa y agrandaba este botón). */}
        <AddToPlaylistPanel
          songId={songId}
          className="flex h-full w-full items-center justify-center"
        />
      </div>
    </div>
  )
}