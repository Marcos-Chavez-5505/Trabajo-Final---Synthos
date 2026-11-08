import { useState } from 'react'
import { mapApiError } from '../../utils/mapError.js'

/**
 * Hook para gestión de edición inline de playlist.
 *
 * Separa el estado y handlers del formulario de edición (título/descripción)
 * del componente principal. Recibe `onApply` para que el padre se encargue de
 * persistir los cambios y actualizar la playlist.
 *
 * @param {{ onApply, initialName, initialDescription }} params
 * @returns {{ editing, draftName, draftDescription, setDraftName,
 *           setDraftDescription, savingEdit, editError, handleStartEdit,
 *           handleCancelEdit, handleSaveEdit, handleEditKeyDown }}
 */
export function usePlaylistEdit({ onApply, initialName, initialDescription }) {
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState(initialName ?? '')
  const [draftDescription, setDraftDescription] = useState(initialDescription ?? '')
  const [savingEdit, setSavingEdit] = useState(false)
  const [editError, setEditError] = useState('')

  // Iniciar edición: cargar valores actuales
  function handleStartEdit() {
    setDraftName(initialName ?? '')
    setDraftDescription(initialDescription ?? '')
    setEditError('')
    setEditing(true)
  }

  // Cancelar edición: restaurar valores
  function handleCancelEdit() {
    if (savingEdit) return
    setEditError('')
    setEditing(false)
  }

  // Guardar edición
  async function handleSaveEdit(event) {
    event.preventDefault()

    if (savingEdit) return

    const name = draftName.trim()
    if (!name) {
      setEditError('Ponle un nombre a la playlist.')
      return
    }

    setEditError('')
    setSavingEdit(true)

    try {
      await onApply({ name, description: draftDescription })
      setEditing(false)
    } catch (cause) {
      setEditError(mapApiError(cause, 'No se pudo guardar la playlist.'))
    } finally {
      setSavingEdit(false)
    }
  }

  // Escape para cancelar
  function handleEditKeyDown(event) {
    if (event.key !== 'Escape' || savingEdit) return
    event.preventDefault()
    handleCancelEdit()
  }

  return {
    editing,
    draftName,
    setDraftName,
    draftDescription,
    setDraftDescription,
    savingEdit,
    editError,
    handleStartEdit,
    handleCancelEdit,
    handleSaveEdit,
    handleEditKeyDown,
  }
}
