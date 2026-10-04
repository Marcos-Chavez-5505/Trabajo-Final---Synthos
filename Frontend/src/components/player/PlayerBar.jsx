import { useEffect, useRef, useState } from 'react'
import musicNoteIcon from '../../assets/music_note.svg'
import expandIcon from '../../assets/expand.svg'
import addToPlaylistIcon from '../../assets/add_to_playlist.svg'
import usePlayer from '../../hooks/usePlayer.js'
import AddToPlaylistPanel from '../../features/playlists/AddToPlaylistPanel.jsx'
import FavoriteButton from '../../features/playlists/FavoriteButton.jsx'
import useSongPlaylists from '../../features/playlists/useSongPlaylists.js'
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
 */
export default function PlayerBar() {
  const { song, currentTime, duration, seek, hasQueue } = usePlayer()
  const [adding, setAdding] = useState(false)
  const menuRef = useRef(null)
  // Activo cuando la canción ya está en alguna playlist (sin contar favoritos),
  // además de mientras el panel está abierto.
  const { inAnyPlaylist } = useSongPlaylists(song?.id)

  // Cualquier clic fuera del panel (y de su botón) lo cierra. Se usa `pointerdown`
  // para reaccionar antes que el `click` de los elementos que están debajo. El
  // listener sólo existe mientras el panel está abierto.
  useEffect(() => {
    if (!adding) return undefined

    function handlePointerDown(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setAdding(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)

    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [adding])

  if (!hasQueue) return null

  return (
    <footer className="Surface relative flex shrink-0 flex-col border-t border-sidebar-border">
      <div className="flex items-center gap-4 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
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
            cargada. */}
        <div className="flex flex-1 items-center justify-end gap-1">
          <FavoriteButton songId={song?.id} />

          <div className="relative" ref={menuRef}>
            <button
              type="button"
              onClick={() => setAdding((prev) => !prev)}
              aria-expanded={adding}
              aria-label="Agregar a playlist"
              title="Agregar a playlist"
              className={`rounded-full p-2 hover:opacity-80 ${
                adding || inAnyPlaylist ? 'Fucsia' : 'Volume'
              }`}
            >
              <img
                src={addToPlaylistIcon}
                alt=""
                aria-hidden="true"
                className="h-5 w-5"
              />
            </button>

            {adding && (
              <div className="absolute right-0 bottom-12 z-20">
                <AddToPlaylistPanel
                  songId={song?.id}
                  onClose={() => setAdding(false)}
                />
              </div>
            )}
          </div>

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
        className="px-4 pb-3"
      />
    </footer>
  )
}
