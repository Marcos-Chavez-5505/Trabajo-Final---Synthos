import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PlayerContext } from './playerContext.js'
import useAuth from '../hooks/useAuth.js'

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
 * Punto y radio de origen para el "revelado" circular del reproductor expandido.
 *
 * Se mide desde el botón que lo abre: el centro del botón y el radio que llega
 * a la esquina más lejana de la ventana, para que el círculo cubra toda la
 * pantalla al abrirse.
 */
function getExpandOrigin(element) {
  const rect = element.getBoundingClientRect()
  const x = rect.left + rect.width / 2
  const y = rect.top + rect.height / 2
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  )

  return { x, y, radius }
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
  const { user } = useAuth()
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

  // Callback que reemplaza al `next()` local cuando una canción termina. Lo usa el
  // modo sala: en una sala el avance lo decide el anfitrión y lo reparte el
  // servidor, así que el salto local no puede simplemente avanzar el índice.
  const onEndedRef = useRef(null)

  // Posición inicial de la pista que se está por cargar, en segundos. La carga
  // del track la consume: ver el efecto que setea `audio.src`.
  const pendingSeekRef = useRef(0)

  const [queue, setQueue] = useState([])
  const [index, setIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState('off')
  // Cuando está activo, el reproductor no manda: la sala lo controla el
  // anfitrión y el estado llega por el socket. Apaga aleatorio y repetición y le
  // avisa a los controles para que no ofrezcan lo que no va a pasar.
  const [roomMode, setRoomMode] = useState(false)
  // Estado de UI del reproductor expandido. Vive acá (y no en el layout) para
  // sobrevivir a la navegación: AppLayout se remonta por ruta, PlayerProvider no.
  const [isExpanded, setIsExpanded] = useState(false)
  // Centro/radio desde donde crece la animación de apertura. Lo fija el botón
  // que llama a `expand(event)`; `null` hasta la primera apertura.
  const [expandedOrigin, setExpandedOrigin] = useState(null)
  // Pulso de la acción play/pause: sube en cada `togglePlay`, venga del clic de
  // un control o de la barra espaciadora. Los controles lo observan para correr
  // su animación de pulsado también con teclado, no solo con mouse.
  const [playPulse, setPlayPulse] = useState(0)
  // Bloqueo de arranque. Cuando está encendido, la reproducción no puede
  // *empezar* desde el cliente: pausar sigue siendo del usuario (solo silencia
  // a esta persona), pero reproducir no, porque alguien más decide cuándo suena.
  // Lo enciende la sala, que es quien conoce el estado del servidor.
  const [playBlocked, setPlayBlocked] = useState(false)

  const song = queue[index] ?? null

  // Estado idle: sin canción actual no hay nada cargado. No hay inicialización
  // automática en mount: la cola arranca vacía y solo se puebla cuando el usuario
  // elige reproducir algo (playSongs). El playerbar queda visible pero inerte con
  // un overlay hasta ese momento.
  const isIdle = song === null

  // Idle: sin canción no hay src que cargar. Si el player volvió a idle (cola
  // vaciada), hay que soltar el track anterior o quedaría un audio huérfano en
  // el elemento. Efecto aparte y sin setState, para que el de carga de abajo
  // quede con la misma forma simple de siempre.
  useEffect(() => {
    const audio = audioRef.current

    if (!audio || song) return

    audio.removeAttribute('src')
    audio.load()
  }, [song])

  // Cargar el track en el <audio>. Va antes del efecto de play para que al
  // cambiar de canción el src ya esté seteado cuando se intente reproducir.
  useEffect(() => {
    const audio = audioRef.current

    if (!audio || !song) return

    audio.src = song.audioUrl
    audio.load()
    setDuration(song.duration ?? 0)

    // Posición inicial dentro de la canción, en segundos. La usa el modo sala para
    // arrancar en el punto que va el servidor y no al principio. Tiene que
    // aplicarse acá y no después, porque este efecto deja `currentTime` en 0 y
    // pisaría cualquier `seek()` que se hiciera antes de que corra.
    const start = pendingSeekRef.current
    pendingSeekRef.current = null

    if (start > 0) {
      audio.currentTime = start
      setCurrentTime(start)
    } else {
      setCurrentTime(0)
    }
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

      if (!audio || !audio.src) return

      const target = Math.min(Math.max(time, 0), Number.isFinite(audio.duration) ? audio.duration : time)

      audio.currentTime = target
      setCurrentTime(target)
    },
    [],
  )

  const next = useCallback(() => {
    // En modo sala la cola la manda el servidor: mover el índice acá solo deja a
    // esta persona sonando sola y desfasada. Además de apagar el botón, esto
    // cubre el caso de quien se salte la barrera y lo llame desde consola.
    if (roomMode) return

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
  }, [index, queue, repeat, roomMode, shuffle])

  const previous = useCallback(() => {
    // Igual que `next`: en modo sala el desplazamiento es del servidor.
    if (roomMode) return

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
  }, [queue, roomMode, seek])

  const togglePlay = useCallback(() => {
    if (!song) return

    // Pausar es siempre del usuario: solo le silencia a él. Arrancar, en cambio,
    // puede dejarlo sonando solo mientras el resto de la sala está en silencio,
    // por eso se niega si el estado externo (la sala) no lo permite. Cubre el
    // botón y la barra espaciadora, las dos vías hacia acá.
    if (!isPlaying && playBlocked) return

    setPlayPulse((n) => n + 1)
    setIsPlaying((prev) => !prev)
  }, [isPlaying, playBlocked, song])

  /** Apaga el audio sin tocar la cola ni el índice. Lo usa la sala cuando el
   * servidor se queda sin canción que reproducir (`status: stopped`). */
  const pause = useCallback(() => setIsPlaying(false), [])

  // Tecla "space": alterna reproducir/pausar desde cualquier lugar de la app,
  // incluso con un elemento enfocado (botón, card, ítem de menú). Se toma en
  // fase de captura para interceptarla antes que el elemento enfocado y se
  // reserva como control de reproducción, igual que en un reproductor de
  // escritorio; los controles siguen activándose con Enter. Solo se cede donde
  // se escribe (inputs, textarea, selects, contenteditable), en IME y en
  // combinaciones con modifiers. En idle se deja el comportamiento nativo.
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code !== 'Space' || event.repeat || event.isComposing) return
      if (event.ctrlKey || event.metaKey || event.altKey) return
      if (isIdle) return

      const target = event.target

      if (
        typeof target?.closest === 'function' &&
        target.closest(
          'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"]'
        )
      ) {
        return
      }

      event.preventDefault() // que no scrollee ni active al elemento enfocado
      event.stopPropagation()
      togglePlay()
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [togglePlay, isIdle])

  /**
   * Arma la cola y arranca a reproducir.
   *
   * `source` dice de dónde salen las canciones: `{ playlistId, isFavorites }` si
   * es una playlist, `null` para el catálogo o la búsqueda. Es lo que permite
   * después a las acciones de sincronización decidir si
   * tienen algo que sincronizar: una cola sin origen no se toca nunca, porque sus
   * canciones siguen siendo válidas aunque se quiten de una playlist.
   *
   * `options` es para el modo sala y no cambia el comportamiento por defecto:
   * - `autoplay`: si arranca sonando o queda cargado (por defecto `true`).
   * - `onEnded`: reemplaza al `next()` local cuando la canción termina. En una sala
   *   el avance lo pide el anfitrión al servidor, así que no se puede avanzar el
   *   índice desde el cliente.
   * - `startPosition`: dónde arrancar dentro de la canción, en segundos. Lo aplica
   *   el efecto que carga el track, no un `seek()` aparte (que quedaría pisado).
   */
  const playSongs = useCallback(
    (songs, startIndex = 0, source = null, options = {}) => {
      if (!songs?.length) return

      const { autoplay = true, onEnded = null, startPosition = 0 } = options

      setQueue(songs)
      historyRef.current = []
      queueSourceRef.current = source
      pendingSkipRef.current = null
      onEndedRef.current = onEnded
      pendingSeekRef.current = startPosition
      setIndex(Math.min(Math.max(startIndex, 0), songs.length - 1))
      setIsPlaying(autoplay)
    },
    []
  )

  /**
   * Enciende el modo sala.
   *
   * En una sala el estado de reproducción no es del cliente: lo manda el
   * anfitrión por REST y el servidor lo reparte por el socket. Por eso acá solo
   * se apagan las cosas que cada uno manejaría por su cuenta y romperían la
   * sincronización (aleatorio, repetición y el salto local).
   *
   * El "modo sala" no mete lógica de salas en este archivo: solo un flag que
   * `PlayerControls` y `ActionControls` leen para apagar esos controles. La
   * traducción del estado del servidor al player vive en
   * `features/rooms/useRoomPlayback.js`.
   */
  const enterRoomMode = useCallback(() => {
    setShuffle(false)
    setRepeat('off')
    setRoomMode(true)
  }, [])

  /** @see enterRoomMode */
  const exitRoomMode = useCallback(() => {
    onEndedRef.current = null
    setRoomMode(false)
    setPlayBlocked(false)
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
    setIsExpanded(false)
    historyRef.current = []
    queueSourceRef.current = null
    pendingSkipRef.current = null

    return true
  }, [])

  /**
   * Deja el reproductor en idle: vacía la cola, apaga el audio y colapsa el
   * expandido.
   *
   * Es la salida limpia de una sesión compartida. El `PlayerProvider` vive
   * arriba de las rutas y sobrevive a la navegación, así que sin esto, salir de
   * una sala (expulsado, cierre o salida propia) deja la canción cargada y
   * sonando en el playerbar. Encima quien salió ya no recibe `room:playback`:
   * escucha solo y desfasado, sin ningún camino de vuelta que lo corrija.
   *
   * No es `clearQueueIfSource()`: esa solo vacía si la cola salió de una
   * playlist concreta, y la cola de una sala tiene por origen `{ roomId }`, no
   * un `playlistId`. Acá hay que vaciar lo que sea que esté sonando.
   *
   * @returns {void}
   */
  const goIdle = useCallback(() => {
    setQueue([])
    setIndex(0)
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    setIsExpanded(false)
    setRoomMode(false)
    setPlayBlocked(false)
    historyRef.current = []
    queueSourceRef.current = null
    pendingSkipRef.current = null
    pendingSeekRef.current = null
    onEndedRef.current = null
  }, [])

  // La sesión manda sobre la cola. `PlayerProvider` vive arriba de las rutas y
  // sobrevive a logout/login, así que sin este reset la canción de un usuario
  // seguía cargada (y sonando) en la barra de la cuenta siguiente, y también en
  // /login, que no desmonta el provider: cerrar sesión no alcanzaba con sacar al
  // usuario, había que apagar el reproductor. `goIdle()` es la salida limpia que
  // ya se usa al salir de una sala: vacía la cola, apaga el audio, colapsa el
  // expandido y tira los refs internos (historial, fuente, seek pendiente).
  //
  // Se compara por id y no por el objeto `user`: `updateProfile()` y cada refetch
  // de `/users/me` recrean el objeto y reiniciarían la cola en pleno uso. Con id,
  // el único cambio que apaga todo es entrar/salir de sesión (incluido el
  // `setUser(null)` de un 401).
  const userId = user?.id == null ? null : String(user.id)
  const lastUserIdRef = useRef(userId)

  useEffect(() => {
    if (lastUserIdRef.current === userId) return

    lastUserIdRef.current = userId
    goIdle()
  }, [userId, goIdle])

  // Aleatorio y repetición quedan sin efecto en modo sala: apagan el sentido de
  // una cola compartida (el servidor la recorre en orden, o la votación la
  // salta). Se niegan en el origen y no solo en la UI.
  const toggleShuffle = useCallback(() => {
    if (roomMode) return

    setShuffle((prev) => !prev)
  }, [roomMode])

  const cycleRepeat = useCallback(() => {
    if (roomMode) return

    setRepeat((prev) => REPEAT_MODES[(REPEAT_MODES.indexOf(prev) + 1) % REPEAT_MODES.length])
  }, [roomMode])

  const expand = useCallback((event) => {
    const trigger = event?.currentTarget

    // El origen se toma del botón que dispara la apertura; si `expand` se llama
    // sin evento, se conserva el último origen y el overlay usa su fallback.
    if (trigger?.getBoundingClientRect) {
      setExpandedOrigin(getExpandOrigin(trigger))
    }

    setIsExpanded(true)
  }, [])
  const collapse = useCallback(() => setIsExpanded(false), [])

  // Sincronizar estado del reproductor expandido con el body (para desactivar
  // atajos globales como Ctrl+B mientras ExpandedPlayer está abierto).
  useEffect(() => {
    if (isExpanded) {
      document.body.setAttribute('data-player-expanded', 'true')
    } else {
      document.body.removeAttribute('data-player-expanded')
    }
    return () => {
      document.body.removeAttribute('data-player-expanded')
    }
  }, [isExpanded])

  // Eventos del <audio>: progreso, duración real y fin de pista.
  useEffect(() => {
    const audio = audioRef.current

    if (!audio) return undefined

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)

    const handleLoadedMetadata = () => {
      if (Number.isFinite(audio.duration)) setDuration(audio.duration)

      // Si se pidió arrancar en una posición y el navegador ignoró el
      // `currentTime` porque todavía no conocía la duración, se reintenta acá.
      if (pendingSeekRef.current > 0) {
        audio.currentTime = pendingSeekRef.current
        setCurrentTime(pendingSeekRef.current)
        pendingSeekRef.current = 0
      }
    }

    const handleEnded = () => {
      // En modo sala manda el servidor: el `onEnded` del cliente del anfitrión
      // avisa al backend y espera el `room:playback` que trae la canción nueva.
      if (onEndedRef.current) {
        onEndedRef.current()
        return
      }

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
      roomMode,
      playBlocked,
      isIdle,
      isExpanded,
      expandedOrigin,
      playPulse,
      hasQueue: queue.length > 0,
      playSongs,
      enterRoomMode,
      exitRoomMode,
      goIdle,
      removeFromPlaylistQueue,
      removeFromFavoritesQueue,
      clearQueueIfSource,
      togglePlay,
      pause,
      next,
      previous,
      seek,
      toggleShuffle,
      cycleRepeat,
      expand,
      collapse,
      setPlayBlocked,
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
      roomMode,
      playBlocked,
      isIdle,
      isExpanded,
      expandedOrigin,
      playPulse,
      playSongs,
      enterRoomMode,
      exitRoomMode,
      goIdle,
      removeFromPlaylistQueue,
      removeFromFavoritesQueue,
      clearQueueIfSource,
      togglePlay,
      pause,
      next,
      previous,
      seek,
      toggleShuffle,
      cycleRepeat,
      expand,
      collapse,
    ],
  )

  return (
    <PlayerContext.Provider value={value}>
      {children}
      <audio ref={audioRef} preload="metadata" className="hidden" />
    </PlayerContext.Provider>
  )
}
