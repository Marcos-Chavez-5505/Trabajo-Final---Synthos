import { useState } from 'react'
import { mapApiError } from '@synthos/shared'

/**
 * Formulario de creación de playlist. Se muestra dentro del popover de
 * `/playlists`; la edición del detalle es inline con los mismos campos y copy,
 * para que el copy y la validación no se dupliquen.
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
      setError(mapApiError(cause))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Nombre"
        aria-label="Nombre de la playlist"
        maxLength={50}
        className="w-full rounded px-3 py-2 Volume TextRegluar outline-none bg-(--ds-surface)/20 ring-0 ring-transparent focus-visible:ring-2 focus-visible:ring-ring placeholder:opacity-60"
      />

      <textarea
        value={description}
        onChange={(event) => setDescription(event.target.value)}
        placeholder="Descripción"
        aria-label="Descripción de la playlist"
        rows={6}
        maxLength={200}
        className="TextRegluar mt-1 w-full rounded bg-(--ds-surface)/20 px-3 py-2 outline-none ring-0 ring-transparent focus-visible:ring-2 focus-visible:ring-ring resize-none placeholder:opacity-60"
      />

      {error && <p className="rounded px-3 py-2 Salmon TextMedium">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded px-4 py-2 Fucsia Button hover:brightness-110 disabled:opacity-50 disabled:hover:brightness-100"
        >
          {saving ? 'Creando…' : 'Crear'}
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
