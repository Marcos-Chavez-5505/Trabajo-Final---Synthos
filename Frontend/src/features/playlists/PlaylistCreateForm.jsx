import { useState } from 'react'

/**
 * Formulario de creación de playlist. Se usa suelto en `/playlists`; la edición
 * reusa los mismos campos desde `PlaylistEditForm` en el detalle, para que el
 * copy y la validación no se dupliquen.
 *
 * Presentacional con la lógica del submit: el service lo llama quien lo usa
 * (AGENTS.md, regla 5).
 */
export default function PlaylistCreateForm({ onCreate, onCancel }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()

    if (saving) return

    setError('')
    setSaving(true)

    try {
      await onCreate({ name, description })
    } catch (cause) {
      setError(cause.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-md space-y-4 rounded-lg p-6 SurfaceLight Elevation1"
    >
      <h2 className="Header4">Nueva playlist</h2>

      <input
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Nombre de la playlist"
        aria-label="Nombre de la playlist"
        maxLength={60}
        className="w-full rounded px-3 py-2 Volume TextRegluar outline-none"
      />

      <textarea
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Descripción (opcional)"
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
          className="rounded px-4 py-2 Fucsia Button disabled:opacity-50"
        >
          {saving ? 'Creando…' : 'Crear'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded px-4 py-2 Volume Button"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
