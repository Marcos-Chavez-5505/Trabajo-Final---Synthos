import { useState } from 'react'

/**
 * Estado de la vista `/perfil`: alternar a edición.
 */
export default function useProfileView() {
  const [editing, setEditing] = useState(false)

  return { editing, setEditing }
}