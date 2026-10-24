import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  getRoomById,
  getPlayback,
  controlPlayback,
  closeRoom,
  kickMember,
  leaveRoom,
  voteSkip,
  rateHost,
} from '@synthos/shared'
import {
  connectSocket,
  joinRoomChannel,
  leaveRoomChannel,
  subscribeToRoomEvent,
} from '@synthos/shared'
import { useAuth } from '@synthos/shared'
import { usePlayer } from '@synthos/shared'
import { useRoomPlayback } from '@synthos/shared'
import Avatar from '../../components/ui/Avatar.jsx'
import ProgressBar from '../../components/player/ProgressBar.jsx'
import roomIcon from '../../assets/join_music_room.svg'
import nextTrackIcon from '../../assets/next_track.svg'
import playIcon from '../../assets/play.svg'
import pauseIcon from '../../assets/pause.svg'
import fullHeartIcon from '../../assets/full_heart.svg'
import emptyHeartIcon from '../../assets/empty_heart.svg'
import volumeOnIcon from '../../assets/volume_on.svg'
import volumeOffIcon from '../../assets/volume_off.svg'
import { mapApiError } from '@synthos/shared'

// Aviso que se muestra al volver al listado (expulsado, sala cerrada, salida).
// Va en `sessionStorage` porque la redirección cambia la ruta, no sobrevive un
// `useState` del componente que ya se estaba desmontando.
const NOTICE_KEY = 'synthos_room_notice'

const PLAYBACK_FALLBACK = {
  songId: null,
  status: 'stopped',
  positionMs: 0,
  updatedAt: 0,
}

// `ProgressBar` llama `onSeek` siempre, así que la barra de solo lectura necesita
// una función: una que no haga nada.
const NOOP = () => {}

/**
 * `/salas/:id`: la sala (TS-14 + TS-15 + TS-18).
 *
 * El reproductor es el global del `PlayerContext`: la sala no tiene `<audio>`
 * propio (regla 3). Esta pantalla solo pide el estado y deja que
 * `useRoomPlayback` lo aplique.
 *
 * Dos papeles con permisos distintos:
 * - el **anfitrión** controla la reproducción, expulsa y cierra la sala;
 * - el resto **vota para saltar**, sin poder cambiar el estado.
 *
 * Todas las acciones van por REST y el resultado llega por el socket, así que no
 * hay dos caminos para el mismo cambio de estado: el cliente nunca actualiza el
 * estado de la sala por su cuenta.
 */
export default function RoomView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const viewerId = String(user?.id ?? '')

  const [room, setRoom] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [notice] = useState(() => sessionStorage.getItem(NOTICE_KEY) ?? '')

  const [votes, setVotes] = useState({ voters: [], required: 0, hasVoted: false })
  const [rated, setRated] = useState(false)
  const [ratedAtLoad, setRatedAtLoad] = useState(false)
  const [actionError, setActionError] = useState('')
  const [pending, setPending] = useState('')

  const membership = room?.members.find((member) => member.userId === viewerId) ?? null
  const isHost = membership?.role === 'host'
  const host = room?.members.find((member) => member.role === 'host') ?? null

  const requestNext = useCallback(() => {
    controlPlayback(id, 'next').catch((cause) => setActionError(mapApiError(cause)))
  }, [id])

  // Va antes que el efecto de la sala de más abajo porque este es el que le pasa
  // `syncPlayback`: si el efecto se registrara primero, cerraría sobre un hook
  // que todavía no existía.
  const { playback, isBlocked, resume, sync: syncPlayback } = useRoomPlayback({
    roomId: id,
    songs: room?.songs,
    isHost,
    onEnded: requestNext,
  })

  // El aviso se consume una vez: si no, quedaría pegado en la pantalla.
  useEffect(() => {
    if (notice) sessionStorage.removeItem(NOTICE_KEY)
  }, [notice])

  useEffect(() => {
    let active = true

    setLoading(true)
    setLoadError('')

    getRoomById(id)
      .then((found) => {
        if (!active) return

        if (!found) {
          navigate('/salas', { replace: true })
          return
        }

        setRoom(found)
        setRatedAtLoad(Boolean(found.viewerHasRated))
        setLoaded(true)
        setLoading(false)
      })
      .catch((cause) => {
        if (!active) return

        setLoadError(mapApiError(cause))
        setLoading(false)
      })

    return () => {
      active = false
    }
  }, [id, navigate])

// Conexión al canal de la sala. El efecto depende de `loaded` y no de `room`: si
  // dependiera del objeto entero, cada `room:members` volvería a dispararlo y a
  // reconectar en bucle.
  //
  // `syncPlayback` es el mismo hook que atiende los eventos: el `GET` inicial se le
  // pasa por ahí para no tener dos caminos hacia el reproductor (si el estado
  // inicial solo se guardara en un state de la pantalla, entrar a una sala que ya
  // está sonando no arrancaría hasta que llegara el próximo evento).
  useEffect(() => {
    if (!loaded) return undefined

    let active = true

    connectSocket()
    joinRoomChannel(id)

    getPlayback(id)
      .then((data) => {
        if (!active) return

        syncPlayback(data.playback)
        setVotes(data.skipVotes)
      })
      .catch((cause) => {
        if (active) setActionError(mapApiError(cause))
      })

    function leaveWithNotice(message) {
      sessionStorage.setItem(NOTICE_KEY, message)
      navigate('/salas', { replace: true })
    }

    // El `room:playback` lo atiende `useRoomPlayback` (es el que mueve el
  // reproductor), así que acá no hay una suscripción aparte al mismo evento.

    // El servidor responde `joined-room` cada vez que el socket entra al canal, y
    // eso pasa también en cada reconexión. Es el momento de volver a pedir el
    // estado: si no, la sala quedaría mostrando lo último que se sabía antes de
    // que se cortara la conexión.
    const offJoined = subscribeToRoomEvent('joined-room', (payload) => {
      if (!active || Number(payload?.roomId) !== Number(id)) return

      getPlayback(id)
        .then((data) => {
          if (!active) return

          syncPlayback(data.playback)
          setVotes(data.skipVotes)
        })
        .catch(() => {
          // Si la sala se cerró mientras se estaba desconectado, el GET va a
          // fallar; el evento `room:closed` ya lo habrá traído de vuelta.
        })
    })

    const offMembers = subscribeToRoomEvent('room:members', (members) => {
      if (!active) return

      // Llega con las filas del backend, que traen `idUser` y el usuario anidado.
      const parsed = members.map((raw) => ({
        userId: String(raw.idUser ?? raw.id_user ?? raw.user?.id),
        username: raw.user?.username ?? '',
        avatarUrl: raw.user?.pictureUrl ?? null,
        role: raw.role,
      }))

      setRoom((current) =>
        current ? { ...current, members: parsed, membersCount: parsed.length } : current,
      )
    })

    const offSkip = subscribeToRoomEvent('room:skip-votes', (payload) => {
      if (!active) return

      const voters = (payload?.voters ?? []).map(String)

      setVotes({
        voters,
        required: Number(payload?.required ?? 0),
        hasVoted: voters.includes(viewerId),
      })
    })

    const offRating = subscribeToRoomEvent('room:rating', (payload) => {
      if (!active) return

      const avg = Number(payload?.avgRating ?? 0)

      setRoom((current) =>
        current ? { ...current, hostRating: avg === 0 ? null : avg } : current,
      )
    })

    const offKicked = subscribeToRoomEvent('room:kicked', () => {
      if (active) leaveWithNotice('Te sacaron de la sala.')
    })

    const offClosed = subscribeToRoomEvent('room:closed', () => {
      if (active) leaveWithNotice('La sala se cerró.')
    })

    return () => {
      active = false
      leaveRoomChannel(id)
      offJoined()
      offMembers()
      offSkip()
      offRating()
      offKicked()
      offClosed()
    }
  }, [id, loaded, navigate, viewerId, syncPlayback])

  // Hasta que el hook aplique el estado del `GET` inicial, se pinta el valor
  // neutro (parado): es lo que muestra una sala recién creada.
  const effectivePlayback = playback ?? PLAYBACK_FALLBACK
  const playing = effectivePlayback.status === 'playing'

  // Dos banderas distintas y no una:
  // - `canPlay`: hay con qué reproducir. La fuente puede no tener canciones, y el
  //   backend responde 400 en ese caso, así que no tiene sentido ofrecerlo.
  // - `hasSong`: hay algo sonando **ahora**. En una sala recién creada todavía no
  //   hay nada, y sin embargo es justo el estado en el que hay que poder arrancar.
  const canPlay = (room?.songs.length ?? 0) > 0
  const hasSong = Boolean(effectivePlayback.songId) && effectivePlayback.status !== 'stopped'

  /** Envuelve una acción: bloquea la pantalla, limpia el error y reporta fallos. */
  const runAction = useCallback(async (name, action) => {
    setPending(name)
    setActionError('')

    try {
      await action()
    } catch (cause) {
      setActionError(mapApiError(cause))
    } finally {
      setPending('')
    }
  }, [])

  function handleLeave() {
    if (!window.confirm('¿Salís de la sala?')) return

    runAction('leave', async () => {
      await leaveRoom(id)

      sessionStorage.setItem(
        NOTICE_KEY,
        isHost ? 'Cerraste la sala al salir.' : 'Saliste de la sala.',
      )
      navigate('/salas', { replace: true })
    })
  }

  function handleCloseRoom() {
    if (!window.confirm('¿Cerrás la sala? Se termina para todos.')) return

    runAction('close', async () => {
      await closeRoom(id)

      // Los demás reciben `room:closed`; quien la cerró ya está fuera.
      navigate('/salas', { replace: true })
    })
  }

  function handleVoteSkip() {
    runAction('vote', async () => {
      const result = await voteSkip(id)

      setVotes(result.skipVotes)
    })
  }

  function handleRate() {
    runAction('rate', async () => {
      // `rateHost` devuelve `false` (sin tirar) si el backend rechazó la
      // calificación por 403 o por 409, que es lo que deja el botón deshabilitado.
      setRated(await rateHost(id, 1))
    })
  }

  function handleKick(targetUserId, username) {
    if (!window.confirm(`¿Sacá a ${username} de la sala?`)) return

    runAction(`kick:${targetUserId}`, async () => {
      await kickMember(id, targetUserId)

      setRoom((current) =>
        current
          ? {
              ...current,
              members: current.members.filter((m) => m.userId !== targetUserId),
              membersCount: current.members.length - 1,
            }
          : current,
      )
    })
  }

  if (loading) {
    return (
      <section className="px-6 py-4 md:px-10">
        <p className="text-muted-foreground TextRegluar">Cargando la sala…</p>
      </section>
    )
  }

  if (loadError || !room) {
    return (
      <section className="px-6 py-4 md:px-10">
        {notice && (
          <p className="max-w-md rounded px-3 py-2 Volume TextMedium">{notice}</p>
        )}
        {loadError && (
          <p className="mt-4 max-w-md rounded px-3 py-2 Salmon TextMedium">{loadError}</p>
        )}
        <Link
          to="/salas"
          className="mt-4 inline-block rounded px-4 py-2 Volume Button hover:brightness-110"
        >
          Volver a las salas
        </Link>
      </section>
    )
  }

  const nonHostCount = room.members.filter((member) => member.role !== 'host').length
  // El servidor manda `required: 0` cuando limpia la votación (ya no hay nada que
  // aprobar), así que en ese caso el umbral se recalcula acá con la misma regla
  // de D17: más de la mitad de quienes no son anfitrión.
  const required = votes.required > 0 ? votes.required : Math.floor(nonHostCount / 2) + 1

  return (
    <section className="px-6 py-4 md:px-10">
      <Link to="/salas" className="text-muted-foreground TextMedium hover:text-foreground">
        ← Todas las salas
      </Link>

      <RoomHeader room={room} host={host} />

      {notice && (
        <p className="mt-4 max-w-2xl rounded px-3 py-2 Volume TextMedium">{notice}</p>
      )}

      {actionError && (
        <p className="mt-4 max-w-2xl rounded px-3 py-2 Salmon TextMedium">{actionError}</p>
      )}

      <RoomPlayer
        room={room}
        isHost={isHost}
        playing={playing}
        canPlay={canPlay}
        hasSong={hasSong}
        isBlocked={isBlocked}
        onResume={resume}
        onControl={(action) => runAction(action, () => controlPlayback(id, action))}
        controlPending={Boolean(pending)}
        votes={votes.voters.length}
        required={required}
        voted={votes.hasVoted}
        onVoteSkip={handleVoteSkip}
        voting={pending === 'vote'}
        rated={rated || ratedAtLoad}
        rating={pending === 'rate'}
        onRate={handleRate}
      />

      <RoomMembers
        room={room}
        viewerId={viewerId}
        isHost={isHost}
        onKick={handleKick}
      />

      <footer className="mt-8 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={handleLeave}
          disabled={Boolean(pending)}
          className="rounded px-4 py-2 Volume Button hover:brightness-110 disabled:opacity-50"
        >
          {isHost ? 'Salir y cerrar la sala' : 'Salir de la sala'}
        </button>

        {isHost && (
          <button
            type="button"
            onClick={handleCloseRoom}
            disabled={Boolean(pending)}
            className="rounded px-4 py-2 Salmon Button hover:brightness-110 disabled:opacity-50"
          >
            {pending === 'close' ? 'Cerrando…' : 'Cerrar la sala'}
          </button>
        )}
      </footer>
    </section>
  )
}

function RoomHeader({ room, host }) {
  return (
    <header className="mt-4 max-w-2xl rounded-lg p-6 SurfaceLight Elevation1">
      <div className="flex items-start gap-3">
        <div className="Light CardRadius flex h-12 w-12 shrink-0 items-center justify-center">
          <img src={roomIcon} alt="" aria-hidden="true" className="h-6 w-6 invert opacity-70" />
        </div>

        <div className="min-w-0 flex-1">
          <h1 className="text-foreground Header3 truncate">{room.name}</h1>
          <p className="text-muted-foreground TextMedium mt-1">
            Código <span className="TextFucsia">{room.code}</span>
            {room.isPrivate && <span className="TextTiny"> · privada</span>}
          </p>
        </div>
      </div>

      {room.description && (
        <p className="text-muted-foreground TextRegluar mt-4">{room.description}</p>
      )}

      <dl className="text-muted-foreground TextMedium mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div>
          <dt className="TextTiny">Anfitriona</dt>
          <dd className="text-foreground TextRegluar">{host?.username ?? '—'}</dd>
        </div>
        <div>
          <dt className="TextTiny">Personas</dt>
          <dd className="text-foreground TextRegluar">
            {room.members.length}/{room.maxCapacity ?? '—'}
          </dd>
        </div>
        <div>
          <dt className="TextTiny">Canciones</dt>
          <dd className="text-foreground TextRegluar">{room.songsCount}</dd>
        </div>
        {room.playlistName && (
          <div className="col-span-2 sm:col-span-3">
            <dt className="TextTiny">Playlist fuente</dt>
            <dd className="text-foreground TextRegluar truncate">{room.playlistName}</dd>
          </div>
        )}
      </dl>
    </header>
  )
}

/**
 * Reproductor de la sala.
 *
 * El nombre y la barra salen del reproductor global; el estado de la sala
 * (qué acción habilita cada botón) sale del servidor. Los controles de transporte
 * solo los tiene el anfitrión.
 */
function RoomPlayer({
  room,
  isHost,
  playing,
  canPlay,
  hasSong,
  isBlocked,
  onResume,
  onControl,
  controlPending,
  votes,
  required,
  voted,
  onVoteSkip,
  voting,
  rated,
  rating,
  onRate,
}) {
  const { song, currentTime, duration, seek, isMuted, toggleMute } = usePlayer()

  return (
    <div className="mt-6 max-w-2xl rounded-lg p-6 SurfaceLight Elevation1">
      <div className="flex items-center gap-3">
        <div className="Light CardRadius flex h-12 w-12 shrink-0 items-center justify-center">
          <img
            src={playing ? pauseIcon : playIcon}
            alt=""
            aria-hidden="true"
            className="h-5 w-5 invert opacity-80"
          />
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-foreground TextRegluar truncate">
            {song ? song.title : 'Nada reproduciendo'}
          </p>
          <p className="text-muted-foreground TextTiny truncate">
            {song ? song.artist : 'La sala todavía no empezó a reproducir'}
          </p>
        </div>

        {isHost && (
          <HostControls
            playing={playing}
            canPlay={canPlay}
            hasSong={hasSong}
            disabled={controlPending}
            onControl={onControl}
          />
        )}
      </div>

      <div className="mt-4">
        {/* La posición en una sala es del servidor: no hay endpoint para buscar
            dentro de la canción, así que solo el anfitrión puede arrastrar la
            barra. Para el resto es de lectura. */}
        <div className={isHost ? undefined : 'pointer-events-none'}>
          <ProgressBar
            currentTime={currentTime}
            duration={duration}
            onSeek={isHost ? seek : NOOP}
            size="sm"
          />
        </div>
      </div>

      {isBlocked && (
        <button
          type="button"
          onClick={onResume}
          className="mt-4 w-full rounded px-4 py-2 Fucsia Button hover:brightness-110"
        >
          Tocar para escuchar
        </button>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-sidebar-border pt-4">
        <SkipVoteControl
          isHost={isHost}
          votes={votes}
          required={required}
          voted={voted}
          hasSong={hasSong}
          onVote={onVoteSkip}
          pending={voting}
        />

        {/* Silencio local de quien mira la sala, también para el anfitrión: no
            viaja por el socket, así que no cambia el audio de los demás. */}
        <button
          type="button"
          onClick={toggleMute}
          aria-pressed={isMuted}
          title={
            isMuted
              ? 'Silenciaste este dispositivo. La sala sigue sonando para los demás.'
              : 'Silencia el audio solo en este dispositivo.'
          }
          className={`flex items-center gap-2 rounded px-3 py-2 Button hover:brightness-110 ${
            isMuted ? 'Fucsia' : 'Volume'
          }`}
        >
          <img
            src={isMuted ? volumeOffIcon : volumeOnIcon}
            alt=""
            aria-hidden="true"
            className="h-4 w-4"
          />
          {isMuted ? 'Activar sonido' : 'Silenciar'}
        </button>

        {!isHost && (
          <button
            type="button"
            onClick={onRate}
            disabled={rating || rated}
            title={
              room.hostRating === null
                ? 'Tu calificación se suma a la del anfitrión.'
                : undefined
            }
            className="ml-auto flex items-center gap-2 rounded px-3 py-2 Volume Button hover:brightness-110 disabled:opacity-50"
          >
            <img
              src={rated ? fullHeartIcon : emptyHeartIcon}
              alt=""
              aria-hidden="true"
              className="h-4 w-4"
            />
            {rated ? 'Calificaste al anfitrión' : 'Calificar al anfitrión'}
          </button>
        )}
      </div>
    </div>
  )
}

/**
 * Controles de reproducción del anfitrión.
 *
 * Cada botón se habilita por su cuenta, y esa es la parte que importa: una sala
 * recién creada está en `stopped` y ahí es exactamente cuando hay que poder
 * arrancar. Por eso "reproducir" y "siguiente" se disparan con `canPlay` (hay
 * canciones en la fuente) y no con "hay algo sonando", que en ese estado es
 * falso. "Detener" sí depende de que algo esté sonando.
 *
 * En el backend, `play` arranca la primera canción si estaba detenida y `next`
 * desde `songId: null` también cae en la primera, así que ambos arrancan la sala
 * desde cero.
 */
function HostControls({ playing, canPlay, hasSong, disabled, onControl }) {
  return (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => onControl(playing ? 'pause' : 'play')}
        disabled={disabled || !canPlay}
        aria-label={playing ? 'Pausar para todos' : 'Reproducir para todos'}
        title={
          canPlay
            ? undefined
            : 'La playlist fuente de la sala no tiene canciones para reproducir.'
        }
        className="rounded p-2 Volume Button hover:brightness-110 disabled:opacity-50"
      >
        <img
          src={playing ? pauseIcon : playIcon}
          alt=""
          aria-hidden="true"
          className="h-4 w-4 invert"
        />
      </button>

      <button
        type="button"
        onClick={() => onControl('next')}
        disabled={disabled || !canPlay}
        aria-label="Siguiente canción para todos"
        className="rounded p-2 Volume Button hover:brightness-110 disabled:opacity-50"
      >
        <img src={nextTrackIcon} alt="" aria-hidden="true" className="h-4 w-4 invert" />
      </button>

      <button
        type="button"
        onClick={() => onControl('stop')}
        disabled={disabled || !hasSong}
        aria-label="Detener la reproducción"
        className="rounded px-3 py-2 Volume Button hover:brightness-110 disabled:opacity-50"
      >
        Detener
      </button>
    </div>
  )
}

/**
 * Votación para saltar (TS-18).
 *
 * La mayoría se cuenta sobre quienes **no** son anfitrión (D17), así que el
 * anfitrión no ve el botón, solo el contador. El botón queda deshabilitado hasta
 * que cambie la canción, porque los votos se limpian al cambiar.
 */
function SkipVoteControl({ isHost, votes, required, voted, hasSong, onVote, pending }) {
  if (isHost) {
    return (
      <span className="text-muted-foreground TextTiny">
        Saltos por votación: {votes}/{required}
      </span>
    )
  }

  return (
    <button
      type="button"
      onClick={onVote}
      disabled={voted || !hasSong || pending}
      className="flex items-center gap-2 rounded px-3 py-2 Volume Button hover:brightness-110 disabled:opacity-50"
    >
      Votar para saltar
      <span className="text-muted-foreground TextTiny">
        {votes}/{required}
      </span>
    </button>
  )
}

function RoomMembers({ room, viewerId, isHost, onKick }) {
  const ordered = [...room.members].sort((a, b) => {
    if (a.role === 'host') return -1
    if (b.role === 'host') return 1

    return a.username.localeCompare(b.username, 'es', { sensitivity: 'base' })
  })

  return (
    <div className="mt-6 max-w-2xl">
      <h2 className="text-foreground Header4">
        Personas ({room.members.length}/{room.maxCapacity ?? '—'})
      </h2>

      <ul className="mt-3 space-y-2">
        {ordered.map((member) => (
          <li
            key={member.userId}
            className="flex items-center gap-3 rounded-lg p-3 SurfaceLight Elevation1"
          >
            <Avatar name={member.username || '?'} className="h-8 w-8" />

            <div className="min-w-0 flex-1">
              <p className="text-foreground TextRegluar truncate">
                {member.username || 'Usuario'}{' '}
                {member.userId === viewerId && (
                  <span className="text-muted-foreground TextTiny">(vos)</span>
                )}
              </p>
              <p className="text-muted-foreground TextTiny">
                {member.role === 'host' ? 'Anfitriona · administra la sala' : 'Participante'}
              </p>
            </div>

            {isHost && member.role !== 'host' && (
              <button
                type="button"
                onClick={() => onKick(member.userId, member.username)}
                className="rounded px-3 py-1.5 Volume Button hover:brightness-110"
              >
                Sacar
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}