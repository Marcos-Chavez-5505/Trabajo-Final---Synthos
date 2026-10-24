import { useState } from 'react'
import useAuth from '../../hooks/useAuth.js'
import { mapApiError } from '../../utils/mapError.js'

/**
 * Estado y handlers del formulario de edición de perfil.
 *
 * La preparación de la imagen (recorte/compresión) vive en el componente
 * (web), porque usa canvas. Acá solo se gestiona el borrador y el guardado.
 */
export default function useProfileEdit(onDone) {
  const { user, updateProfile, uploadProfilePicture } = useAuth()

  const [username, setUsername] = useState(user?.username ?? '')
  const [bio, setBio] = useState(user?.bio ?? '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState('')
  const [pending, setPending] = useState(null)
  const [removing, setRemoving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()

    setError('')
    setSaving(true)

    try {
      if (pending) {
        setStatus('Subiendo la foto…')
        await uploadProfilePicture(pending)

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
      setError(mapApiError(err, 'No se pudo guardar el perfil.'))
    } finally {
      setStatus('')
      setSaving(false)
    }
  }

  const avatarSrc = removing ? null : user?.avatarUrl ?? null
  const canRemove = !pending && Boolean(user?.avatarUrl)

  return {
    user,
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
    avatarSrc,
    canRemove,
  }
}