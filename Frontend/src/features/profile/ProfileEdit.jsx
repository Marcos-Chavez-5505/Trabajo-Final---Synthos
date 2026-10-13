import { useState } from 'react'
import Avatar from '../../components/ui/Avatar.jsx'
import useAuth from '../../hooks/useAuth.js'

export default function ProfileEdit({ onDone }) {
  const { user, updateProfile, loading } = useAuth()

  const [username, setUsername] = useState(user?.username ?? '')
  const [bio, setBio] = useState(user?.bio ?? '')
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl ?? '')
  const [error, setError] = useState('')

  //? Se implementó un nuevo estado de loading porque el loading que se extrae de useAuth no me funcionaba (lauty)
  const [dataLoading, setDataLoading] = useState(false)


  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      setError('Solo se permiten JPG, PNG o WEBP.')
      return
    }
    if (file.size > 25 * 1024 * 1024) {
      setError('La imagen no puede superar los 25 MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => setAvatarUrl(String(reader.result))
    reader.readAsDataURL(file)
  }

  async function handleSubmit(e) {
  e.preventDefault()
  setError('')
  setDataLoading(true)

  try {

    await updateProfile({
      username,
      bio,
      avatarUrl: avatarUrl || null,
    })
    onDone()
    setDataLoading(false)
  } catch (err) {
    setError(err instanceof Error ? err.message : 'No se pudo guardar el perfil.')
  }
}
  return (
    <div className="p-6 md:p-10">
      <form
        onSubmit={handleSubmit}
        className="max-w-md space-y-4 rounded-lg p-6 SurfaceLight"
      >
        <h2 className="Header4">Editar perfil</h2>

        <div className="space-y-2">
  <div className="flex items-center gap-4">
    <Avatar src={avatarUrl} name={username} className="h-20 w-20" />
    <label
  className={`rounded px-3 py-2 Volume Button hover:brightness-110 ${
    dataLoading
      ? 'cursor-wait opacity-60 pointer-events-none'
      : 'cursor-pointer'
  }`}
>
      Subir foto
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
        disabled={dataLoading}
      />
    </label>
  </div>

  <p className="TextSmall text-neutral-400">
    Solo JPG, WEBP o PNG de hasta 25 MB.
  </p>
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
            disabled={dataLoading}
            className={`rounded px-4 py-2 Fucsia Button hover:brightness-110 disabled:opacity-50 disabled:hover:brightness-100 ${dataLoading ? "cursor-wait" : "cursor-pointer"}`}
          >
            Guardar
          </button>
          <button
            type="button"
            onClick={onDone}
            className="rounded px-4 py-2 Volume Button hover:brightness-110"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}