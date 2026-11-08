import { useRef, useState } from 'react'

/**
 * Hook para gestión de portada de playlist.
 *
 * Separa la lógica de portada (menú, subida, borrado, estado visual)
 * del componente principal. La preparación de la imagen y los servicios se
 * inyectan para que sea reutilizable en web y mobile.
 *
 * @param {{ uploadCover, removeCover, prepareImage, toastMessages }} params
 * @returns {{ coverMenuRef, coverInputRef, coverMenuOpen, setCoverMenuOpen,
 *           coverBusy, openCoverMenu, closeCoverMenu, handleCoverFileChange,
 *           handleRemoveCover }}
 */
export function usePlaylistCover({ uploadCover, removeCover, prepareImage, toastMessages }) {
  const coverMenuRef = useRef(null)
  const coverInputRef = useRef(null)

  const [coverMenuOpen, setCoverMenuOpen] = useState(false)
  const [coverBusy, setCoverBusy] = useState(false)

  // Lógica: abrir menú de portada
  function openCoverMenu() {
    setCoverMenuOpen(true)
  }

  // Lógica: cerrar menú de portada
  function closeCoverMenu() {
    setCoverMenuOpen(false)
  }

  // Lógica: cambiar archivo de portada
  async function handleCoverFileChange(event) {
    const file = event.target.files?.[0]

    event.target.value = ''

    if (!file || coverBusy) return

    setCoverMenuOpen(false)
    setCoverBusy(true)

    try {
      const prepared = await prepareImage(file)
      await uploadCover(prepared)
    } catch (cause) {
      toastMessages.playlistCoverUploadError(cause)
    } finally {
      setCoverBusy(false)
    }
  }

  // Lógica: quitar portada
  async function handleRemoveCover() {
    if (coverBusy) return

    setCoverMenuOpen(false)
    setCoverBusy(true)

    try {
      await removeCover()
    } catch (cause) {
      toastMessages.playlistCoverRemoveError(cause)
    } finally {
      setCoverBusy(false)
    }
  }

  return {
    coverMenuRef,
    coverInputRef,
    coverMenuOpen,
    setCoverMenuOpen,
    coverBusy,
    openCoverMenu,
    closeCoverMenu,
    handleCoverFileChange,
    handleRemoveCover,
  }
}
