import { useEffect, useMemo, useRef } from 'react'
import Avatar from '../../components/ui/Avatar.jsx'
import { useProfileEdit } from '@synthos/shared'
import { prepareProfileImage, previewUrlFor } from './profileImage.js'

const ACCEPT = 'image/jpeg,image/png,image/webp'

export default function ProfileEdit({ onDone }) {
  const {
    username,
    setUsername,
    bio,
    setBio,
    error,
    saving,
    status,
    pending,
    setPending,
    removing,
    setRemoving,
    handleSubmit,
    avatarSrc: savedAvatarSrc,
    canRemove,
  } = useProfileEdit(onDone)

  const preview = useMemo(() => (pending ? previewUrlFor(pending) : null), [pending])

  const previewRef = useRef(null)

  useEffect(() => {
    if (preview) {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current)
      previewRef.current = preview
    }
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current)
      previewRef.current = null
    }
  }, [preview])

  const avatarSrc = removing ? null : (preview ?? savedAvatarSrc)

  const pickRef = useRef(0)

  async function handleFileChange(e) {
    const file = e.target.files?.[0]

    e.target.value = ''

    if (!file) return

    const pick = ++pickRef.current

    try {
      const prepared = await prepareProfileImage(file)

      if (pick !== pickRef.current) return

      setPending(prepared)
      setRemoving(false)
    } catch {
      if (pick !== pickRef.current) return

      setPending(null)
      setRemoving(false)
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
            <Avatar src={avatarSrc} name={username} className="h-20 w-20" />

            <div className="flex flex-wrap items-center gap-2">
              <label
                className={`rounded px-3 py-2 Volume Button hover:brightness-110 ${
                  saving ? 'cursor-wait opacity-60 pointer-events-none' : 'cursor-pointer'
                }`}
              >
                Subir foto
                <input
                  type="file"
                  accept={ACCEPT}
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={saving}
                />
              </label>

              <label
                className={`rounded px-3 py-2 Volume Button hover:brightness-110 md:hidden ${
                  saving ? 'cursor-wait opacity-60 pointer-events-none' : 'cursor-pointer'
                }`}
              >
                Tomar foto
                <input
                  type="file"
                  accept="image/*"
                  capture="user"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={saving}
                />
              </label>

              {canRemove && !removing && (
                <button
                  type="button"
                  onClick={() => setRemoving(true)}
                  disabled={saving}
                  className="rounded px-3 py-2 Volume Button hover:brightness-110 disabled:opacity-50"
                >
                  Quitar foto
                </button>
              )}
            </div>
          </div>

          <p className="TextTiny opacity-70">
            {status
              ? status
              : pending
                ? `Foto lista para subir (${Math.round(pending.size / 1024)} KB). Se sube al guardar.`
                : 'Solo JPG, WEBP o PNG. Se recorta a 1024 px y se comprime antes de subir.'}
          </p>

          {removing && (
            <p className="flex items-center gap-2 TextTiny opacity-70">
              La foto se quita cuando guardes.
              <button
                type="button"
                onClick={() => setRemoving(false)}
                disabled={saving}
                className="underline disabled:opacity-50"
              >
                Mantener foto
              </button>
            </p>
          )}
        </div>

        <input
          type="text"
          placeholder="Nombre de usuario"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full rounded px-3 py-2 Volume TextRegluar Placeholder outline-none"
        />
        <textarea
          placeholder="Contá algo sobre vos"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          className="w-full rounded px-3 py-2 Volume TextRegluar Placeholder outline-none"
        />

        {error && <p className="rounded px-3 py-2 Salmon TextMedium">{error}</p>}

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className={`rounded px-4 py-2 Fucsia Button hover:brightness-110 disabled:opacity-50 disabled:hover:brightness-100 ${
              saving ? 'cursor-wait' : 'cursor-pointer'
            }`}
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