import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { createRoom, listPlaylists, mapApiError, useAuth, useMyRooms } from '@synthos/shared'

const MAX_NAME = 60
const MAX_DESCRIPTION = 200

export default function RoomCreateForm({ onCreated, onCancel }) {
  const { user } = useAuth()
  const { currentRoom, loading: roomsLoading } = useMyRooms()

  const [playlists, setPlaylists] = useState(null)
  const [loadError, setLoadError] = useState('')

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
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

  if (roomsLoading) {
    return <p className="text-muted-foreground TextRegluar">Cargando tus playlists…</p>
  }

  if (currentRoom) {
    const isCurrentHost = String(currentRoom.hostId) === String(user.id)

    return (
      <div className="space-y-2">
        <p className="text-foreground Header4">Ya estás en una sala</p>
        <p className="text-muted-foreground TextRegluar">
          {isCurrentHost
            ? `Cerrá «${currentRoom.name}» para crear otra.`
            : `Salí de «${currentRoom.name}» para crear otra.`}
        </p>
        <Link
          to={`/salas/${currentRoom.id}`}
          className="inline-block rounded px-4 py-2 Fucsia Button hover:brightness-110"
        >
          Ir a mi sala
        </Link>
      </div>
    )
  }

  if (loadError) {
    return <p className="rounded px-3 py-2 Salmon TextMedium">{loadError}</p>
  }

  if (playlists === null) {
    return <p className="text-muted-foreground TextRegluar">Cargando tus playlists…</p>
  }

  if (playlists.length === 0) {
    return <NoPlaylistsState />
  }

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

    setSaving(true)

    try {
      const created = await createRoom({
        name,
        description,
        isPrivate,
        playlistId,
      })

      onCreated(created)
    } catch (cause) {
      setError(mapApiError(cause))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block space-y-1">
        <span className="text-muted-foreground TextMedium">Nombre de la sala</span>
        <input
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Ej: Rock de la tarde"
          aria-label="Nombre de la sala"
          maxLength={MAX_NAME}
          autoFocus
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
            ? 'No aparece en el listado. Se entra con el código.'
            : 'Aparece en el listado y cualquiera puede entrar sin código.'}
        </p>
      </div>

      <label className="block space-y-1">
        <span className="text-muted-foreground TextMedium">Playlist fuente</span>
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
        <button
          type="button"
          onClick={onCancel}
          className="rounded px-4 py-2 Volume Button hover:brightness-110"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}

function NoPlaylistsState() {
  return (
    <div>
      <p className="text-foreground Header4">Necesitás una playlist con canciones</p>
      <p className="text-muted-foreground TextRegluar mt-1">
        La sala arranca reproduciendo tus canciones, así que hace falta al menos una
        playlist con al menos una canción. Podés usar una personal o una colaborativa
        de la que participes. Creala en{' '}
        <Link to="/playlists" className="TextFucsia underline">
          Mis Playlists
        </Link>{' '}
        y después volvé acá.
      </p>
    </div>
  )
}