import { useState } from 'react'
import Avatar from '../../components/ui/Avatar.jsx'
import useAuth from '../../hooks/useAuth.js'

export default function ProfileEdit({ onDone }) {
  const { user, updateProfile, loading } = useAuth()

  const [username, setUsername] = useState(user?.username ?? '')
  const [bio, setBio] = useState(user?.bio ?? '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '')
  const [error, setError] = useState('')

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setAvatarUrl(String(reader.result))
    reader.readAsDataURL(file)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    try {
      await updateProfile({
        username,
        bio,
        avatarUrl: avatarUrl || null,
      })
      onDone()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el perfil.')
    }
  }

  if (!user) {
    return (
      <div className="p-6 md:p-10">
        <p className="TextRegluar">Iniciá sesión para editar tu perfil.</p>
      </div>
    )
  }

  return (
    <div className="p-6 md:p-10">
      <form
        onSubmit={handleSubmit}
        className="max-w-md space-y-4 rounded-lg p-6 SurfaceLight"
      >
        <h2 className="Header4">Editar perfil</h2>

        <div className="flex items-center gap-4">
          <Avatar src={avatarUrl} name={username} className="h-20 w-20" />
          <label className="cursor-pointer rounded px-3 py-2 Volume Button">
            Subir foto
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>

        <input
          type="text"
          placeholder="Nombre de usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full rounded px-3 py-2 Volume TextRegluar placeholder-neutral-500 outline-none"
        />
        <textarea
          placeholder="Contá algo sobre vos"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          className="w-full rounded px-3 py-2 Volume TextRegluar placeholder-neutral-500 outline-none"
        />
        {/* TODO: falta token de color para placeholder */}

        {error && <p className="rounded px-3 py-2 Salmon TextMedium">{error}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded px-4 py-2 Fucsia Button disabled:opacity-50"
          >
            Guardar
          </button>
          <button
            type="button"
            onClick={onDone}
            className="rounded px-4 py-2 Volume Button"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}