import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import useAuth from '../../hooks/useAuth.js'
import {
  addSongToPlaylist,
  removeSongFromPlaylist,
} from '../../services/playlistsService.js'
import useSongPlaylists from './useSongPlaylists.js'
import {
  DropdownMenu,
  DropdownMenuPositioner,
  DropdownMenuPopup,
  DropdownMenuGroup,
  DropdownMenuCheckboxItem,
} from '../../components/ui/dropdown-menu.tsx'

/**
 * Lista de playlists del usuario para agregar o quitar la canción que está sonando.
 *
 * Se abre desde el reproductor, sobre la canción actual, en vez de duplicar un
 * botón "agregar" en cada card: el reproductor es el único lugar donde ya se sabe
 * qué canción está cargada.
 *
 * El menú se arma con el `DropdownMenu` de shadcn ( sobre Base UI), pero sin
 * `DropdownMenuTrigger`: el botón "+" del reproductor no es un trigger de Base UI
 * porque no se puede cambiar desde acá, y el panel ya se monta y desmonta según
 * ese botón. Por eso el ancla es esta caja vacía: el reproductor ya la coloca
 * justo arriba del "+", y `side="top"` + `align="end"` deja el popup en ese mismo
 * lugar. El popup no va en un portal a propósito: dentro del reproductor, el
 * `pointerdown` de afuera que lo cierra sigue viéndolo como parte del panel.
 *
 * Cada fila es un checkbox: si la canción ya está en la playlist, marcarla la
 * quita. "Mis Favoritos" se excluye de la lista: los favoritos se marcan con el
 * corazón del reproductor, no desde acá, así que ofrecerlos duplicaba dos caminos
 * para lo mismo.
 */
export default function AddToPlaylistPanel({ songId, onClose }) {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const { playlists: allPlaylists, loading, error, contains } = useSongPlaylists(songId)
  const [pendingId, setPendingId] = useState(null)
  const anchorRef = useRef(null)

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
    <div ref={anchorRef} className="w-72">
      <DropdownMenu
        open
        modal={false}
        onOpenChange={(next, details) => {
          // El clic afuera lo cierra el reproductor (su listener envuelve este
          // panel), así que acá solo se atiende Escape. También lo cerraría
          // Base UI con `outside-press`, pero como el popup no tiene trigger, el
          // clic en "+" contaría como afuera: cerraría y el reproductor lo
          // volvería a abrir en el mismo gesto.
          if (!next && details.reason === 'escape-key') onClose()
        }}
      >
        <DropdownMenuPositioner
          anchor={anchorRef}
          positionMethod="fixed"
          side="top"
          align="end"
          sideOffset={0}
          collisionPadding={8}
        >
          <DropdownMenuPopup className="SurfaceLight Elevation1 CardRadius w-72 p-2">
            <h3 className="Header4 px-2 py-1.5">Agregar a playlist</h3>

            {loading ? (
              <p className="text-muted-foreground TextMedium px-2 py-1.5">Cargando…</p>
            ) : error ? (
              <p className="Salmon TextMedium mx-2 my-1.5 rounded px-3 py-2">{error}</p>
            ) : playlists.length === 0 ? (
              <p className="text-muted-foreground TextMedium px-2 py-1.5">
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
              <DropdownMenuGroup>
                {playlists.map((playlist) => {
                  const already = contains(playlist)
                  const pending = pendingId === playlist.id

                  return (
                    <DropdownMenuCheckboxItem
                      key={playlist.id}
                      checked={already}
                      disabled={pending}
                      // Explícito aunque sea el default: marcar una playlist no
                      // debe cerrar el menú, para poder marcar varias.
                      closeOnClick={false}
                      onCheckedChange={() => handleToggle(playlist)}
                    >
                      <span className="min-w-0 flex-1 truncate">{playlist.name}</span>
                    </DropdownMenuCheckboxItem>
                  )
                })}
              </DropdownMenuGroup>
            )}
          </DropdownMenuPopup>
        </DropdownMenuPositioner>
      </DropdownMenu>
    </div>
  )
}