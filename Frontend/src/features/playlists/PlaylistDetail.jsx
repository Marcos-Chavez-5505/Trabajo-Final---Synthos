import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import useAuth from '../../hooks/useAuth.js'
import useFavorites from '../../hooks/useFavorites.js'
import usePlayer from '../../hooks/usePlayer.js'
import Avatar from '../../components/ui/Avatar.jsx'
import { getSongById } from '../../services/songsService.js'
import {
  getPlaylistById,
  listSentInvitations,
  removePlaylist,
  removePlaylistMember,
  removeSongFromPlaylist,
  updatePlaylist,
} from '../../services/playlistsService.js'
import musicNoteIcon from '../../assets/music_note.svg'
import PlaylistSongRow from './PlaylistSongRow.jsx'
import PlaylistEditForm from './PlaylistEditForm.jsx'
import InviteUserDialog from './InviteUserDialog.jsx'
import { mapApiError } from '../../utils/mapError.js'

/**
 * Detalle de una playlist (TS-09): reproducir, quitar canciones, renombrar y
 * eliminar.
 *
 * La playlist guarda `songIds` y las canciones salen de `/api/songs/:id`, así
 * que el detalle las resuelve con `Promise.all`. Se pide una por id porque el
 * backend no expone `GET /api/songs?ids=`; cuando lo tenga, este bloque es el
 * único que hay que cambiar.
 *
 * Si `getPlaylistById` devuelve `null` es porque la playlist es de otro usuario o
 * no existe. En los dos casos se muestra "no encontrada", sin revelar cuál.
 *
 * Las respuestas se guardan con la key que las pidió (userId+id, y los ids de las
 * canciones para la resolución) en vez de setear booleanos de loading: quitar
 * una canción vuelve a resolver solo lo que cambió, sin pisar el estado de la
 * playlist, y no se ve un resultado viejo con los datos nuevos.
 */
export default function PlaylistDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { playSongs, removeFromPlaylistQueue, clearQueueIfSource } = usePlayer()
  const { isFavorite } = useFavorites()

  const userId = user?.id ?? null

  const [playlistResponse, setPlaylistResponse] = useState({ key: null, playlist: null })
  const [songsResponse, setSongsResponse] = useState({ key: null, songs: [] })
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

  // La resolución de canciones se dispara sola cuando cambia el conjunto de ids.
  const songIdsKey = playlist ? playlist.songIds.join(',') : null

  useEffect(() => {
    if (!songIdsKey) return undefined

    const songIds = songIdsKey.split(',')

    let active = true

    Promise.all(songIds.map((songId) => getSongById(songId).catch(() => null)))
      .then((songs) => {
        if (active) setSongsResponse({ key: songIdsKey, songs })
      })
      .catch((cause) => {
        if (active) setError(mapApiError(cause))
      })

    return () => {
      active = false
    }
  }, [songIdsKey])

  const isSongsCurrent = songsResponse.key === songIdsKey
  const songs = isSongsCurrent ? songsResponse.songs : []
  const playable = songs.filter(Boolean)
  const missing = songs.filter((song) => song === null).length
  const resolving = Boolean(songIdsKey) && !isSongsCurrent

  async function handleRemoveSong(songId) {
    try {
      const updated = await removeSongFromPlaylist(userId, id, songId)

      // Solo si el backend confirmó el borrado: la cola nunca puede quedar más
      // sincronizada que el servidor.
      if (updated) {
        setPlaylistResponse({ key: `${userId}:${id}`, playlist: updated })

        // Solo si la cola es de esta playlist: si lo que suena es el catálogo, la
        // búsqueda u otra playlist, esta canción sigue siendo válida ahí.
        removeFromPlaylistQueue(songId, id)
      }
    } catch (cause) {
      setError(mapApiError(cause))
    }
  }

  async function handleDelete() {
    // Confirmación nativa: borrar una playlist no tiene vuelta atrás y el
    // service no expone nada para deshacerlo.
    const confirmed = window.confirm(
      `¿Eliminar "${playlist.name}"? No se puede deshacer.`
    )

    if (!confirmed) return

    const deleted = await removePlaylist(userId, id)

    if (deleted) {
      // Si la playlist era la que estaba sonando, sus canciones ya no existen:
      // la cola se vacía en vez de quedar con una copia huérfana. No-op si lo que
      // sonaba era el catálogo, la búsqueda u otra playlist.
      clearQueueIfSource(id)
      navigate('/playlists')
    }
  }

  async function handleInvited(result) {
    // Invitar convierte una playlist personal en colaborativa, así que hay que
    // recargarla: de eso dependen la marca, los participantes y qué acciones hay.
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

  return (
    <section className="px-6 py-4 md:px-10">
      {loading ? (
        <p className="text-muted-foreground TextRegluar">Cargando…</p>
      ) : !playlist ? (
        <NotFound />
      ) : (
        <>
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

                {/* Editar y borrar son del creador (D9). En una colaborativa los
                    participantes solo agregan y quitan canciones. */}
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
              Se creó sola cuando marcaste tu primera canción favorita. Para
              cambiarla, usá el corazón en cada canción.
            </p>
          )}

          {resolving && (
            <p className="text-muted-foreground TextRegluar mt-8">Buscando canciones…</p>
          )}

          {!resolving && playlist.songIds.length === 0 && (
            <EmptyPlaylist isFavorites={playlist.isFavorites} />
          )}

          {!resolving && playable.length > 0 && (
            <ul className="mt-8 flex flex-col gap-2">
              {songs.map((song, index) => (
                <li key={song?.id ?? `missing-${playlist.songIds[index]}`}>
                  {song === null ? (
                    <UnavailableRow />
                  ) : (
                    <PlaylistSongRow
                      song={song}
                      index={index}
                      isFavorite={isFavorite(song.id)}
                      onPlay={() =>
                        playSongs(
                          playable,
                          // `index` es la posición en `songs`, que puede tener
                          // huecos (`null`) por canciones que el backend ya no
                          // conoce. La cola arranca desde `playable`, así que hay
                          // que translating a esa posición o se reproduce otra.
                          songs.slice(0, index).filter(Boolean).length,
                          {
                            playlistId: id,
                            isFavorites: Boolean(playlist.isFavorites),
                          }
                        )
                      }
                      onRemove={() => handleRemoveSong(song.id)}
                      canRemove={playlist.role !== null}
                    />
                  )}
                </li>
              ))}
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
        </>
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
