import { useEffect } from 'react'
import { usePlaylistCover, usePlaylistEdit } from '@synthos/shared'
import AvatarStack from '@/components/ui/AvatarStack.jsx'
import { toastMessages } from '@/lib/toastMessages.js'
import { prepareProfileImage } from '@/lib/images/prepareImage.js'
import cameraIcon from '@synthos/shared/assets/icons/camera.svg'
import headphonesIcon from '@synthos/shared/assets/icons/headphones.svg'
import pencilLineIcon from '@synthos/shared/assets/icons/pencil_line.svg'
import playIcon from '@synthos/shared/assets/icons/play.svg'
import trashIcon from '@synthos/shared/assets/icons/trash.svg'
import userIcon from '@synthos/shared/assets/icons/user.svg'
import userGroupIcon from '@synthos/shared/assets/icons/user_group.svg'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

/** Header visual reutilizable para playlists y álbumes.
 *  Albums solo consumen los estilos/visuales; la lógica de edición viene
 *  del padre mediante props (que pueden ser undefined).
 *
 * Props:
 *  - playlist: objeto de playlist (name, description, coverUrl, isFavorites, role, isCollaborative, members, etc.)
 *  - coverSrc: URL actual de la portada (o fallback headphonesIcon)
 *  - hasCoverImage: si hay portada real (imagen subida o carátula de canción)
 *  - visibleCount: cantidad de canciones visibles (excluye las que se están quitando)
 *  - canEditCover: si el usuario actual puede editar la portada
 *  - isMobile: boolean derivado del breakpoint en el componente padre
 *  - onApplyEdit: callback para persistir nombre/descripción
 *  - onUploadCover: callback para subir una portada ya preparada
 *  - onRemoveCover: callback para quitar la portada
 *  - onDelete: callback opcional para borrar playlist (undefined para álbumes)
 *  - onInvite: callback opcional para invitar personas
 *  - onPlay: callback opcional para reproducir (undefined si no hay canciones)
 */
export default function HeaderPlaylist({
  playlist,
  coverSrc,
  hasCoverImage = false,
  visibleCount = 0,
  canEditCover = false,
  isMobile = false,
  onApplyEdit,
  onUploadCover,
  onRemoveCover,
  onDelete,
  onInvite,
  onPlay,
}) {
  const prefersReduced = useReducedMotion()
  const isCreator = playlist?.role === 'creator'
  const isFavorites = Boolean(playlist?.isFavorites)
  const canUserEdit = Boolean(canEditCover && isCreator && !isFavorites)
  const hasMembers = Boolean(playlist?.members?.length)

  // Portada hook
  const {
    coverMenuRef,
    coverInputRef,
    coverMenuOpen,
    setCoverMenuOpen,
    coverBusy,
    openCoverMenu,
    handleCoverFileChange,
    handleRemoveCover,
  } = usePlaylistCover({
    uploadCover: onUploadCover,
    removeCover: onRemoveCover,
    prepareImage: prepareProfileImage,
    toastMessages,
  })

  // Edición inline hook
  const {
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
  } = usePlaylistEdit({
    onApply: onApplyEdit,
    initialName: playlist?.name,
    initialDescription: playlist?.description,
  })

  // Cerrar el menú de portada al hacer clic fuera, con Escape o al scrollear.
  useEffect(() => {
    if (!coverMenuOpen) return undefined

    function onPointerDown(event) {
      if (!coverMenuRef.current?.contains(event.target)) setCoverMenuOpen(false)
    }

    function onKeyDown(event) {
      if (event.key === 'Escape') setCoverMenuOpen(false)
    }

    function onScrollAway() {
      setCoverMenuOpen(false)
    }

    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('scroll', onScrollAway, true)
    window.addEventListener('wheel', onScrollAway, { passive: true })
    window.addEventListener('resize', onScrollAway)

    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('scroll', onScrollAway, true)
      window.removeEventListener('wheel', onScrollAway)
      window.removeEventListener('resize', onScrollAway)
    }
  }, [coverMenuOpen, coverMenuRef, setCoverMenuOpen])

  const canDelete = canUserEdit && Boolean(onDelete)

  const deleteButton = (className) => (
    <button
      type="button"
      onClick={() => onDelete()}
      className={`flex items-center justify-center gap-2 whitespace-nowrap rounded px-4 bg-(--ds-volume)/60 Button hover:brightness-110 ${className}`}
    >
      <img src={trashIcon} alt="" aria-hidden="true" className="h-5 w-5 shrink-0" />
      <span className="flex flex-col items-start leading-tight">
        <span>Eliminar</span>
        <span>playlist</span>
      </span>
    </button>
  )

  const editForm = editing ? (
    <form onSubmit={handleSaveEdit} onKeyDown={handleEditKeyDown} className="max-w-3xl">
      <div className="flex items-stretch gap-6">
        <div className="min-w-0 flex-1">
          <input
            type="text"
            value={draftName}
            onChange={(event) => setDraftName(event.target.value)}
            aria-label="Nombre de la playlist"
            maxLength={60}
            autoFocus
            placeholder="Título"
            className="Header2 w-full min-w-0 rounded bg-(--ds-surface)/20 px-1 outline-none ring-0 ring-transparent focus-visible:ring-2 focus-visible:ring-ring placeholder:opacity-60"
          />

          <textarea
            value={draftDescription}
            onChange={(event) => setDraftDescription(event.target.value)}
            aria-label="Descripción de la playlist"
            rows={3}
            maxLength={200}
            placeholder="Descripción"
            className="TextRegluar mt-1 w-full rounded bg-(--ds-surface)/20 px-1 py-1 outline-none ring-0 ring-transparent focus-visible:ring-2 focus-visible:ring-ring resize-none placeholder:opacity-60"
          />
        </div>

        {!isMobile && canDelete && deleteButton('self-center py-2')}
      </div>

      {editError && <p className="Salmon TextMedium mt-2 rounded px-3 py-2">{editError}</p>}

      <div className="mt-2 flex gap-2">
        <button
          type="submit"
          disabled={savingEdit || !draftName.trim()}
          className="rounded px-4 py-2 Fucsia Button hover:brightness-110 disabled:opacity-50 disabled:hover:brightness-100"
        >
          {savingEdit ? 'Guardando…' : 'Guardar'}
        </button>
        <button
          type="button"
          onClick={handleCancelEdit}
          disabled={savingEdit}
          className="rounded px-4 py-2 Volume Button hover:brightness-110 disabled:opacity-50"
        >
          Cancelar
        </button>
      </div>

      {isMobile && canDelete && deleteButton('mt-2 w-full py-2')}
    </form>
  ) : null

  return (
    <header
      className={`-mx-6 flex px-6 py-10 md:-mx-10 md:px-10 ${
        isMobile
          ? 'flex-col items-start gap-6'
          : 'flex-row flex-wrap items-start gap-6 md:gap-10'
      } ${hasCoverImage ? 'HeaderGlow' : ''}`}
      style={hasCoverImage ? { '--cover-url': `url(${coverSrc})` } : undefined}
    >
      <motion.div
        ref={coverMenuRef}
        layout={!prefersReduced}
        transition={{ layout: { type: 'spring', stiffness: 500, damping: 45 } }}
        className={`relative shrink-0 ${isMobile ? 'self-center' : ''}`}
      >
        <div
          className={`CardRadius relative flex h-40 w-40 items-center justify-center sm:h-44 sm:w-44 ${
            hasCoverImage ? 'CoverGlow' : 'Light'
          }`}
          style={hasCoverImage ? { '--cover-url': `url(${coverSrc})` } : undefined}
        >
          {hasCoverImage ? (
            <img
              src={coverSrc}
              alt=""
              aria-hidden="true"
              className="CardRadius absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <img
              src={headphonesIcon}
              alt=""
              aria-hidden="true"
              className="h-10 w-10 opacity-70"
            />
          )}
        </div>

        <AnimatePresence initial={false}>
          {canUserEdit && !coverMenuOpen && !coverBusy && (
            <motion.button
              key="cover-hit"
              type="button"
              onClick={openCoverMenu}
              aria-label="Cambiar portada"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, pointerEvents: 'none' }}
              transition={prefersReduced ? { duration: 0 } : { duration: 0.18, ease: 'easeInOut' }}
              className="CardRadius absolute inset-0 cursor-pointer motion-safe:transition-colors hover:bg-foreground/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            />
          )}
        </AnimatePresence>

        <AnimatePresence initial={false}>
          {canUserEdit && coverMenuOpen && !coverBusy && (
            <motion.div
              key="cover-menu"
              initial={{ opacity: 0, scale: prefersReduced ? 1 : 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: prefersReduced ? 1 : 0.98 }}
              transition={prefersReduced ? { duration: 0 } : { duration: 0.18, ease: 'easeInOut' }}
              className="CardRadius absolute inset-0 flex items-center justify-center gap-2 bg-surface/70 backdrop-blur-sm"
            >
              <button
                type="button"
                autoFocus
                onClick={() => {
                  setCoverMenuOpen(false)
                  coverInputRef.current?.click()
                }}
                aria-label="Subir nueva portada"
                className="rounded-full p-2 text-foreground motion-safe:transition-colors hover:bg-foreground/10 focus-visible:bg-foreground/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <img src={cameraIcon} alt="" aria-hidden="true" className="h-6 w-6" />
              </button>

              {playlist?.coverUrl && (
                <button
                  type="button"
                  onClick={handleRemoveCover}
                  aria-label="Quitar portada"
                  className="rounded-full p-2 text-foreground motion-safe:transition-colors hover:bg-foreground/10 focus-visible:bg-foreground/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                >
                  <img src={trashIcon} alt="" aria-hidden="true" className="h-6 w-6" />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {coverBusy && (
          <div
            role="status"
            aria-label="Actualizando portada"
            className="CardRadius absolute inset-0 flex items-center justify-center bg-surface/70 backdrop-blur-sm"
          >
            <span className="size-6 animate-spin rounded-full border-2 border-current border-t-transparent text-foreground" />
          </div>
        )}

        {canUserEdit && (
          <input
            ref={coverInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handleCoverFileChange}
            disabled={coverBusy}
          />
        )}
      </motion.div>

      <motion.div
        layout={prefersReduced ? false : 'position'}
        transition={{ layout: { type: 'spring', stiffness: 500, damping: 45 } }}
        className={`relative z-10 min-w-0 ${isMobile ? 'w-full' : 'flex-1'}`}
      >
        {editing ? (
          editForm
        ) : (
          <>
            <div className="flex items-start gap-2">
              <h1 className="Header2 min-w-0 truncate">{playlist?.name}</h1>

              {canUserEdit && (
                <button
                  type="button"
                  onClick={handleStartEdit}
                  aria-label="Editar nombre y descripción"
                  className="mt-1 shrink-0 rounded opacity-60 transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                >
                  <img src={pencilLineIcon} alt="" aria-hidden="true" className="h-5 w-5" />
                </button>
              )}
            </div>

            <div className="mt-3 flex items-center gap-2">
              {hasMembers && (
                <AvatarStack
                  members={playlist.members}
                  onClick={canUserEdit ? () => onInvite?.() : undefined}
                  label="Ver participantes e invitar"
                />
              )}

              <img
                src={playlist?.isCollaborative ? userGroupIcon : userIcon}
                alt={playlist?.isCollaborative ? 'Playlist colaborativa' : 'Playlist personal'}
                className="ml-4 h-6 w-6 shrink-0"
              />

              <span aria-hidden="true" className="text-muted-foreground TextMedium">
                •
              </span>
              <p className="text-muted-foreground TextMedium font-bold">
                {visibleCount} {visibleCount === 1 ? 'canción' : 'canciones'}
              </p>
            </div>

            <p className="text-muted-foreground TextRegluar mt-3 w-full max-w-md break-words md:max-w-xl">
              {playlist?.description}
            </p>
          </>
        )}
      </motion.div>

      {!editing && (
        <motion.div
          layout={prefersReduced ? false : 'position'}
          transition={{ layout: { type: 'spring', stiffness: 500, damping: 45 } }}
          className={`relative z-10 flex flex-wrap items-center gap-2 ${
            isMobile ? 'w-full justify-end' : ''
          }`}
        >
          <button
            type="button"
            onClick={() => onPlay?.()}
            disabled={!onPlay}
            aria-label={`Reproducir ${playlist?.name ?? ''}`}
            className="Fucsia h-12 w-12 flex cursor-pointer items-center justify-center rounded-full transition duration-150 hover:brightness-80 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <img src={playIcon} alt="" aria-hidden="true" className="h-6 w-6" />
          </button>

          {!hasMembers && canUserEdit && onInvite ? (
            <button
              type="button"
              onClick={() => onInvite()}
              aria-label="Invitar personas"
              className="Volume TextRegluar flex h-9 w-9 items-center justify-center rounded-full hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              <span aria-hidden="true">+</span>
            </button>
          ) : null}
        </motion.div>
      )}
    </header>
  )
}
