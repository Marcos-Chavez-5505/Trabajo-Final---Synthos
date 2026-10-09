import { useState } from 'react'

/**
 * Edición de nombre y descripción. Se abre en el lugar del encabezado en
 * `PlaylistDetail`, así que no lleva layout propio.
 *
 * No se usa en "Mis Favoritos": ese service rechaza el renombrado y la UI
 * esconde el botón.
 */
export default function PlaylistEditForm({
  initialName,
  initialDescription,
  onSave,
  onCancel,
}) {
  const [name, setName] = useState(initialName)
  const [description, setDescription] = useState(initialDescription)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()

    if (saving) return

    setError('')
    setSaving(true)

    try {
      await onSave({ name, description })
    } catch (cause) {
      setError(cause.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-3">
      <h2 className="Header4">Editar playlist</h2>

      <input
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value)}
        aria-label="Nombre de la playlist"
        maxLength={60}
        className="w-full rounded px-3 py-2 Volume TextRegluar outline-none"
      />

      <textarea
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        aria-label="Descripción de la playlist"
        rows={2}
        maxLength={200}
        className="w-full rounded px-3 py-2 Volume TextRegluar outline-none"
      />

      {error && <p className="rounded px-3 py-2 Salmon TextMedium">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded px-4 py-2 Fucsia Button hover:brightness-110 disabled:opacity-50 disabled:hover:brightness-100"
        >
          {saving ? 'Guardando…' : 'Guardar'}
        </button>
        <button type="button" onClick={onCancel} className="rounded px-4 py-2 Volume Button hover:brightness-110">
          Cancelar
        </button>
      </div>
    </form>
  )
}
