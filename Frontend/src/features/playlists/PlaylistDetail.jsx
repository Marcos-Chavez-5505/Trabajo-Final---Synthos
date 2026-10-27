import { useCallback, useEffect, useRef, useState, memo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '@synthos/shared'
import { useFavorites } from '@synthos/shared'
import { usePlayer } from '@synthos/shared'
import Avatar from '../../components/ui/Avatar.jsx'
import { getSongById } from '@synthos/shared'
import {
  getPlaylistById,
  listSentInvitations,
  removePlaylist,
  removePlaylistMember,
  removeSongFromPlaylist,
  updatePlaylist,
  updatePlaylistSongsOrder,
  updateFavoritesOrder,
} from '@synthos/shared'
import { useReorderSongs, DRAG_SCALE, NEIGHBOR_SEPARATION, DRAG_SPRING, DRAG_SETTLE_SPRING } from '@synthos/shared'
import musicNoteIcon from '../../assets/music_note.svg'
import PlaylistSongRow from './PlaylistSongRow.jsx'
import PlaylistEditForm from './PlaylistEditForm.jsx'
import InviteUserDialog from './InviteUserDialog.jsx'
import { motion, useMotionValue, useReducedMotion } from 'motion/react'
import { animate } from 'framer-motion'

const MemoPlaylistSongRow = memo(PlaylistSongRow)

export default function PlaylistDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { playSongs, removeFromPlaylistQueue, clearQueueIfSource } = usePlayer()
  const { isFavorite } = useFavorites()

  const userId = user?.id ?? null

  const [playlistResponse, setPlaylistResponse] = useState({ key: null, playlist: null })
  const [songMapResponse, setSongMapResponse] = useState({ key: null, map: new Map() })
  const [invitations, setInvitations] = useState([])
  const [inviting, setInviting] = useState(false)
  const [editing, setEditing] = useState(false)
  const [error, setError] = useState('')

  const playlist = playlistResponse.key === `${userId}:${id}` ? playlistResponse.playlist : null
  const loading = userId !== null && playlistResponse.key !== `${userId}:${id}`
  const isCreator = playlist?.role === 'creator'

  const loadPlaylist = useCallback(() => {
    if (!userId) return Promise.resolve()

    return getPlaylistById(userId, id).then(
      (loaded) => setPlaylistResponse({ key: `${userId}:${id}`, playlist: loaded }),
      (cause) => setError(mapApiError(cause))
    )
  }, [userId, id])

  useEffect(() => {
    loadPlaylist()
  }, [loadPlaylist])

  const loadInvitations = useCallback(() => {
    if (!userId || !playlist || playlist.role !== 'creator') return Promise.resolve()

    return listSentInvitations(userId, id)
      .then(setInvitations)
      .catch((cause) => setError(mapApiError(cause)))
  }, [userId, id, playlist])

  useEffect(() => {
    loadInvitations()
  }, [loadInvitations])

  // Resolución de canciones por conjunto estable de ids (no se re-pide al reordenar).
  const songIdsKey = playlist ? [...playlist.songIds].map(String).sort().join(',') : null

  useEffect(() => {
    if (!songIdsKey) return undefined

    const ids = songIdsKey.split(',').filter(Boolean)

    let active = true

    Promise.all(ids.map((songId) => getSongById(songId).catch(() => null)))
      .then((songs) => {
        if (active) {
          const map = new Map()
          ids.forEach((sid, i) => map.set(sid, songs[i]))
          setSongMapResponse({ key: songIdsKey, map })
        }
      })
      .catch((cause) => {
        if (active) setError(mapApiError(cause))
      })

    return () => {
      active = false
    }
  }, [songIdsKey])

  const isSongsCurrent = songMapResponse.key === songIdsKey
  const songById = isSongsCurrent ? songMapResponse.map : new Map()
  const resolving = Boolean(songIdsKey) && !isSongsCurrent

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
    setError(mapApiError(cause))
  }, [])

  const { order, reorder, flush } = useReorderSongs({
    initialOrder: playlist?.songIds ?? [],
    saveOrder,
    onMerged: handleMerged,
    onError: handleReorderError,
  })

  const orderedSongs = order.map((sid) => songById.get(String(sid)) ?? null)
  const playable = orderedSongs.filter(Boolean)
  const missing = orderedSongs.filter((s) => s === null).length

  // --- drag & drop (pointer events) ---
  const listRef = useRef(null)
  const dragRef = useRef(null)
  const indicatorRef = useRef(null)
  const rowRefs = useRef(new Map())
  const neighborsRef = useRef({ above: null, below: null })

  const prefersReduced = useReducedMotion()
  const draggedIdState = useState(null)
  const draggedId = draggedIdState[0]
  const setDraggedId = draggedIdState[1]

  const dragX = useMotionValue(0)
  const dragY = useMotionValue(0)
  const dragScale = useMotionValue(1)
  const [isDragging, setIsDragging] = useState(false)

  const handleDragPointerDown = useCallback(
    (event, songId) => {
      if (!canReorder) return
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
    [canReorder, order, dragScale, dragX, dragY, prefersReduced, setDraggedId]
  )

  useEffect(() => {
    if (!isDragging) return undefined
    const d0 = dragRef.current
    if (!d0) return undefined

    const rows = Array.from(listRef.current.querySelectorAll('[data-row]'))
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
      console.log('onMove', { offset, dragY: dragY.get() })
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

  async function handleRemoveSong(songId) {
    try {
      const updated = await removeSongFromPlaylist(userId, id, songId)

      if (updated) {
        setPlaylistResponse({ key: `${userId}:${id}`, playlist: updated })

        removeFromPlaylistQueue(songId, id)
      }
    } catch (cause) {
      setError(mapApiError(cause))
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(`¿Eliminar "${playlist.name}"? No se puede deshacer.`)
    if (!confirmed) return

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

  async function handleRemoveMember(memberId) {
    if (!window.confirm('¿Sacar a esta persona de la playlist?')) return

    try {
      await removePlaylistMember(userId, id, memberId)
      await loadPlaylist()
      loadInvitations()
    } catch (cause) {
      setError(mapApiError(cause))
    }
  }

  async function handleUpdate({ name, description }) {
    const updated = await updatePlaylist(userId, id, { name, description })

    if (updated) {
      setPlaylistResponse({ key: `${userId}:${id}`, playlist: updated })
      setEditing(false)
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

  return (
    <section className="px-6 py-4 md:px-10">
      <header className="flex flex-wrap items-start gap-4">
        <div className="min-w-0 flex-1">
          {editing ? (
            <PlaylistEditForm
              initialName={playlist.name}
              initialDescription={playlist.description}
              onSave={handleUpdate}
              onCancel={() => setEditing(false)}
            />
          ) : (
            <>
              <h1 className="Header3 truncate">{playlist.name}</h1>
              <p className="text-muted-foreground TextRegluar mt-1">
                {playlist.description || 'Sin descripción.'}
              </p>
              <p className="text-muted-foreground TextMedium mt-1">
                {playlist.songIds.length}{' '}
                {playlist.songIds.length === 1 ? 'canción' : 'canciones'}
              </p>

              {playlist.isCollaborative && (
                <p className="TextFucsia TextMedium mt-1">
                  {playlist.role === 'creator'
                    ? 'Colaborativa. Vos sos quien la creó.'
                    : `Colaborativa. La creó ${playlist.creator.username || 'alguien'}.`}
                </p>
              )}
            </>
          )}
        </div>

        {!editing && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() =>
                playSongs(playable, 0, {
                  playlistId: id,
                  isFavorites: Boolean(playlist.isFavorites),
                })
              }
              disabled={playable.length === 0}
              className="rounded px-4 py-2 Fucsia Button hover:brightness-110 disabled:opacity-50 disabled:hover:brightness-100"
            >
              Reproducir
            </button>

            {!playlist.isFavorites && isCreator && (
              <>
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  className="rounded px-4 py-2 Volume Button hover:brightness-110"
                >
                  Editar
                </button>

                <button
                  type="button"
                  onClick={handleDelete}
                  className="rounded px-4 py-2 Volume Button hover:brightness-110"
                >
                  Eliminar
                </button>
              </>
            )}

            {isCreator && !playlist.isFavorites && (
              <button
                type="button"
                onClick={() => setInviting(true)}
                className="rounded px-4 py-2 Volume Button hover:brightness-110"
              >
                Invitar
              </button>
            )}
          </div>
        )}
      </header>

      {isCreator && !playlist.isFavorites && (
        <InviteUserDialog
          open={inviting}
          onOpenChange={setInviting}
          playlistId={id}
          userId={userId}
          isCollaborative={playlist.isCollaborative}
          excludeIds={[
            ...playlist.members.map((member) => member.id),
            ...invitations.map((invitation) => invitation.receiver.id),
          ]}
          onInvited={handleInvited}
        />
      )}

      {error && <p className="mt-6 rounded px-3 py-2 Salmon TextMedium">{error}</p>}

      {playlist.isFavorites && !editing && (
        <p className="text-muted-foreground TextMedium mt-4">
          Se creó sola cuando marcaste tu primera canción favorita. Para cambiarla, usá el corazón en cada canción.
        </p>
      )}

      {resolving && <p className="text-muted-foreground TextRegluar mt-8">Buscando canciones…</p>}

      {!resolving && playlist.songIds.length === 0 && <EmptyPlaylist isFavorites={playlist.isFavorites} />}

      {!resolving && orderedSongs.length > 0 && (
        <ul ref={listRef} className="mt-8 flex flex-col gap-2" style={{ position: 'relative' }}>
          {orderedSongs.map((song, index) => {
            const sid = order[index]
            const isDragged = draggedId === sid
            return (
              <motion.li
                key={sid}
                ref={(el) => {
                  if (el) rowRefs.current.set(sid, el)
                  else rowRefs.current.delete(sid)
                }}
                data-row={sid}
                style={isDragged ? { x: dragX, y: dragY, scale: dragScale, zIndex: 10, position: 'relative' } : undefined}
              >
                {song === null ? (
                  <UnavailableRow />
                ) : (
                  <MemoPlaylistSongRow
                    song={song}
                    index={index}
                    isFavorite={isFavorite(song.id)}
                    onPlay={() =>
                      playSongs(
                        playable,
                        orderedSongs.slice(0, index).filter(Boolean).length,
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
          <div ref={indicatorRef} style={{ display: 'none', position: 'absolute', left: 0, right: 0, height: 2, background: 'rgb(217 70 239)', borderRadius: 1, pointerEvents: 'none' }} />
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

      {isCreator && invitations.length > 0 && (
        <section className="mt-10">
          <h2 className="Header4">Invitaciones</h2>
          <ul className="mt-4 flex flex-col gap-2">
            {invitations.map((invitation) => (
              <li key={invitation.receiver.id}>
                <div className="SurfaceLight CardRadius flex items-center gap-3 px-4 py-2">
                  <Avatar
                    src={invitation.receiver.avatarUrl}
                    name={invitation.receiver.username}
                    className="h-9 w-9"
                  />

                  <p className="text-foreground TextRegluar min-w-0 flex-1 truncate">
                    {invitation.receiver.username}
                  </p>

                  <span className="text-muted-foreground TextTiny">
                    {invitation.status === 'pendiente'
                      ? 'Pendiente'
                      : invitation.status === 'aceptada'
                        ? 'Aceptó'
                        : 'Rechazó'}
                  </span>
                </div>
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
      <Avatar src={member.avatarUrl} name={member.username} className="h-9 w-9" />

      <p className="text-foreground TextRegluar min-w-0 flex-1 truncate">
        {member.username}
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
