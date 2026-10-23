import { useEffect, useRef, useState } from 'react'
import Avatar from '../../components/ui/Avatar.jsx'
import { useAuth } from '@synthos/shared'
import { mapApiError } from '@synthos/shared'
import { prepareProfileImage, previewUrlFor } from './profileImage.js'

const ACCEPT = 'image/jpeg,image/png,image/webp'

export default function ProfileEdit({ onDone }) {
  const { user, updateProfile, uploadProfilePicture } = useAuth()

  const [username, setUsername] = useState(user?.username ?? '')
  const [bio, setBio] = useState(user?.bio ?? '')
  const [error, setError] = useState('')

  // Estado propio de submit: el `loading` de `useAuth` es el de la sesión
  // (arranque, login), no el de guardar el perfil, así que no sirve para
  // bloquear el botón.
  const [saving, setSaving] = useState(false)

  // Texto de progreso. No hay barra de porcentaje porque el archivo ya viene
  // recortado a ≤1 MB (ver `profileImage.js`): la subida dura lo que dura un
  // request normal y alcanza con decir en qué paso está.
  const [status, setStatus] = useState('')

  // Archivo elegido, ya recortado y todavía NO subido, y la URL de objeto para
  // previsualizarlo. `avatarUrl` del usuario es la foto guardada; estos dos son
  // el borrador de arriba.
  const [pending, setPending] = useState(null)
  const [preview, setPreview] = useState(null)

  // Quitar la foto no borra nada hasta que se guarda: la URL va en el PATCH con
  // `pictureUrl: null` y el backend borra el archivo de ImageKit.
  const [removing, setRemoving] = useState(false)

  const previewRef = useRef(null)

  // Cada elección de archivo suma un tick: si el usuario elige dos fotos seguidas
  // y la primera tarda más en procesarse, solo se muestra la última.
  const pickRef = useRef(0)

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    }
  }, [])

  function clearPreview() {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    previewRef.current = null
    setPreview(null)
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0]

    // Vaciar el input permite volver a elegir el mismo archivo después de un
    // error (si no, el `change` no vuelve a disparar).
    e.target.value = ''

    if (!file) return

    const pick = ++pickRef.current

    setError('')
    setStatus('Recortando la imagen…')

    try {
      const prepared = await prepareProfileImage(file)

      if (pick !== pickRef.current) return

      if (previewRef.current) URL.revokeObjectURL(previewRef.current)
      previewRef.current = previewUrlFor(prepared)
      setPreview(previewRef.current)
      setPending(prepared)
      setRemoving(false)
      setStatus('')
    } catch (err) {
      if (pick !== pickRef.current) return

      clearPreview()
      setPending(null)
      setStatus('')
      setError(err instanceof Error ? err.message : 'No se pudo leer la imagen.')
    }
  }

  function handleCancelRemove() {
    setRemoving(false)
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()

    setError('')
    setSaving(true)

    try {
      // Primero la foto: si la subida falla no se manda el resto del perfil, que
      // es lo que pide el criterio de TS-21 de no dejar guardar a medias.
      if (pending) {
        setStatus('Subiendo la foto…')
        await uploadProfilePicture(pending)

        clearPreview()
        setPending(null)
        setRemoving(false)
        setStatus('Guardando…')
        await updateProfile({ username, bio })
      } else if (removing) {
        setStatus('Quitando la foto…')
        await updateProfile({ username, bio, avatarUrl: null })
        setRemoving(false)
      } else {
        setStatus('Guardando…')
        await updateProfile({ username, bio })
      }

      onDone()
    } catch (err) {
      // Por `code`: el texto del servidor puede cambiar sin romper la pantalla
      // (y el error de compresión de la foto, que es local, ya llega en español).
      setError(mapApiError(err, 'No se pudo guardar el perfil.'))
    } finally {
      // Va en `finally` y no solo en el camino feliz: si el guardado falla y el
      // botón queda deshabilitado, el usuario no puede reintentar ni cancelar.
      setStatus('')
      setSaving(false)
    }
  }

  const avatarSrc = removing ? null : (preview ?? user?.avatarUrl ?? null)
  const canRemove = !preview && Boolean(user?.avatarUrl)

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

              {/* `capture` pide la cámara directo en los dispositivos que la tienen.
                  En desktop el atributo no hace nada, así que el botón se oculta
                  para no prometer algo que ahí no existe. */}
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
                onClick={handleCancelRemove}
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