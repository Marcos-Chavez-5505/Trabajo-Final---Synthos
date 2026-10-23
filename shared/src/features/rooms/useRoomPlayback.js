import { useCallback, useEffect, useRef, useState } from 'react'
import usePlayer from '../../hooks/usePlayer.js'
import { subscribeToRoomEvent } from '../../services/socketService.js'

// Cada cuánto se corrige la deriva de posición contra el servidor.
const DRIFT_CHECK_MS = 2000

// Diferencia máxima tolerada entre el audio local y el servidor antes de saltar
// la posición. Charset grande y se nota el tirón; uno chico y no corrige nada.
const DRIFT_TOLERANCE_MS = 750

/**
 * Desvío del reloj de este dispositivo contra el del servidor, en milisegundos.
 *
 * Se calcula comparando el `Date.now()` local con el `serverTime` que el backend
 * manda en cada estado. Sin esto, interpolar la posición con
 * `positionMs + (Date.now() - updatedAt)` mezcla dos relojes: si el dispositivo
 * va 3 s adelantado, la posición calculada queda 3 s corrida y el reproductor se
 * arrastra detrás del resto de la sala sin que la corrección de deriva pueda
 * arreglarlo (ella también usa esa misma cuenta).
 */
let clockSkewMs = 0

function trackClockSkew(playback) {
  if (!playback?.serverTime) return

  clockSkewMs = Date.now() - playback.serverTime
}

/**
 * Posición real de la canción según el servidor.
 *
 * `positionMs` es la posición congelada en `updatedAt`. Mientras suena, la
 * posición avanza sola: es esa base más lo que pasó desde entonces **según el
 * reloj del servidor**, para lo cual se descuenta el desvío medido.
 *
 * @param {{status: string, positionMs: number, updatedAt: number}|null} playback
 * @returns {number} Milisegundos desde el comienzo de la canción.
 */
export function remotePositionMs(playback) {
  if (!playback) return 0

  if (playback.status !== 'playing') return playback.positionMs

  return playback.positionMs + (Date.now() - playback.updatedAt - clockSkewMs)
}

/**
 * Traduce el estado de reproducción del servidor al reproductor global (TS-15).
 *
 * El `<audio>` es único y global (regla 3 de AGENTS.md), así que la sala no tiene
 * reproductor propio: usa el mismo y le pasa la cola de la playlist fuente. Lo
 * que cambia es de dónde viene el estado: acá no se decide qué se reproduce, se
 * aplica lo que el anfitrión mandó.
 *
 * - Si cambia la canción del servidor, rearma la cola en esa posición.
 * - Si el estado es `playing`, el audio queda sonando; si es `paused`/`stopped`,
 *   queda pausado.
 * - Cada `DRIFT_CHECK_MS` compara la posición local con la del servidor y corrige
 *   si se pasaron de `DRIFT_TOLERANCE_MS`.
 * - Cuando termina una canción, en vez de avanzar el índice local se llama a
 *   `onEnded` (que pide el `next` al backend). Lo que llega de vuelta es el evento
 *   `room:playback` del servidor, igual que para el resto.
 *
 * @param {{roomId: string, songs: object[], isHost: boolean, onEnded?: () => void}} options
 *   `songs` es la cola de la playlist fuente de la sala, en el mismo orden que la
 *   que reprodujo el servidor (por `position`).
 * @returns {{playback: object|null, isBlocked: boolean, resume: () => void, sync: (playback: object) => void}}
 *   `isBlocked` es `true` cuando el servidor dice que suena pero el audio local
 *   está parado: pasa cuando el navegador bloquea el autoplay. `sync` aplica un
 *   estado puntual (el del `GET` inicial); los eventos ya se aplican solos.
 */
export default function useRoomPlayback({ roomId, songs, isHost, onEnded }) {
  const {
    playSongs,
    seek,
    togglePlay,
    pause,
    isPlaying: localIsPlaying,
    enterRoomMode,
    exitRoomMode,
    goIdle,
    setPlayBlocked,
    getAudioCurrentTime,
    hasAudio,
  } = usePlayer()

  const [playback, setPlayback] = useState(null)

  // El estado remoto también en un ref: el intervalo de deriva corre fuera del
  // ciclo de render y no debería leer de un estado viejo.
  const playbackRef = useRef(null)
  // `onEnded` llega en un closure del padre; el ref evita volver a armar la cola
  // cada vez que cambia.
  const onEndedRef = useRef(onEnded)

  useEffect(() => {
    onEndedRef.current = onEnded
  }, [onEnded])

  useEffect(() => {
    enterRoomMode()

    return () => {
      // El bloqueo se apaga al salir: sin sala, play/pause vuelve a ser del
      // cliente. Va acá y no en `exitRoomMode` para que el orden no dependa de
      // quién desmonta.
      setPlayBlocked(false)
      exitRoomMode()
      // Y el reproductor vuelve a idle. Esta pantalla se desmonta en los tres
      // motivos de salida (expulsado, sala cerrada y salida propia, más el
      // botón atrás): quien dejó de ser miembro ya no recibe `room:playback`,
      // así que seguir sonando es escuchar solo y desfasado. Antes de esto la
      // cola quedaba viva en el provider, que sobrevive a la navegación, y el
      // playerbar seguía mostrando una canción a la que no había acceso.
      goIdle()
    }
  }, [enterRoomMode, exitRoomMode, goIdle, setPlayBlocked])

  // Mientras la sala no esté sonando, arrancar el audio local está prohibido: si
  // el anfitrión pausó (o detuvo) la sala y alguien reproduce desde su barra, se
  // queda escuchando solo y desfasado, sin que nada lo corrija porque el
  // sincronizador de deriva solo actúa mientras el servidor dice `playing`.
  useEffect(() => {
    setPlayBlocked(playback ? playback.status !== 'playing' : false)
  }, [playback, setPlayBlocked])

  // `songs` entra por dependencia y no por ref a propósito: el primer
  // `room:playback` puede llegar antes de que un efecto haya copiado la lista
  // al ref, y con un ref vacío la sala se quedaba muda aunque la canción viniera.
  const applyRemote = useCallback(
    (nextPlayback) => {
      if (!nextPlayback) return

      trackClockSkew(nextPlayback)

      playbackRef.current = nextPlayback
      setPlayback(nextPlayback)

      // Sala detenida: no hay canción a la que apuntar y lo único que hay que
      // hacer es callar el audio local. Sin esto, quien tenía la canción anterior
      // cargada seguía escuchándola después de que el anfitrión la detuvo.
      if (nextPlayback.songId === null) {
        pause()
        return
      }

      if (!songs?.length) return

      const index = songs.findIndex(
        (song) => String(song.id) === String(nextPlayback.songId),
      )

      if (index === -1) return

      playSongs(
        songs,
        index,
        { roomId },
        {
          autoplay: nextPlayback.status === 'playing',
          // Solo el anfitrión pide el avance al servidor; para el resto el
          // `room:playback` del anfitrión es el que mueve la canción.
          onEnded: isHost ? () => onEndedRef.current?.() : null,
          startPosition: remotePositionMs(nextPlayback) / 1000,
        },
      )
    },
    [playSongs, pause, roomId, isHost, songs],
  )

  useEffect(() => {
    if (!roomId || !songs?.length) return undefined

    return subscribeToRoomEvent('room:playback', applyRemote)
  }, [roomId, songs, applyRemote])

  // El servidor manda el estado cada vez que el anfitrión actúa, pero entre una
  // acción y la siguiente el audio local se mantiene solo. Este intervalo solo
  // mide la deriva y, si se pasa del umbral, corrige: no decide qué se reproduce.
  useEffect(() => {
    if (!roomId) return undefined

    const id = setInterval(() => {
      const current = playbackRef.current

      if (!current || current.status !== 'playing') return

      if (!hasAudio()) return

      const position = remotePositionMs(current)
      const drift = Math.abs(getAudioCurrentTime() * 1000 - position)

      if (drift > DRIFT_TOLERANCE_MS) {
        seek(position / 1000, true)
      }
    }, DRIFT_CHECK_MS)

    return () => clearInterval(id)
  }, [roomId, seek, getAudioCurrentTime, hasAudio])

  // El navegador bloquea el autoplay si nadie tocó nada todavía. Cuando eso pasa,
  // `play()` es rechazado, el player queda pausado y el de la sala no puede hacer
  // play/pause: por eso se ofrece un botón explícito para destrabarlo.
  const isBlocked = playback?.status === 'playing' && !localIsPlaying

  // `sync` es `applyRemote` con nombre de acción: la pantalla lo llama con el
  // estado que devuelve `GET /rooms/:id/playback` al entrar, para que entrar a una
  // sala que ya está sonando arranque en la posición actual y no espere a que
  // llegue el próximo evento.
  return { playback, isBlocked, resume: togglePlay, sync: applyRemote }
}