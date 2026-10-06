import { useState } from 'react'
import { Link } from 'react-router-dom'
import useAuth from '../../hooks/useAuth.js'
import {
  addSongToPlaylist,
  removeSongFromPlaylist,
} from '../../services/playlistsService.js'
import useSongPlaylists from './useSongPlaylists.js'
import {
  DropdownMenu,
  DropdownMenuPopup,
  DropdownMenuPositioner,
  DropdownMenuCheckboxItem,
} from '../../components/ui/dropdown-menu.tsx'

/**
 * Lista de playlists del usuario para agregar o quitar la canción que está sonando.
 *
 * Se abre desde el reproductor, sobre la canción actual, en vez de duplicar un
 * botón "agregar" en cada card: el reproductor es el único lugar donde ya se sabe
 * qué canción está cargada.
 *
 * Es un panel inline controlado por quien lo abre y no el `Sheet` de shadcn: ese
 * componente no se usó nunca en el repo y depende de las animaciones de base-ui,
 * que son imposibles de verificar sin navegador.
 *
 * Cada fila es un toggle: si la canción ya está en la playlist, el clic la quita.
 * "Mis Favoritos" se excluye de la lista: los favoritos se marcan con el corazón
 * del reproductor, no desde acá, así que ofrecerlos duplicaba dos caminos para lo
 * mismo.
 */
export default function AddToPlaylistPanel({ songId, onClose }) {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const { playlists: allPlaylists, loading, error, contains } = useSongPlaylists(songId)
  const [pendingId, setPendingId] = useState(null)

  const playlists = allPlaylists.filter((playlist) => !playlist.isFavorites)

  async function handleToggle(playlist) {
    // Se bloquea la fila mientras escribe: el toggle no debe correr dos veces
    // seguidas y anularse.
    if (pendingId) return

    setPendingId(playlist.id)

    try {
      if (contains(playlist)) {
        await removeSongFromPlaylist(userId, playlist.id, songId)
      } else {
        await addSongToPlaylist(userId, playlist.id, songId)
      }
    } finally {
      setPendingId(null)
    }
  }

  return (
    <div className="SurfaceLight Elevation1 CardRadius w-72 p-4">
      <div className="flex items-center justify-between">
        <h3 className="Header4">Agregar a playlist</h3>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="rounded px-2 py-1 TextMedium hover:opacity-70"
        >
          Cerrar
        </button>
      </div>

      {loading ? (
        <p className="text-muted-foreground TextMedium mt-4">Cargando…</p>
      ) : error ? (
        <p className="mt-4 rounded px-3 py-2 Salmon TextMedium">{error}</p>
      ) : playlists.length === 0 ? (
        <p className="text-muted-foreground TextMedium mt-4">
          Todavía no tenés playlists.{' '}
          {/* El panel vive en el PlayerBar, que sobrevive a la navegación: sin
              cerrarlo al cambiar de ruta, "Creá una" te deja el panel flotando
              arriba de la biblioteca. */}
          <Link to="/playlists" onClick={onClose} className="text-accent">
            Creá una
          </Link>
          .
        </p>
      ) : (
        <DropdownMenu open modal={false}>
          <DropdownMenuPositioner side="top" align="end" sideOffset={8}>
            <DropdownMenuPopup className="SurfaceLight Elevation1 CardRadius w-72 p-2">
              <div className="flex items-center justify-between px-1 py-1">
                <h3 className="Header4">Agregar a playlist</h3>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Cerrar"
                  className="rounded px-2 py-1 TextMedium hover:opacity-70"
                >
                  Cerrar
                </button>
              </div>

              <ul className="mt-2 flex flex-col gap-0.5">
                {playlists.map((playlist) => {
                  const already = contains(playlist)
                  const pending = pendingId === playlist.id

                  return (
                    <li key={playlist.id}>
                      <DropdownMenuCheckboxItem
                        checked={already}
                        disabled={pending}
                        onClick={(e) => {
                          e.preventDefault()
                          handleToggle(playlist)
                        }}
                        aria-label={`${already ? 'Quitar' : 'Agregar'} ${playlist.name} a la playlist`}
                      >
                        <span className="min-w-0 flex-1 truncate">{playlist.name}</span>
                      </DropdownMenuCheckboxItem>
                    </li>
                  )
                })}
              </ul>
            </DropdownMenuPopup>
          </DropdownMenuPositioner>
        </DropdownMenu>
      )}
    </div>
  )
}
