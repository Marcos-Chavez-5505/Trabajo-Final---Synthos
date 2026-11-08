import { useCallback, useEffect, useRef, useState, memo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@synthos/shared'
import { useFavorites } from '@synthos/shared'
import { usePlayer } from '@synthos/shared'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog.tsx'
import Avatar from '@/components/ui/Avatar.jsx'
import AvatarStack from '@/components/ui/AvatarStack.jsx'
import { toastMessages } from '@/lib/toastMessages.js'
import { getSongById, mapApiError, resolvePlaylistCoverUrl } from '@synthos/shared'
import {
  getPlaylistById,
  listSentInvitations,
  removePlaylist,
  removePlaylistCover,
  removePlaylistMember,
  removeSongFromPlaylist,
  sendInvitation,
  updatePlaylist,
  uploadPlaylistCover,
  updatePlaylistSongsOrder,
  updateFavoritesOrder,
} from '@synthos/shared'
import { useReorderSongs } from '@synthos/shared'
import {
  DRAG_SCALE,
  DRAG_SCALE_X,
  NEIGHBOR_SEPARATION,
  DRAG_SPRING,
  DRAG_SETTLE_SPRING,
} from '@/lib/motion/drag.js'
import cameraIcon from '@synthos/shared/assets/icons/camera.svg'
import headphonesIcon from '@synthos/shared/assets/icons/headphones.svg'
import musicNoteIcon from '@synthos/shared/assets/icons/music_note.svg'
import pencilLineIcon from '@synthos/shared/assets/icons/pencil_line.svg'
import playIcon from '@synthos/shared/assets/icons/play.svg'
import trashIcon from '@synthos/shared/assets/icons/trash.svg'
import userIcon from '@synthos/shared/assets/icons/user.svg'
import userGroupIcon from '@synthos/shared/assets/icons/user_group.svg'
import PlaylistSongRow from '@/features/playlists/components/PlaylistSongRow.jsx'
import UserSearch from '@/features/search/components/UserSearch.jsx'
import useBreakpoint from '@/hooks/useBreakpoint.js'
import { prepareProfileImage } from '@/lib/images/prepareImage.js'
import { AnimatePresence, motion, useMotionValue, useReducedMotion, useTransform } from 'motion/react'
import { animate } from 'framer-motion'

const MemoPlaylistSongRow = memo(PlaylistSongRow)
const ROW_EXIT_MS = 150
const EXIT_TIMEOUT_MS = 400
const COVER_EDIT_TRANSITION = { duration: 0.18, ease: 'easeInOut' }

export default function PlaylistDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isMobile = useBreakpoint() === 'mobile'
  const { user } = useAuth()
  const { playSongs, removeFromPlaylistQueue, clearQueueIfSource } = usePlayer()
  const { isFavorite } = useFavorites()

  const userId = user?.id ?? null

  const [playlistResponse, setPlaylistResponse] = useState({ key: null, playlist: null })
  const [songById, setSongById] = useState(() => new Map())
  const [removingIds, setRemovingIds] = useState(() => new Set())
  const [hasExitingRow, setHasExitingRow] = useState(false)
  const [invitationsResponse, setInvitationsResponse] = useState({ key: null, items: [] })
  const [inviting, setInviting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draftName, setDraftName] = useState('')
  const [draftDescription, setDraftDescription] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [editError, setEditError] = useState('')
  const [coverMenuOpen, setCoverMenuOpen] = useState(false)
  const [coverBusy, setCoverBusy] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const coverMenuRef = useRef(null)
  const coverInputRef = useRef(null)

  const playlist = playlistResponse.key === `${userId}:${id}` ? playlistResponse.playlist : null
  const loading = userId !== null && playlistResponse.key !== `${userId}:${id}`
  const isCreator = playlist?.role === 'creator'

  const loadPlaylist = useCallback(() => {
    if (!userId) return Promise.resolve()

    return getPlaylistById(userId, id).then(
      (loaded) => setPlaylistResponse({ key: `${userId}:${id}`, playlist: loaded }),
      (cause) => toastMessages.playlistLoadError(cause)
    )
  }, [userId, id])

  useEffect(() => {
    loadPlaylist()
  }, [loadPlaylist])

  // El creador administra invitaciones también en playlists personales: puede
  // invitar cuando quiera (la playlist pasa a colaborativa) y, si vuelve a
  // quedar solo, las invitaciones pendientes siguen visibles.
  const canManageInvitations =
    Boolean(playlist) && playlist.role === 'creator' && !playlist.isFavorites
  const invitationsKey = `${userId}:${id}`
  const invitations =
    invitationsResponse.key === invitationsKey ? invitationsResponse.items : []

  const loadInvitations = useCallback(() => {
    if (!userId || !canManageInvitations) return Promise.resolve()

    return listSentInvitations(userId, id)
      .then((items) => setInvitationsResponse({ key: `${userId}:${id}`, items }))
      .catch((cause) => toastMessages.playlistInvitationsError(cause))
  }, [userId, id, canManageInvitations])

  useEffect(() => {
    loadInvitations()
  }, [loadInvitations])

  // Resolución de canciones por conjunto estable de ids (no se re-pide al reordenar).
  const songIdsKey = playlist ? [...playlist.songIds].map(String).sort().join(',') : null
  const songByIdRef = useRef(songById)

  useEffect(() => {
    songByIdRef.current = songById
  }, [songById])

  // Las canciones ya resueltas se conservan entre cambios de la playlist: quitar
  // una canción no vacía la lista ni vuelve a pedir las que siguen.
  useEffect(() => {
    if (!songIdsKey) return undefined

    const ids = songIdsKey.split(',').filter(Boolean)
    const pendingIds = ids.filter((songId) => {
      const cached = songByIdRef.current.get(songId)
      // Las que fallaron (null) se reintentan en el próximo cambio de la lista.
      return cached === undefined || cached === null
    })

    if (pendingIds.length === 0) return undefined

    let active = true

    Promise.all(pendingIds.map((songId) => getSongById(songId).catch(() => null)))
      .then((songs) => {
        if (!active) return

        setSongById((prev) => {
          const next = new Map(prev)
          pendingIds.forEach((sid, i) => next.set(sid, songs[i]))
          return next
        })
      })
      .catch((cause) => {
        if (active) toastMessages.playlistSongsError(cause)
      })

    return () => {
      active = false
    }
  }, [songIdsKey])

  const songIds = songIdsKey ? songIdsKey.split(',').filter(Boolean) : []
  const resolving = Boolean(songIdsKey) && songIds.some((sid) => !songById.has(sid))

  // Permiso para reordenar: el creador y los colaboradores (igual que agregar/quitar).
  const canReorder = Boolean(playlist) && playlist.role !== null

  const saveOrder = useCallback(
    async (ids, { keepalive } = {}) => {
      if (!playlist) throw new Error('No hay playlist cargada.')
      if (playlist.isFavorites) {
        return updateFavoritesOrder(userId, ids, { keepalive })
      }
      return updatePlaylistSongsOrder(userId, id, ids, { keepalive })
    },
    [playlist, userId, id]
  )

  const handleMerged = useCallback(() => {
    // El backend fusionó (alta o baja concurrente): recargamos para sincronizar.
    loadPlaylist()
  }, [loadPlaylist])

  const handleReorderError = useCallback((cause) => {
    toastMessages.playlistOrderError(cause)
  }, [])

  const { order, reorder, flush } = useReorderSongs({
    initialOrder: playlist?.songIds ?? [],
    saveOrder,
    onMerged: handleMerged,
    onError: handleReorderError,
  })

  // Portada: imagen subida > carátula de la primera canción del orden actual >
  // ícono. Mientras la canción se resuelve (o falló) se usa el ícono para no
  // parpadear. No se usa `songIdsKey` a propósito: el orden manda.
  const firstOrderedSong = order.length > 0 ? songById.get(String(order[0])) : null
  const firstOrderedCoverUrl = firstOrderedSong?.coverUrl ?? null
  const coverSrc =
    resolvePlaylistCoverUrl({
      coverUrl: playlist?.coverUrl,
      firstSongCoverUrl: firstOrderedCoverUrl,
    }) || headphonesIcon
  const hasCoverImage = Boolean(playlist?.coverUrl || firstOrderedCoverUrl)
  const canEditCover = Boolean(playlist) && isCreator && !playlist.isFavorites
  const hasMembers = Boolean(playlist?.members.length)

  const playlistIds = new Set((playlist?.songIds ?? []).map(String))
  const orderedEntries = order
    .map((sid) => ({ sid, song: songById.get(String(sid)) ?? null }))
    .filter(({ sid }) => playlistIds.has(String(sid)))
  const visibleRows = orderedEntries.filter(({ sid }) => !removingIds.has(String(sid)))
  const playable = visibleRows.map(({ song }) => song).filter(Boolean)
  const missing = visibleRows.filter(({ song }) => song === null).length

  const visibleCount = (playlist?.songIds ?? []).filter(
    (sid) => !removingIds.has(String(sid))
  ).length
  const orderIds = new Set(order.map(String))
  const orderInSync =
    orderIds.size === playlistIds.size && [...playlistIds].every((sid) => orderIds.has(sid))

  // --- drag & drop (pointer events) ---
  const listRef = useRef(null)
  const dragRef = useRef(null)
  const indicatorRef = useRef(null)
  const rowRefs = useRef(new Map())
  const neighborsRef = useRef({ above: null, below: null })
  const exitTimerRef = useRef(null)
  const settleTimerRef = useRef(null)
  const removalQueueRef = useRef(Promise.resolve())

  const prefersReduced = useReducedMotion()
  const draggedIdState = useState(null)
  const draggedId = draggedIdState[0]
  const setDraggedId = draggedIdState[1]

  const dragX = useMotionValue(0)
  const dragY = useMotionValue(0)
  const dragScale = useMotionValue(1)
  const dragScaleX = useTransform(dragScale, [1, DRAG_SCALE], [1, DRAG_SCALE_X], { clamp: false })
  const [isDragging, setIsDragging] = useState(false)
  const [isSettling, setIsSettling] = useState(false)

  useEffect(
    () => () => {
      clearTimeout(exitTimerRef.current)
      clearTimeout(settleTimerRef.current)
    },
    []
  )

  const handleDragPointerDown = useCallback(
    (event, songId) => {
      if (!canReorder || removingIds.size > 0 || hasExitingRow) return
      event.preventDefault()
      event.stopPropagation()
      try {
        event.currentTarget.setPointerCapture(event.pointerId)
      } catch {
        /* ignore */
      }

      const row = event.currentTarget.closest('[data-row]')
      if (row) {
        row.style.zIndex = '10'
        row.style.position = 'relative'
        row.style.willChange = 'transform'
      }

      dragRef.current = {
        id: songId,
        pointerId: event.pointerId,
        startY: event.clientY,
        currentY: event.clientY,
        insertIndex: order.indexOf(songId),
      }
      dragX.set(0)
      dragY.set(0)
      if (prefersReduced) {
        dragScale.set(1)
      } else {
        dragScale.set(1)
        animate(dragScale, DRAG_SCALE, DRAG_SPRING)
      }
      setDraggedId(songId)
      setIsDragging(true)
    },
    [canReorder, order, dragScale, dragX, dragY, prefersReduced, setDraggedId, removingIds, hasExitingRow]
  )

  useEffect(() => {
    if (!isDragging) return undefined
    const d0 = dragRef.current
    if (!d0) return undefined

    const rows = Array.from(listRef.current.querySelectorAll('[data-row]')).filter(
      (r) => r.style.position !== 'absolute'
    )
    const baseRows = rows.filter((r) => Number(r.dataset.row) !== d0.id)
    const rects = baseRows.map((r) => {
      const rr = r.getBoundingClientRect()
      return { id: Number(r.dataset.row), top: rr.top, height: rr.height }
    })

    function computeInsertIndex(pointerY) {
      let pos = rects.length
      for (const r of rects) {
        if (pointerY < r.top + r.height / 2) {
          pos = rects.indexOf(r)
          break
        }
      }
      return pos
    }

    function getNeighbors(insertIndex) {
      const base = order.filter((x) => x !== d0.id)
      const above = insertIndex > 0 ? base[insertIndex - 1] : null
      const below = insertIndex < base.length ? base[insertIndex] : null
      return { above, below }
    }

    function updateIndicator(insertIndex) {
      const ind = indicatorRef.current
      const container = listRef.current
      if (!ind || !container) return
      if (rects.length === 0) {
        ind.style.display = 'none'
        return
      }
      const cRect = container.getBoundingClientRect()
      let top
      if (insertIndex >= rects.length) {
        const last = rects[rects.length - 1]
        top = last.top + last.height
      } else {
        top = rects[insertIndex].top
      }
      ind.style.top = `${top - cRect.top + container.scrollTop}px`
      ind.style.display = 'block'
    }

    function animateNeighbors(newAbove, newBelow) {
      if (prefersReduced) return
      const prev = neighborsRef.current
      for (const id of [prev.above, prev.below]) {
        if (id == null) continue
        const el = rowRefs.current.get(id)
        if (el) animate(el, { y: 0 }, DRAG_SPRING)
      }
      if (newAbove != null) {
        const el = rowRefs.current.get(newAbove)
        if (el) animate(el, { y: -NEIGHBOR_SEPARATION }, DRAG_SPRING)
      }
      if (newBelow != null && newBelow !== newAbove) {
        const el = rowRefs.current.get(newBelow)
        if (el) animate(el, { y: NEIGHBOR_SEPARATION }, DRAG_SPRING)
      }
      neighborsRef.current = { above: newAbove, below: newBelow }
    }

    // reset previous neighbors on drag start
    neighborsRef.current = { above: null, below: null }

    function onMove(event) {
      const dd = dragRef.current
      if (!dd) return
      const pointerY = event.clientY
      const offset = pointerY - dd.startY
      dragY.set(offset)
      const insertIndex = computeInsertIndex(pointerY)
      if (insertIndex !== dd.insertIndex) {
        dd.insertIndex = insertIndex
        const { above, below } = getNeighbors(insertIndex)
        animateNeighbors(above, below)
      }
      updateIndicator(insertIndex)

      const container = listRef.current
      const cRect = container.getBoundingClientRect()
      const edge = 40
      if (pointerY < cRect.top + edge) container.scrollTop -= 8
      else if (pointerY > cRect.bottom - edge) container.scrollTop += 8
    }

    function finish() {
      const dd = dragRef.current
      if (dd) {
        const draggedRow = rowRefs.current.get(dd.id) || listRef.current.querySelector(`[data-row="${dd.id}"]`)
        const from = order.indexOf(dd.id)
        const to = dd.insertIndex
        // settle
        if (prefersReduced) {
          dragScale.set(1)
          dragY.set(0)
        } else {
          animate(dragScale, 1, DRAG_SETTLE_SPRING)
          animate(dragY, 0, DRAG_SETTLE_SPRING)
        }
        // reset neighbors
        const prev = neighborsRef.current
        for (const id of [prev.above, prev.below]) {
          if (id == null) continue
          const el = rowRefs.current.get(id)
          if (el) animate(el, { y: 0 }, prefersReduced ? { duration: 0 } : DRAG_SETTLE_SPRING)
        }
        neighborsRef.current = { above: null, below: null }
        if (indicatorRef.current) indicatorRef.current.style.display = 'none'
        if (draggedRow) {
          draggedRow.style.zIndex = ''
          draggedRow.style.position = ''
          draggedRow.style.willChange = ''
        }
        if (from !== -1 && from !== to) {
          const base = order.filter((x) => x !== dd.id)
          const insertAt = Math.min(Math.max(to, 0), base.length)
          const next = [...base]
          next.splice(insertAt, 0, dd.id)
          reorder(next)
        }
      }
      dragRef.current = null
      setDraggedId(null)
      setIsDragging(false)

      // Deja que el settle de las vecinas termine antes de reactivar el layout,
      // para que no compitan dos animaciones sobre el mismo transform.
      if (!prefersReduced) {
        setIsSettling(true)
        clearTimeout(settleTimerRef.current)
        settleTimerRef.current = setTimeout(() => setIsSettling(false), 200)
      }
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', finish)
    window.addEventListener('pointercancel', finish)
    const onKey = (ev) => {
      if (ev.key === 'Escape') finish()
    }
    window.addEventListener('keydown', onKey)

    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', finish)
      window.removeEventListener('pointercancel', finish)
      window.removeEventListener('keydown', onKey)
    }
  }, [isDragging, order, reorder, prefersReduced, dragY, dragScale, setDraggedId])

  // Quita optimista: la fila sale ya y el servidor confirma por detrás.
  // Las bajas se serializan para que los snapshots lleguen en orden.
  function handleRemoveSong(songId) {
    const key = String(songId)

    setRemovingIds((prev) => new Set(prev).add(key))

    if (!prefersReduced) {
      setHasExitingRow(true)
      clearTimeout(exitTimerRef.current)
      exitTimerRef.current = setTimeout(() => setHasExitingRow(false), EXIT_TIMEOUT_MS)
    }

    removalQueueRef.current = removalQueueRef.current
      .then(async () => {
        const updated = await removeSongFromPlaylist(userId, id, songId, {
          isFavorites: Boolean(playlist?.isFavorites),
        })

        if (!updated) throw new Error('No se pudo quitar la canción de la playlist.')

        setPlaylistResponse({ key: `${userId}:${id}`, playlist: updated })
        setRemovingIds((prev) => {
          if (!prev.has(key)) return prev
          const next = new Set(prev)
          next.delete(key)
          return next
        })
        removeFromPlaylistQueue(songId, id)
      })
      .catch((cause) => {
        setRemovingIds((prev) => {
          if (!prev.has(key)) return prev
          const next = new Set(prev)
          next.delete(key)
          return next
        })
        toastMessages.songRemoveError(cause)
      })
  }

  // Mueve una canción a una posición (1-based) dentro de la lista visible.
  function handleMoveSong(songId, position) {
    if (!Number.isFinite(position)) return

    const visibleIds = visibleRows.map(({ sid }) => sid)
    const from = visibleIds.findIndex((sid) => String(sid) === String(songId))
    if (from === -1) return

    const to = Math.min(Math.max(Math.trunc(position) - 1, 0), visibleIds.length - 1)
    if (to === from) return

    const sid = visibleIds[from]
    const nextVisible = [...visibleIds]
    nextVisible.splice(from, 1)
    nextVisible.splice(to, 0, sid)

    // Los ids ocultos (quitas pendientes) conservan su lugar en el orden guardado.
    const visibleSet = new Set(visibleIds.map(String))
    let cursor = 0
    const nextOrder = order.map((id) =>
      visibleSet.has(String(id)) ? nextVisible[cursor++] : id
    )

    reorder(nextOrder)
  }

  const handleExitComplete = useCallback(() => {
    clearTimeout(exitTimerRef.current)
    setHasExitingRow(false)
  }, [])

  async function handleDelete() {
    setDeleteOpen(false)

    const deleted = await removePlaylist(userId, id)

    if (deleted) {
      clearQueueIfSource(id)
      navigate('/playlists')
    }
  }

  async function handleInvited(result) {
    if (result.converted) await loadPlaylist()
    loadInvitations()
  }

  async function handleInvite(person) {
    const result = await sendInvitation(userId, id, person.id)
    await handleInvited(result)
  }

  async function handleRemoveMember(memberId) {
    if (!window.confirm('¿Sacar a esta persona de la playlist?')) return

    try {
      await removePlaylistMember(userId, id, memberId)
      await loadPlaylist()
      loadInvitations()
    } catch (cause) {
      toastMessages.playlistMemberRemoveError(cause)
    }
  }

  async function handleUpdate({ name, description }) {
    const updated = await updatePlaylist(userId, id, { name, description })

    if (updated) {
      setPlaylistResponse({ key: `${userId}:${id}`, playlist: updated })
      setEditing(false)
    }
  }

  function handleStartEdit() {
    setDraftName(playlist.name)
    setDraftDescription(playlist.description ?? '')
    setEditError('')
    setEditing(true)
  }

  function handleCancelEdit() {
    if (savingEdit) return
    setEditError('')
    setEditing(false)
  }

  async function handleSaveEdit(event) {
    event.preventDefault()

    if (savingEdit) return

    const name = draftName.trim()
    if (!name) return

    setEditError('')
    setSavingEdit(true)

    try {
      await handleUpdate({ name, description: draftDescription })
    } catch (cause) {
      setEditError(mapApiError(cause))
    } finally {
      setSavingEdit(false)
    }
  }

  function handleEditKeyDown(event) {
    if (event.key !== 'Escape' || savingEdit) return
    event.preventDefault()
    handleCancelEdit()
  }

  useEffect(() => {
    if (!coverMenuOpen) return undefined

    function onPointerDown(event) {
      if (!coverMenuRef.current?.contains(event.target)) setCoverMenuOpen(false)
    }

    function onKeyDown(event) {
      if (event.key === 'Escape') setCoverMenuOpen(false)
    }

    // Igual que los rieles de las filas: scrollear (o redimensionar) la cierra.
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
  }, [coverMenuOpen])

  async function handleCoverFileChange(event) {
    const file = event.target.files?.[0]

    event.target.value = ''

    if (!file || coverBusy) return

    setCoverMenuOpen(false)
    setCoverBusy(true)

    try {
      const prepared = await prepareProfileImage(file)
      const updated = await uploadPlaylistCover(userId, id, prepared)

      if (updated) setPlaylistResponse({ key: `${userId}:${id}`, playlist: updated })
    } catch (cause) {
      toastMessages.playlistCoverUploadError(cause)
    } finally {
      setCoverBusy(false)
    }
  }

  async function handleRemoveCover() {
    if (coverBusy || !playlist?.coverUrl) return

    setCoverMenuOpen(false)
    setCoverBusy(true)

    try {
      const updated = await removePlaylistCover(userId, id)

      if (updated) setPlaylistResponse({ key: `${userId}:${id}`, playlist: updated })
    } catch (cause) {
      toastMessages.playlistCoverRemoveError(cause)
    } finally {
      setCoverBusy(false)
    }
  }

  // Flush al desmontar y al ocultar la pestaña.
  useEffect(() => {
    function onVisibilityChange() {
      if (document.visibilityState === 'hidden') {
        const keepalive = true
        flush({ keepalive }).catch(() => {})
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      flush().catch(() => {})
    }
  }, [flush])

  useEffect(() => {
    function onPageHide() {
      flush({ keepalive: true }).catch(() => {})
    }
    window.addEventListener('pagehide', onPageHide)
    return () => window.removeEventListener('pagehide', onPageHide)
  }, [flush])

  if (loading) {
    return <p className="text-muted-foreground TextRegluar px-6 py-4">Cargando…</p>
  }
  if (!playlist) {
    return <NotFound />
  }

  const deletePlaylistButton = (
    <button
      type="button"
      onClick={() => setDeleteOpen(true)}
      className={`flex items-center justify-center gap-2 whitespace-nowrap rounded px-4 bg-(--ds-volume)/60 Button hover:brightness-110 ${
        isMobile ? 'mt-2 w-full py-2' : 'self-center py-2'
      }`}
    >
      <img src={trashIcon} alt="" aria-hidden="true" className="h-5 w-5 shrink-0" />
      <span className="flex flex-col items-start leading-tight">
        <span>Eliminar</span>
        <span>playlist</span>
      </span>
    </button>
  )

  return (
    <section className="px-6 pt-8 pb-6 md:px-10">
      <header
        className={`-mx-6 flex px-6 md:-mx-10 md:px-10 py-10 ${
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
            {canEditCover && !coverMenuOpen && !coverBusy && (
              <motion.button
                key="cover-hit"
                type="button"
                onClick={() => setCoverMenuOpen(true)}
                aria-label="Cambiar portada"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, pointerEvents: 'none' }}
                transition={prefersReduced ? { duration: 0 } : COVER_EDIT_TRANSITION}
                className="CardRadius absolute inset-0 cursor-pointer motion-safe:transition-colors hover:bg-foreground/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              />
            )}
          </AnimatePresence>

          <AnimatePresence initial={false}>
            {canEditCover && coverMenuOpen && !coverBusy && (
              <motion.div
                key="cover-menu"
                initial={{ opacity: 0, scale: prefersReduced ? 1 : 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: prefersReduced ? 1 : 0.98 }}
                transition={prefersReduced ? { duration: 0 } : COVER_EDIT_TRANSITION}
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
                  <img
                    src={cameraIcon}
                    alt=""
                    aria-hidden="true"
                    className="h-6 w-6"
                  />
                </button>

                {playlist.coverUrl && (
                  <button
                    type="button"
                    onClick={handleRemoveCover}
                    aria-label="Quitar portada"
                    className="rounded-full p-2 text-foreground motion-safe:transition-colors hover:bg-foreground/10 focus-visible:bg-foreground/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  >
                    <img
                      src={trashIcon}
                      alt=""
                      aria-hidden="true"
                      className="h-6 w-6"
                    />
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

          {canEditCover && (
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
            <form
              onSubmit={handleSaveEdit}
              onKeyDown={handleEditKeyDown}
              className="max-w-3xl"
            >
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

                {!isMobile && !playlist.isFavorites && isCreator && deletePlaylistButton}
              </div>

              {editError && (
                <p className="Salmon TextMedium mt-2 rounded px-3 py-2">{editError}</p>
              )}

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

              {isMobile && !playlist.isFavorites && isCreator && deletePlaylistButton}
            </form>
          ) : (
            <>
              <div className="flex items-start gap-2">
                <h1 className="Header2 min-w-0 truncate">{playlist.name}</h1>

                {isCreator && !playlist.isFavorites && (
                  <button
                    type="button"
                    onClick={handleStartEdit}
                    aria-label="Editar nombre y descripción"
                    className="mt-1 shrink-0 rounded opacity-60 transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
                  >
                    <img
                      src={pencilLineIcon}
                      alt=""
                      aria-hidden="true"
                      className="h-5 w-5"
                    />
                  </button>
                )}
              </div>

              <div className="mt-3 flex items-center gap-2">
                {hasMembers && (
                  <AvatarStack
                    members={playlist.members}
                    onClick={
                      isCreator && !playlist.isFavorites
                        ? () => setInviting(true)
                        : undefined
                    }
                    label="Ver participantes e invitar"
                  />
                )}

                <img
                  src={playlist.isCollaborative ? userGroupIcon : userIcon}
                  alt={playlist.isCollaborative ? 'Playlist colaborativa' : 'Playlist personal'}
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
                {playlist.description}
              </p>
            </>
          )}
        </motion.div>

        {!editing && (
          <motion.div
            layout={prefersReduced ? false : 'position'}
            transition={{ layout: { type: 'spring', stiffness: 500, damping: 45 } }}
            className={`relative z-10 flex flex-wrap items-center gap-2 ${isMobile ? 'w-full justify-end' : ''}`}
          >
            <button
              type="button"
              onClick={() =>
                playSongs(playable, 0, {
                  playlistId: id,
                  isFavorites: Boolean(playlist.isFavorites),
                })
              }
              disabled={playable.length === 0}
              aria-label={`Reproducir ${playlist.name}`}
              className="Fucsia h-12 w-12 flex cursor-pointer items-center justify-center rounded-full transition duration-150 hover:brightness-80 active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <img src={playIcon} alt="" aria-hidden="true" className="h-6 w-6" />
            </button>

            {!hasMembers && isCreator && !playlist.isFavorites && (
              <button
                type="button"
                onClick={() => setInviting(true)}
                aria-label="Invitar personas"
                className="Volume TextRegluar flex h-9 w-9 items-center justify-center rounded-full hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              >
                <span aria-hidden="true">+</span>
              </button>
            )}
          </motion.div>
        )}
      </header>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen} closeOnOutsideClick>
        <AlertDialogContent size="md">
          <AlertDialogHeader>
            <div className="AlertDialogRow items-center">
              <span
                aria-hidden="true"
                className="h-8 w-8 shrink-0 bg-(--ds-red)"
                style={{
                  maskImage: `url("${trashIcon}")`,
                  maskPosition: 'center',
                  maskRepeat: 'no-repeat',
                  maskSize: 'contain',
                  WebkitMaskImage: `url("${trashIcon}")`,
                  WebkitMaskPosition: 'center',
                  WebkitMaskRepeat: 'no-repeat',
                  WebkitMaskSize: 'contain',
                }}
              />
              <div className="AlertDialogTextBlock">
                <AlertDialogTitle>¿Eliminar playlist?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción no se puede deshacer.
                </AlertDialogDescription>
              </div>
            </div>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel size="lg" className="h-10 px-4">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              size="lg"
              className="h-10 px-4 bg-[var(--ds-red)] text-[var(--ds-lighter)] hover:bg-[var(--ds-red)]/80"
              onClick={handleDelete}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {isCreator && !playlist.isFavorites && (
        <UserSearch
          open={inviting}
          onOpenChange={setInviting}
          onSelect={handleInvite}
          userId={userId}
          title="Invitar a la playlist"
          description={
            playlist.isCollaborative
              ? 'Buscá a quien quieras sumar. Van a poder agregar y quitar canciones.'
              : 'Buscá a quien quieras sumar. Al invitar a alguien, la playlist deja de ser privada y pasa a ser colaborativa.'
          }
          actionLabel="Invitar"
          invitations={invitations}
          excludeIds={[
            ...playlist.members.map((member) => member.id),
            ...invitations.map((invitation) => invitation.receiver.id),
          ]}
        />
      )}

      {resolving && <p className="text-muted-foreground TextRegluar mt-8">Buscando canciones…</p>}

      {!resolving && !hasExitingRow && visibleRows.length === 0 && (playlist.songIds.length === 0 || orderInSync) && (
        <motion.div initial={prefersReduced ? false : { opacity: 0 }} animate={{ opacity: 1 }}>
          <EmptyPlaylist isFavorites={playlist.isFavorites} />
        </motion.div>
      )}

      {!resolving && (visibleRows.length > 0 || hasExitingRow) && (
        <ul ref={listRef} className="mt-8 flex flex-col gap-2" style={{ position: 'relative' }}>
          <AnimatePresence initial={false} mode="popLayout" onExitComplete={handleExitComplete}>
            {visibleRows.map(({ sid, song }, index) => {
              const isDragged = draggedId === sid
              return (
                <motion.li
                  key={sid}
                  ref={(el) => {
                    if (el) rowRefs.current.set(sid, el)
                    else rowRefs.current.delete(sid)
                  }}
                  data-row={sid}
                  layout={!isDragging && !isSettling && !prefersReduced}
                  initial={false}
                  exit={
                    prefersReduced
                      ? undefined
                      : {
                          opacity: 0,
                          scale: 0.98,
                          pointerEvents: 'none',
                          transition: { duration: ROW_EXIT_MS / 1000 },
                        }
                  }
                  transition={{ layout: { type: 'spring', stiffness: 500, damping: 45 } }}
                  style={isDragged ? { y: dragY, scaleX: dragScaleX, scaleY: dragScale, zIndex: 10, position: 'relative' } : undefined}
                >
                  {song === null ? (
                    <UnavailableRow />
                  ) : (
                    <MemoPlaylistSongRow
                      song={song}
                      index={index}
                      total={visibleRows.length}
                      isFavorite={isFavorite(song.id)}
                      onMoveTo={(position) => handleMoveSong(song.id, position)}
                      onPlay={() =>
                        playSongs(
                          playable,
                          visibleRows.slice(0, index).filter(({ song }) => song).length,
                          {
                            playlistId: id,
                            isFavorites: Boolean(playlist.isFavorites),
                          }
                        )
                      }
                      onRemove={() => handleRemoveSong(song.id)}
                      canRemove={playlist.role !== null}
                      canReorder={canReorder}
                      onDragHandlePointerDown={(e) => handleDragPointerDown(e, sid)}
                    />
                  )}
                </motion.li>
              )
            })}
          </AnimatePresence>
          <div ref={indicatorRef} style={{ display: 'none', position: 'absolute', left: 0, right: 0, height: 2, background: 'rgb(239, 47, 98)', borderRadius: 1, pointerEvents: 'none' }} />
        </ul>
      )}

      {!resolving && missing > 0 && (
        <p className="text-muted-foreground TextMedium mt-4">
          {missing}{' '}
          {missing === 1
            ? 'canción ya no está disponible y no se puede reproducir.'
            : 'canciones ya no están disponibles y no se pueden reproducir.'}
        </p>
      )}

      {playlist.isCollaborative && playlist.members.length > 0 && (
        <section className="mt-10">
          <h2 className="Header4">Participantes</h2>
          <ul className="mt-4 flex flex-col gap-2">
            {playlist.members.map((member) => (
              <li key={member.id}>
                <MemberRow
                  member={member}
                  canRemove={isCreator && member.role !== 'creator'}
                  onRemove={() => handleRemoveMember(member.id)}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

    </section>
  )
}

function MemberRow({ member, canRemove = false, onRemove }) {
  return (
    <div className="SurfaceLight CardRadius flex items-center gap-3 px-4 py-2">
      <Avatar
        src={member.avatarUrl}
        name={member.username}
        to={`/profile/${member.id}`}
        className="h-9 w-9"
      />

      <p className="text-foreground TextRegluar min-w-0 flex-1 truncate">
        <Link to={`/profile/${member.id}`} className="hover:underline">
          {member.username}
        </Link>
      </p>

      <span className="text-muted-foreground TextTiny">
        {member.role === 'creator' ? 'Creador' : 'Colaborador'}
      </span>

      {canRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Sacar a ${member.username} de la playlist`}
          title="Sacar de la playlist"
          className="shrink-0 rounded px-2 py-1 TextMedium hover:opacity-70"
        >
          Echar
        </button>
      )}
    </div>
  )
}

function EmptyPlaylist({ isFavorites }) {
  return (
    <div className="py-16 text-center">
      <img
        src={musicNoteIcon}
        alt=""
        aria-hidden="true"
        className="mx-auto h-10 w-10 invert opacity-50"
      />
      <p className="text-foreground Header4 mt-4">Esta playlist está vacía</p>
      <p className="text-muted-foreground TextRegluar mt-1">
        {isFavorites
          ? 'Marcá una canción como favorita y va a aparecer acá.'
          : 'Agregá canciones desde el reproductor o la búsqueda.'}
      </p>
    </div>
  )
}

/** Fila para una canción que el backend ya no conoce: no se puede reproducir. */
function UnavailableRow() {
  return (
    <div className="SurfaceLight CardRadius px-4 py-3">
      <span className="text-muted-foreground TextMedium">
        Esta canción ya no está disponible.
      </span>
    </div>
  )
}

function NotFound() {
  return (
    <div className="py-16 text-center">
      <p className="text-foreground Header4">No encontramos esa playlist</p>
      <p className="text-muted-foreground TextRegluar mt-1">
        Puede que la hayas eliminado, o que no sea tuya.
      </p>
      <Link to="/playlists" className="TextRegluar Volume mt-6 inline-block rounded px-4 py-2 hover:brightness-110">
        Volver a mis playlists
      </Link>
    </div>
  )
}