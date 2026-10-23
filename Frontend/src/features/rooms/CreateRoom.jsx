import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { listPlaylists } from '@synthos/shared'
import { createRoom } from '@synthos/shared'
import { useAuth } from '@synthos/shared'
import { mapApiError } from '@synthos/shared'

const MAX_NAME = 60
const MAX_DESCRIPTION = 200

/**
 * `/salas/crear`: formulario de creación de sala (TS-14).
 *
 * La fuente de una sala es una playlist con al menos una canción, porque la sala
 * arranca reproduciéndola. Por eso el formulario no se muestra sin playlists
 * usables: si no hay ninguna, la creación se bloquea con un mensaje claro en vez
 * de un error genérico del submit.
 *
 * Puede ser una playlist personal o una colaborativa de la que participe
 * (D19): el backend acepta cualquiera de las dos, así que acá no se filtra por
 * tipo. `listPlaylists` ya devuelve solo las que creó y en las que participa,
 * con lo que el único filtro real es "tiene canciones".
 *
 * El cupo máximo (10) no se manda: lo fija el servidor, y por eso tampoco se
 * escribe en el formulario como si fuera un dato editable.
 */
export default function CreateRoom() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const [playlists, setPlaylists] = useState(null)
  const [loadError, setLoadError] = useState('')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [password, setPassword] = useState('')
  const [playlistId, setPlaylistId] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return undefined

    let active = true

    listPlaylists(user.id)
      .then((all) => {
        if (!active) return

        const usable = all.filter((playlist) => playlist.songIds.length > 0)

        setPlaylists(usable)
        setPlaylistId((current) => current || (usable[0]?.id ?? ''))
      })
      .catch((cause) => {
        if (active) setLoadError(mapApiError(cause))
      })

    return () => {
      active = false
    }
  }, [user])

  if (!user) return null

  const nothingToShow = playlists !== null && playlists.length === 0

  async function handleSubmit(event) {
    event.preventDefault()

    if (saving) return

    setError('')

    if (!name.trim()) {
      setError('Poné un nombre para la sala.')
      return
    }

    if (!playlistId) {
      setError('Elegí una playlist como fuente de la sala.')
      return
    }

    if (isPrivate && !password.trim()) {
      setError('Las salas privadas necesitan contraseña.')
      return
    }

    setSaving(true)

    try {
      const created = await createRoom({
        name,
        description,
        isPrivate,
        password,
        playlistId,
      })

      navigate(`/salas/${created.id}`)
    } catch (cause) {
      setError(mapApiError(cause))
      setSaving(false)
    }
  }

  return (
    <section className="px-6 py-4 md:px-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-foreground Header3">Crear sala</h1>
          <p className="text-muted-foreground TextMedium mt-1">
            Una sala se escucha en grupo. Elegí de qué playlist arranca.
          </p>
        </div>
      </div>

      {loadError && <p className="mt-6 max-w-md rounded px-3 py-2 Salmon TextMedium">{loadError}</p>}

      {playlists === null ? (
        <p className="text-muted-foreground TextRegluar mt-8">Cargando tus playlists…</p>
      ) : nothingToShow ? (
        <NoPlaylistsState />
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-8 max-w-md space-y-4 rounded-lg p-6 SurfaceLight Elevation1"
        >
          <label className="block space-y-1">
            <span className="text-muted-foreground TextMedium">Nombre de la sala</span>
            <input
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ej: Rock de la tarde"
              aria-label="Nombre de la sala"
              maxLength={MAX_NAME}
              className="text-foreground TextRegluar w-full rounded px-3 py-2 Volume outline-none"
            />
          </label>

          <label className="block space-y-1">
            <span className="text-muted-foreground TextMedium">Descripción (opcional)</span>
            <textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="De qué se trata la sala"
              aria-label="Descripción de la sala"
              rows={2}
              maxLength={MAX_DESCRIPTION}
              className="text-foreground TextRegluar w-full rounded px-3 py-2 Volume outline-none"
            />
          </label>

          <div role="group" aria-label="Visibilidad de la sala" className="space-y-2">
            <span className="text-muted-foreground TextMedium">Visibilidad</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                className={`rounded px-4 py-2 Button hover:brightness-110 ${
                  isPrivate ? 'Volume' : 'Fucsia'
                }`}
              >
                Pública
              </button>
              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={`rounded px-4 py-2 Button hover:brightness-110 ${
                  isPrivate ? 'Fucsia' : 'Volume'
                }`}
              >
                Privada
              </button>
            </div>
            <p className="text-muted-foreground TextTiny">
              {isPrivate
                ? 'No aparece en el listado. Se entra con el código y la contraseña.'
                : 'Aparece en el listado y cualquiera puede entrar sin código.'}
            </p>
          </div>

          {isPrivate && (
            <label className="block space-y-1">
              <span className="text-muted-foreground TextMedium">
                Contraseña de la sala
              </span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Mínimo 4 caracteres"
                aria-label="Contraseña de la sala"
                maxLength={40}
                className="text-foreground TextRegluar w-full rounded px-3 py-2 Volume outline-none"
              />
            </label>
          )}

          <label className="block space-y-1">
            <span className="text-muted-foreground TextMedium">
              Playlist fuente
            </span>
            <select
              value={playlistId}
              onChange={(event) => setPlaylistId(event.target.value)}
              aria-label="Playlist fuente de la sala"
              className="text-foreground TextRegluar w-full rounded px-3 py-2 Volume outline-none"
            >
              {playlists.map((playlist) => (
                <option key={playlist.id} value={playlist.id}>
                  {playlist.name} ({playlist.songIds.length}{' '}
                  {playlist.songIds.length === 1 ? 'canción' : 'canciones'})
                </option>
              ))}
            </select>
          </label>

          <p className="text-muted-foreground TextTiny">
            Cupo máximo: 10 personas. Lo define el servidor, no se puede cambiar.
          </p>

          {error && <p className="rounded px-3 py-2 Salmon TextMedium">{error}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded px-4 py-2 Fucsia Button hover:brightness-110 disabled:opacity-50"
            >
              {saving ? 'Creando…' : 'Crear sala'}
            </button>
            <Link
              to="/salas"
              className="rounded px-4 py-2 Volume Button hover:brightness-110"
            >
              Volver
            </Link>
          </div>
        </form>
      )}
    </section>
  )
}

function NoPlaylistsState() {
  return (
    <div className="mt-10 max-w-md rounded-lg p-6 SurfaceLight Elevation1">
      <p className="text-foreground Header4">Necesitás una playlist con canciones</p>
      <p className="text-muted-foreground TextRegluar mt-1">
        La sala arranca reproduciendo tus canciones, así que hace falta al menos
        una playlist con al menos una canción. Podés usar una personal o una
        colaborativa de la que participes. Creala en{' '}
        <Link to="/playlists" className="TextFucsia underline">
          Mis Playlists
        </Link>{' '}
        y después volvé acá.
      </p>
    </div>
  )
}