import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../../hooks/useAuth.js'
import {
  listPlaylists,
  createPlaylist as createPlaylistService,
} from '../../services/playlistsService.js'
import playlistIcon from '../../assets/playlist.svg'
import PlaylistCreateForm from './PlaylistCreateForm.jsx'
import PlaylistTile from './PlaylistTile.jsx'

/**
 * "Mis Playlists": la biblioteca personal (TS-09).
 *
 * Reemplaza el shell "en construcción" de `/playlists`. Todas las playlists son
 * privadas, así que la lista sale de `listPlaylists(user.id)`: el filtrado por
 * dueño lo hace el service, no hace falta lógica de permisos acá.
 *
 * El estado de la lista vive acá y no en un Context porque es de esta feature
 * (AGENTS.md). Lo que sí se comparte entre pantallas son los favoritos, que van
 * por `useFavorites`.
 */
export default function Playlists() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const userId = user?.id ?? null

  const [response, setResponse] = useState({ key: null, playlists: [], error: null })
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (!userId) return undefined

    let active = true

    listPlaylists(userId)
      .then((playlists) => {
        if (active) setResponse({ key: userId, playlists, error: null })
      })
      .catch((cause) => {
        if (active) setResponse({ key: userId, playlists: [], error: cause.message })
      })

    return () => {
      active = false
    }
  }, [userId])

  async function handleCreate({ name, description }) {
    const created = await createPlaylistService(userId, { name, description })

    setCreating(false)
    // Se navega a la playlist recién creada: el usuario ya la nombró, lo que
    // sigue es agregar canciones. Eso también evita tener que patching la lista
    // en memoria para un caso en el que esta pantalla se va a desmontar igual.
    navigate(`/playlists/${created.id}`)
  }

  const isCurrent = response.key === userId
  const playlists = isCurrent ? response.playlists : []
  const error = isCurrent ? response.error : null
  // Sin sesión no hay dueño: la biblioteca está vacía, no "cargando".
  const loading = authLoading || (userId !== null && !isCurrent)

  return (
    <section className="px-6 py-4 md:px-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="Header3">Mis Playlists</h1>
          <p className="text-muted-foreground TextRegluar mt-1">
            Son privadas: solo vos las ves.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setCreating((prev) => !prev)}
          className="rounded px-4 py-2 Fucsia Button"
        >
          {creating ? 'Cancelar' : 'Crear playlist'}
        </button>
      </div>

      {creating && (
        <div className="mt-6">
          <PlaylistCreateForm onCreate={handleCreate} onCancel={() => setCreating(false)} />
        </div>
      )}

      {error && <p className="mt-6 rounded px-3 py-2 Salmon TextMedium">{error}</p>}

      {loading ? (
        <p className="text-muted-foreground TextRegluar mt-8">Cargando tus playlists…</p>
      ) : playlists.length > 0 ? (
        <ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {playlists.map((playlist) => (
            <li key={playlist.id}>
              <PlaylistTile playlist={playlist} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState />
      )}
    </section>
  )
}

function EmptyState() {
  return (
    <div className="py-16 text-center">
      <img
        src={playlistIcon}
        alt=""
        aria-hidden="true"
        className="mx-auto h-10 w-10 invert opacity-50"
      />
      <p className="text-foreground Header4 mt-4">Todavía no tenés playlists</p>
      <p className="text-muted-foreground TextRegluar mt-1">
        Creá la primera y empezá a guardar canciones.
      </p>
    </div>
  )
}
