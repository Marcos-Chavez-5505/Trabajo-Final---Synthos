import musicNoteIcon from '../../assets/music_note.svg'
import expandIcon from '../../assets/expand.svg'
import usePlayer from '../../hooks/usePlayer.js'
import AddToPlaylistPanel from '../../features/playlists/AddToPlaylistPanel.jsx'
import FavoriteButton from '../../features/playlists/FavoriteButton.jsx'
import PlayerControls from './PlayerControls.jsx'
import ProgressBar from './ProgressBar.jsx'

function SongCover({ song }) {
  return (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md Light">
      {song?.coverUrl ? (
        <img
          src={song.coverUrl}
          alt={song.album ?? song.title}
          className="h-full w-full rounded-md object-cover"
        />
      ) : (
        <img src={musicNoteIcon} alt="" aria-hidden="true" className="h-5 w-5 invert" />
      )}
    </div>
  )
}

/**
 * Reproductor completo (solo desktop), ocupa el ancho de la ventana.
 * Es presentación pura: consume el PlayerContext global.
 *
 * En estado idle (sin canción actual) la barra se muestra igual, con placeholder
 * y sin datos, pero queda cubierta por un overlay que bloquea mouse y teclado
 * (`inert` + `aria-disabled` en el contenido) hasta que el usuario elige una
 * canción.
 */
export default function PlayerBar() {
  const { song, currentTime, duration, seek, isIdle } = usePlayer()

  return (
    <footer className="Volume relative shrink-0 border-t border-sidebar-border">
      <div inert={isIdle} aria-disabled={isIdle} className="flex flex-col">
        <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-2 py-3 sm:gap-4 sm:px-4">
          {/* En idle el bloque de datos (carátula, título, autor y origen) se
              oculta con `invisible`, que conserva el espacio: los controles del
              centro no se desplazan. */}
          <div className={`flex min-w-0 items-center gap-3${isIdle ? ' invisible' : ''}`}>
            <SongCover song={song} />

            <div className="min-w-0">
              <p className="truncate TextRegluar">{song?.title ?? 'Nada reproduciendo'}</p>
              <p className="truncate TextMedium opacity-70">{song?.artist ?? '—'}</p>
              {song?.source ? (
                <p className="truncate TextTiny uppercase opacity-60">
                  Reproduciéndose desde: {song.source}
                </p>
              ) : null}
            </div>
          </div>

          <PlayerControls />

          {/* Favoritos y "agregar a playlist" (TS-09) viven acá porque el
              reproductor es el único lugar donde ya se sabe qué canción está
              cargada. El menú de playlists trae su propio trigger: es un
              `DropdownMenu` de Base UI, con `Portal`, y necesita que su botón sea
              el trigger para poder posicionarse y cerrarse con Escape o clic
              afuera. */}
          <div className="flex min-w-0 items-center justify-end gap-0.5 sm:gap-1">
            <FavoriteButton songId={song?.id} />

            <AddToPlaylistPanel songId={song?.id} />

            {/* TODO(agente, TS-06): el botón es solo visual. Falta el estado de
                pantalla completa y alternar expand.svg / collapse.svg. */}
            <button
              type="button"
              aria-label="Expandir"
              title="Expandir"
              className="rounded-full p-2 Volume hover:opacity-80"
            >
              <img src={expandIcon} alt="" aria-hidden="true" className="h-5 w-5" />
            </button>
          </div>
        </div>

        <ProgressBar
          currentTime={currentTime}
          duration={duration}
          onSeek={seek}
          size="sm"
          className="px-2 pb-3 sm:px-4"
        />
      </div>

      {/* Overlay de idle: cubre toda el área de la barra, atenúa y captura los
          clics. El contenido de arriba además queda `inert`, así que el teclado
          y los lectores de pantalla tampoco llegan a los controles. */}
      {isIdle && (
        <div
          className="absolute inset-0 z-10 cursor-not-allowed bg-black/55"
          aria-hidden="true"
        />
      )}
    </footer>
  )
}
