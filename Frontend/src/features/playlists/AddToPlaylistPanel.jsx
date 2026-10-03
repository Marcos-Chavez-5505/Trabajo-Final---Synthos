import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import useAuth from '../../hooks/useAuth.js'
import { addSongToPlaylist, listPlaylists } from '../../services/playlistsService.js'
import playlistIcon from '../../assets/playlist.svg'

/**
 * Lista de playlists del usuario para agregar la canción que está sonando.
 *
 * Se abre desde el reproductor, sobre la canción actual, en vez de duplicar un
 * botón "agregar" en cada card: el reproductor es el único lugar donde ya se sabe
 * qué canción está cargada.
 *
 * Es un panel inline controlado por quien lo abre y no el `Sheet` de shadcn: ese
 * componente no se usó nunca en el repo y depende de las animaciones de base-ui,
 * que son imposibles de verificar sin navegador.
 *
 * Agregar a "Mis Favoritos" crea esa playlist si no existía, que es el
 * comportamiento pedido en TS-09.
 */
export default function AddToPlaylistPanel({ songId, onClose }) {
  const { user } = useAuth()
  const userId = user?.id ?? null

  const [response, setResponse] = useState({ key: null, playlists: [], error: null })
  const [addedTo, setAddedTo] = useState(null)

  const requestKey = userId && songId ? `${userId}:${songId}` : null

  useEffect(() => {
    if (!userId || !songId) return undefined

    let active = true

    listPlaylists(userId)
      .then((playlists) => {
        if (active) setResponse({ key: `${userId}:${songId}`, playlists, error: null })
      })
      .catch((cause) => {
        if (active) {
          setResponse({ key: `${userId}:${songId}`, playlists: [], error: cause.message })
        }
      })

    return () => {
      active = false
    }
  }, [userId, songId])

  async function handleAdd(playlistId) {
    await addSongToPlaylist(userId, playlistId, songId)

    setAddedTo(playlistId)
  }

  const isCurrent = response.key === requestKey
  const playlists = isCurrent ? response.playlists : []
  const error = isCurrent ? response.error : null
  const loading = Boolean(requestKey) && !isCurrent

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
        <ul className="mt-4 flex flex-col gap-1">
          {playlists.map((playlist) => {
            const already = playlist.songIds.some((id) => String(id) === String(songId))

            return (
              <li key={playlist.id}>
                <button
                  type="button"
                  onClick={() => handleAdd(playlist.id)}
                  disabled={already || addedTo === playlist.id}
                  className="flex w-full items-center gap-2 rounded px-2 py-2 text-left TextRegluar hover:opacity-80 disabled:opacity-60"
                >
                  <img
                    src={playlistIcon}
                    alt=""
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 invert opacity-70"
                  />
                  <span className="min-w-0 flex-1 truncate">{playlist.name}</span>
                  {already && (
                    <span className="text-muted-foreground TextTiny shrink-0">Ya está</span>
                  )}
                  {addedTo === playlist.id && (
                    <span className="text-accent TextTiny shrink-0">Agregada</span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
