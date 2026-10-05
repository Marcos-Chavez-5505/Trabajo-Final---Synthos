import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PlayerContext } from './playerContext.js'
import { listSongs } from '../services/songsService.js'

const REPEAT_MODES = ['off', 'track', 'list']
const RESTART_THRESHOLD_SECONDS = 3
const SHUFFLE_MEMORY = 10

/**
 * Los ids llegan como number del backend y como string desde el storage, así que
 * `43886 !== "43886"`. Toda comparación de canción de la cola pasa por acá.
 */
function sameSong(a, b) {
  return String(a) === String(b)
}

/**
 * Saca la canción de `position` de la cola y deja los punteros coherentes.
 *
 * Es una función suelta y no un método del provider porque la usan dos caminos
 * distintos con la misma corrección: el salto pendiente de `next()` y el borrado
 * explícito de `removeFromPlaylistQueue()`.
 *
 * @param {Array} queue Cola actual.
 * @param {number} position Índice a quitar.
 * @param {number} current Índice de la canción que está sonando.
 * @param {Function} setQueue
 * @param {Function} setIndex
 * @param {object} historyRef Historial de índices ya reproducidos.
 * @returns {Array} La cola resultante, para que el llamador sepa si quedó vacía.
 */
function removeIndex(queue, position, current, setQueue, setIndex, historyRef) {
  if (position < 0 || position >= queue.length) return queue

  const nextQueue = queue.filter((_, i) => i !== position)

  setQueue(nextQueue)

  // Sacar una canción que está antes del índice actual corre todos los índices
  // siguientes, así que el actual también baja. Si es la que suena, el índice
  // queda apuntando a la posición que ocupaba, que ahora es otra canción.
  if (position < current) {
    setIndex(current - 1)
  }

  // El historial guarda índices, no canciones: sin corregirlo, `previous()`
  // saltaría a otra canción.
  historyRef.current = historyRef.current
    .filter((i) => i !== position)
    .map((i) => (i > position ? i - 1 : i))

  return nextQueue
}

/**
 * Estado global de reproducción. Un solo <audio> HTML5 manejado acá; PlayerBar
 * (desktop) y MiniPlayerBar (mobile) son presentación de este mismo estado.
 */
export default function PlayerProvider({ children }) {
  const audioRef = useRef(null)
  // Índices ya reproducidos, del más nuevo al más viejo. Es ref y no state porque
  // no se renderiza: solo lo leen/escriben next(), previous() y playSongs().
  const historyRef = useRef([])

  // De dónde salió la cola: `{ playlistId, isFavorites }` si se reprodujo una
  // playlist, `null` si salió del catálogo o de la búsqueda. Es ref porque no se
  // renderiza: lo leen las acciones que sincronizan con su fuente
  // (removeFromPlaylistQueue(), removeFromFavoritesQueue(), clearQueueIfSource()).
  // Sin esto el player no puede saber a qué lista pertenece la copia que guarda.
  const queueSourceRef = useRef(null)

  // Índice de una canción que se quitó de la fuente mientras era la que sonaba.
  // La columna sigue sonando y se borra en el próximo salto. `null` si no hay
  // ninguna pendiente. Referencia aparte porque al sacarla de la cola el índice
  // vigente ya apunta a otra canción.
  const pendingSkipRef = useRef(null)

  const [queue, setQueue] = useState([])
  const [index, setIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState('off')

  const song = queue[index] ?? null

  // Si el catálogo no llega, la cola queda vacía y el player se oculta
  // (hasQueue false). No rompe la app: el resto de las pantallas no dependen de
  // esto para renderizar.
  // TODO(agente): TS-07/TS-09 arman la cola con la selección real del usuario.
  // Por ahora la cola inicial es la primera tanda del catálogo, para que el
  // player sea usable.
  useEffect(() => {
    let active = true

    listSongs()
      .then((songs) => {
        if (active) setQueue(songs)
      })
      .catch(() => {
        if (active) setQueue([])
      })

    return () => {
      active = false
    }
  }, [])

  // Cargar el track en el <audio>. Va antes del efecto de play para que al
  // cambiar de canción el src ya esté seteado cuando se intenta reproducir.
  useEffect(() => {
    const audio = audioRef.current

    if (!audio || !song) return

    audio.src = song.audioUrl
    audio.load()
    setCurrentTime(0)
    setDuration(song.duration ?? 0)
  }, [song])

  useEffect(() => {
    const audio = audioRef.current

    if (!audio || !song) return

    if (isPlaying) {
      // El navegador puede bloquear autoplay: en ese caso no queda sonando.
      audio.play().catch(() => setIsPlaying(false))
    } else {
      audio.pause()
    }
  }, [isPlaying, song])

  const seek = useCallback(
    (time) => {
      const audio = audioRef.current

      if (!audio) return

      const target = Math.min(Math.max(time, 0), Number.isFinite(audio.duration) ? audio.duration : time)

      audio.currentTime = target
      setCurrentTime(target)
    },
    [],
  )

  const next = useCallback(() => {
    // El salto pendiente se evalúa antes del `if (!queue.length)`: con una sola
    // canción en la cola esa es justamente la que se retiró, y sin esto el
    // `next()` que dispara el evento 'ended' no haría nada.
    const pending = pendingSkipRef.current

    if (pending !== null) {
      pendingSkipRef.current = null

      const remaining = removeIndex(queue, pending, pending, setQueue, setIndex, historyRef)

      if (!remaining.length) {
        setIndex(0)
        setIsPlaying(false)
        return
      }

      // El índice que ocupaba la canción retirada ahora es la siguiente, y se
      // ajusta por si estaba al final de la cola.
      setIndex(Math.min(pending, remaining.length - 1))
      return
    }

    if (!queue.length) return

    if (shuffle && queue.length > 1) {
      // Evita la actual y las últimas SHUFFLE_MEMORY; si no queda ninguna, cae a
      // "cualquiera menos la actual" para no dejar la cola sin candidatos.
      const visited = new Set([index, ...historyRef.current.slice(-SHUFFLE_MEMORY)])
      const fresh = queue.map((_, i) => i).filter((i) => !visited.has(i))
      const candidates = fresh.length ? fresh : queue.map((_, i) => i).filter((i) => i !== index)

      historyRef.current.push(index)
      setIndex(candidates[Math.floor(Math.random() * candidates.length)])
      return
    }

    const nextIndex = index + 1

    if (nextIndex >= queue.length) {
      if (repeat === 'list') {
        historyRef.current.push(index)
        setIndex(0)
        return
      }

      setIsPlaying(false)
      return
    }

    historyRef.current.push(index)
    setIndex(nextIndex)
  }, [index, queue, repeat, shuffle])

  const previous = useCallback(() => {
    const audio = audioRef.current

    // Si ya pasó un poco de la canción, el botón reinicia en vez de saltar.
    if (audio && audio.currentTime > RESTART_THRESHOLD_SECONDS) {
      seek(0)
      return
    }

    if (!queue.length) return

    // Vuelve a la última canción realmente escuchada (importa en aleatorio, donde
    // el índice salta). Sin historial a qué volver, usa la lista ordenada.
    if (historyRef.current.length) {
      const target = historyRef.current.pop()

      // El salto pendiente solo puede ser la canción que estaba sonando, que no
      // debería estar en el historial; el corte es para que un índice fuera de
      // rango no deje el reproductor apuntando a la nada.
      if (target < queue.length) {
        setIndex(target)
      }

      return
    }

    setIndex((prev) => (prev - 1 + queue.length) % queue.length)
  }, [queue, seek])

  const togglePlay = useCallback(() => {
    if (!song) return

    setIsPlaying((prev) => !prev)
  }, [song])

  /**
   * Arma la cola y arranca a reproducir.
   *
   * `source` dice de dónde salen las canciones: `{ playlistId, isFavorites }` si
   * es una playlist, `null` para el catálogo o la búsqueda. Es lo que permite
   * después a las acciones de sincronización decidir si
   * tienen algo que sincronizar: una cola sin origen no se toca nunca, porque sus
   * canciones siguen siendo válidas aunque se quiten de una playlist.
   */
  const playSongs = useCallback((songs, startIndex = 0, source = null) => {
    if (!songs?.length) return

    setQueue(songs)
    historyRef.current = []
    queueSourceRef.current = source
    pendingSkipRef.current = null
    setIndex(Math.min(Math.max(startIndex, 0), songs.length - 1))
    setIsPlaying(true)
  }, [])

  /**
   * Saca una canción de la cola porque dejó de estar en la playlist `playlistId`.
   *
   * La fuente se verifica siempre: quitar una canción de la playlist A no puede
   * tocar una cola que se armó desde la playlist B, ni aunque la canción esté en
   * las dos. Ahí la canción sigue siendo válida y la cola no se entera de nada.
   *
   * Si la canción que sale es la que está sonando, no se corta el audio: se
   * marca como pendiente y `next()` la descarta al saltar.
   *
   * @param {number|string} songId
   * @param {number|string} playlistId Playlist whose queue se debe tocar.
   * @returns {boolean} Si la cola era de esa playlist y la canción estaba en ella.
   */
  const removeFromPlaylistQueue = useCallback(
    (songId, playlistId) => {
      const source = queueSourceRef.current

      if (!source || source.isFavorites) return false
      if (!sameSong(source.playlistId, playlistId)) return false

      const position = queue.findIndex((item) => sameSong(item.id, songId))

      if (position === -1) return false

      if (position === index) {
        // Sigue sonando; se descarta en el próximo salto.
        pendingSkipRef.current = position
        return true
      }

      removeIndex(queue, position, index, setQueue, setIndex, historyRef)

      return true
    },
    [index, queue]
  )

  /**
   * Saca `songId` de la cola solo si lo que suena es justamente "Mis Favoritos".
   *
   * Lo usa el corazón del reproductor: el corazón sabe que la canción dejó de ser
   * favorita, pero no si la cola actual es la de favoritos o una playlist común.
   * Sacarla de una cola que no es de favoritos sería un error: la canción sigue
   * siendo válida, solo dejó de estar marcada.
   *
   * @param {number|string} songId
   * @returns {boolean}
   */
  const removeFromFavoritesQueue = useCallback(
    (songId) => {
      const source = queueSourceRef.current

      if (!source?.isFavorites) return false

      const position = queue.findIndex((item) => sameSong(item.id, songId))

      if (position === -1) return false

      if (position === index) {
        pendingSkipRef.current = position
        return true
      }

      removeIndex(queue, position, index, setQueue, setIndex, historyRef)

      return true
    },
    [index, queue]
  )

  /**
   * Vacía la cola si lo que suena es justamente `playlistId`.
   *
   * Es el caso de borrar la playlist entera mientras se reproduce: las canciones
   * ya no existen en ningún lado, así que no alcanza con quitar una por una. La
   * reproducción se detiene en vez de dejar el player apuntando a una copia que
   * no corresponde.
   *
   * Con `isFavorites` no se toca la cola: "Mis Favoritos" no se borra, se vacía
   * canción por canción con el corazón, que ya pasa por
   * `removeFromFavoritesQueue()`.
   *
   * @param {number|string} playlistId
   * @returns {boolean} Si la cola era de esa playlist y se vació.
   */
  const clearQueueIfSource = useCallback((playlistId) => {
    const source = queueSourceRef.current

    if (!source || source.isFavorites) return false
    if (!sameSong(source.playlistId, playlistId)) return false

    setQueue([])
    setIndex(0)
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    historyRef.current = []
    queueSourceRef.current = null
    pendingSkipRef.current = null

    return true
  }, [])

  const toggleShuffle = useCallback(() => setShuffle((prev) => !prev), [])

  const cycleRepeat = useCallback(() => {
    setRepeat((prev) => REPEAT_MODES[(REPEAT_MODES.indexOf(prev) + 1) % REPEAT_MODES.length])
  }, [])

  // Eventos del <audio>: progreso, duración real y fin de pista.
  useEffect(() => {
    const audio = audioRef.current

    if (!audio) return undefined

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)

    const handleLoadedMetadata = () => {
      if (Number.isFinite(audio.duration)) setDuration(audio.duration)
    }

    const handleEnded = () => {
      if (repeat === 'track') {
        audio.currentTime = 0
        audio.play().catch(() => setIsPlaying(false))
        return
      }

      next()
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [next, repeat])

  const value = useMemo(
    () => ({
      song,
      queue,
      index,
      isPlaying,
      currentTime,
      duration,
      shuffle,
      repeat,
      hasQueue: queue.length > 0,
      playSongs,
      removeFromPlaylistQueue,
      removeFromFavoritesQueue,
      clearQueueIfSource,
      togglePlay,
      next,
      previous,
      seek,
      toggleShuffle,
      cycleRepeat,
    }),
    [
      song,
      queue,
      index,
      isPlaying,
      currentTime,
      duration,
      shuffle,
      repeat,
      playSongs,
      removeFromPlaylistQueue,
      removeFromFavoritesQueue,
      clearQueueIfSource,
      togglePlay,
      next,
      previous,
      seek,
      toggleShuffle,
      cycleRepeat,
    ],
  )

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio ref={audioRef} preload="metadata" className="hidden" />
    </PlayerContext.Provider>
  )
}
