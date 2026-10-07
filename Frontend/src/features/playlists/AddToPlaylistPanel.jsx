import { useState } from 'react'
import { Link } from 'react-router-dom'
import useAuth from '../../hooks/useAuth.js'
import {
  addSongToPlaylist,
  removeSongFromPlaylist,
} from '../../services/playlistsService.js'
import useSongPlaylists from './useSongPlaylists.js'
import addToPlaylistIcon from '../../assets/add_to_playlist.svg'
import playlistIcon from '../../assets/playlist.svg'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuPositioner,
  DropdownMenuPopup,
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuCheckboxItem,
} from '../../components/ui/dropdown-menu.tsx'

/**
 * Menú de "agregar a playlist" del reproductor.
 *
 * Es el mismo `DropdownMenu` de Base UI que el menú de cuenta del Sidebar
 * (`ProfileSummary`) y el de orden de `/salas` (`Rooms`): trigger propio,
 * `Portal` + `Positioner` + `Popup` con el estilo por defecto, y el cierre a
 * cargo del menú, con Escape o con el clic afuera. Por eso el botón "+" vive
 * acá adentro y no suelto en el reproductor: el `Positioner` de Base UI exige un
 * `Portal` y se posiciona contra su trigger, así que un "+" externo dejaba el
 * menú sin ancla.
 *
 * Cada fila es un checkbox: si la canción ya está en la playlist, marcarla la
 * quita. "Mis Favoritos" se excluye de la lista: los favoritos se marcan con el
 * corazón del reproductor, no desde acá, así que ofrecerlos duplicaba dos caminos
 * para lo mismo.
 */
export default function AddToPlaylistPanel({ songId }) {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const {
    playlists: allPlaylists,
    loading,
    error,
    contains,
    inAnyPlaylist,
  } = useSongPlaylists(songId)
  const [pendingId, setPendingId] = useState(null)
  // El reproductor pinta el "+" activo mientras el menú está abierto y también
  // cuando la canción ya está en alguna playlist, así que el estado del menú vive
  // acá y no en el reproductor.
  const [open, setOpen] = useState(false)

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
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            aria-label="Agregar a playlist"
            title="Agregar a playlist"
            className={`rounded-full p-2 hover:opacity-80 ${
              open || inAnyPlaylist ? 'Fucsia' : 'Volume'
            }`}
          />
        }
      >
        <img src={addToPlaylistIcon} alt="" aria-hidden="true" className="h-5 w-5" />
      </DropdownMenuTrigger>

      <DropdownMenuPortal>
        <DropdownMenuPositioner side="top" align="end">
          <DropdownMenuPopup>
            <DropdownMenuGroup>
              <DropdownMenuGroupLabel className="TextMedium">
                Agregar a playlist
              </DropdownMenuGroupLabel>

              {loading ? (
                <p className="text-muted-foreground TextMedium px-2 py-1.5">Cargando…</p>
              ) : error ? (
                <p className="Salmon TextMedium mx-2 my-1 rounded px-3 py-2">{error}</p>
              ) : playlists.length === 0 ? (
                <p className="text-muted-foreground TextMedium px-2 py-1.5">
                  Todavía no tenés playlists.{' '}
                  {/* El reproductor sobrevive a la navegación: sin cerrar el menú al
                      cambiar de ruta, "Creá una" lo deja flotando arriba de la
                      biblioteca. */}
                  <Link to="/playlists" onClick={() => setOpen(false)} className="text-accent">
                    Creá una
                  </Link>
                  .
                </p>
              ) : (
                playlists.map((playlist) => {
                  const already = contains(playlist)
                  const pending = pendingId === playlist.id

                  return (
                    <DropdownMenuCheckboxItem
                      key={playlist.id}
                      checked={already}
                      disabled={pending}
                      label={playlist.name}
                      onCheckedChange={() => handleToggle(playlist)}
                    >
                      <img src={playlistIcon} alt="" aria-hidden="true" />
                      <span className="min-w-0 flex-1 truncate">{playlist.name}</span>
                    </DropdownMenuCheckboxItem>
                  )
                })
              )}
            </DropdownMenuGroup>
          </DropdownMenuPopup>
        </DropdownMenuPositioner>
      </DropdownMenuPortal>
    </DropdownMenu>
  )
}