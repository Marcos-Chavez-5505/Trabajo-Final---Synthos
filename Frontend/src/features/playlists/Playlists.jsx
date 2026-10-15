import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import useAuth from '../../hooks/useAuth.js'
import { createPlaylist as createPlaylistService } from '../../services/playlistsService.js'
import playlistIcon from '../../assets/playlist.svg'
import PlaylistCreateForm from './PlaylistCreateForm.jsx'
import PlaylistInvitations from './PlaylistInvitations.jsx'
import PlaylistTile from './PlaylistTile.jsx'
import usePlaylistList from './usePlaylistList.js'

const TABS = [
  { key: 'mis', label: 'Mis playlists' },
  { key: 'colaborativas', label: 'Colaborativas' },
  { key: 'invitaciones', label: 'Invitaciones' },
]

/**
 * "/playlists": la biblioteca con las playlists del usuario (TS-09) separada en
 * sub-pestañas (TS-12/TS-13): las que creó, las colaborativas donde entró y la
 * bandeja de invitaciones.
 *
 * Una sola request de `listPlaylists` alimenta las dos primeras: el backend ya
 * devuelve las que creaste y las que compartieron (`getUserPlaylists`), y cada
 * playlist trae `role`, así que el reparto es del cliente. La pestaña viva en la
 * URL (`?tab=`), como el resto de los filtros de la app, para que el botón
 * atrás y el link compartido lleven a la misma vista.
 */
export default function Playlists() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { playlists, error, loading } = usePlaylistList()

  const userId = user?.id ?? null

  const tab = TABS.some((item) => item.key === searchParams.get('tab'))
    ? searchParams.get('tab')
    : 'mis'

  const [creating, setCreating] = useState(false)

  async function handleCreate({ name, description, type }) {
    const created = await createPlaylistService(userId, { name, description, type })

    setCreating(false)
    // Se navega a la playlist recién creada: el usuario ya la nombró, lo que
    // sigue es agregar canciones. Eso también evita tener que patching la lista
    // en memoria para un caso en el que esta pantalla se va a desmontar igual.
    navigate(`/playlists/${created.id}`)
  }

  const mine = playlists.filter((playlist) => playlist.role === 'creator')
  const collaborative = playlists.filter(
    (playlist) => playlist.isCollaborative && playlist.role !== 'creator'
  )

  const shown = tab === 'colaborativas' ? collaborative : mine

  return (
    <section className="px-6 py-4 md:px-10">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="Header3">Playlists</h1>

        {tab === 'mis' && (
          <button
            type="button"
            onClick={() => setCreating((prev) => !prev)}
            className="rounded px-4 py-2 Fucsia Button hover:brightness-110"
          >
            {creating ? 'Cancelar' : 'Crear playlist'}
          </button>
        )}
      </div>

      <nav aria-label="Secciones de playlists" className="mt-6 flex flex-wrap gap-2">
        {TABS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setSearchParams(item.key === 'mis' ? {} : { tab: item.key })}
            aria-current={tab === item.key ? 'page' : undefined}
            className={`rounded px-4 py-2 Button ${
              tab === item.key ? 'Fucsia' : 'Volume hover:brightness-110'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>

      {creating && (
        <div className="mt-6">
          <PlaylistCreateForm onCreate={handleCreate} onCancel={() => setCreating(false)} />
        </div>
      )}

      {error && <p className="mt-6 rounded px-3 py-2 Salmon TextMedium">{error}</p>}

      {tab === 'invitaciones' ? (
        <PlaylistInvitations />
      ) : loading ? (
        <p className="text-muted-foreground TextRegluar mt-8">Cargando tus playlists…</p>
      ) : shown.length > 0 ? (
        <ul className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {shown.map((playlist) => (
            <li key={playlist.id}>
              <PlaylistTile playlist={playlist} />
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState tab={tab} />
      )}
    </section>
  )
}

/**
 * La bandeja de invitaciones de TS-13. Cada estado (carga, error, vacío y la
 * lista) es de `PlaylistInvitations`.
 */
function EmptyState({ tab }) {
  const copy = {
    mis: {
      title: 'Todavía no tenés playlists',
      body: 'Creá la primera y empezá a guardar canciones.',
    },
    colaborativas: {
      title: 'No te compartieron ninguna playlist',
      body: 'Cuando alguien te invite a una colaborativa, aparece acá.',
    },
  }[tab]

  return (
    <div className="py-16 text-center">
      <img
        src={playlistIcon}
        alt=""
        aria-hidden="true"
        className="mx-auto h-10 w-10 invert opacity-50"
      />
      <p className="text-foreground Header4 mt-4">{copy.title}</p>
      <p className="text-muted-foreground TextRegluar mt-1">{copy.body}</p>
    </div>
  )
}