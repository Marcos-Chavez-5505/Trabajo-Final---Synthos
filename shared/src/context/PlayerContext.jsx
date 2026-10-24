import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PlayerContext } from './playerContext.js'
import useAuth from '../hooks/useAuth.js'
// El motor de audio se inyecta por prop (web: createHtmlAudioMotor). shared/
// no importa nada de las apps (regla permanente).

const REPEAT_MODES = ['off', 'track', 'list']
const RESTART_THRESHOLD_SECONDS = 3
const SHUFFLE_MEMORY = 10

function sameSong(a, b) {
  return String(a) === String(b)
}

function removeIndex(queue, position, current, setQueue, setIndex, historyRef) {
  if (position < 0 || position >= queue.length) return queue

  const nextQueue = queue.filter((_, i) => i !== position)

  setQueue(nextQueue)

  if (position < current) {
    setIndex(current - 1)
  }

  historyRef.current = historyRef.current
    .filter((i) => i !== position)
    .map((i) => (i > position ? i - 1 : i))

  return nextQueue
}

export default function PlayerProvider({ children, motor: injectedMotor }) {
  const { user } = useAuth()
  const motorRef = useRef(injectedMotor || null)
  const historyRef = useRef([])
  const queueSourceRef = useRef(null)
  const pendingSkipRef = useRef(null)
  const onEndedRef = useRef(null)
  const pendingSeekRef = useRef(0)

  const [queue, setQueue] = useState([])
  const [index, setIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState('off')
  const [roomMode, setRoomMode] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const [expandedOrigin, setExpandedOrigin] = useState(null)
  const [playPulse, setPlayPulse] = useState(0)
  const [playBlocked, setPlayBlocked] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

  const song = queue[index] ?? null
  const isIdle = song === null

  // El motor se inyecta por prop (web lo crea en main.jsx). Si cambia, se
  // actualiza la referencia.
  useEffect(() => {
    motorRef.current = injectedMotor || null
  }, [injectedMotor])

  // Idle: sin canción, soltar el track anterior.
  useEffect(() => {
    const motor = motorRef.current

    if (!motor || song) return

    if (motor.element) {
      motor.element.removeAttribute('src')
      motor.element.load()
    }
    setCurrentTime(0)
  }, [song])

  // Cargar el track.
  useEffect(() => {
    const motor = motorRef.current

    if (!motor || !song) return

    motor.load(song.audioUrl)
    setDuration(song.duration ?? 0)

    const start = pendingSeekRef.current
    pendingSeekRef.current = null

    if (start > 0) {
      motor.seek(start)
      setCurrentTime(start)
    } else {
      setCurrentTime(0)
    }
  }, [song])

  // Play/pause.
  useEffect(() => {
    const motor = motorRef.current

    if (!motor || !song) return

    if (isPlaying) {
      motor.play().catch(() => setIsPlaying(false))
    } else {
      motor.pause()
    }
  }, [isPlaying, song])

  // Mute local.
  useEffect(() => {
    const motor = motorRef.current

    if (motor) motor.setMuted(isMuted)
  }, [isMuted])

  const seek = useCallback((time, force = false) => {
    // En una sala la posición la decide el servidor: ni el anfitrión ni los
    // participantes pueden desplazar la barra de tiempo. El sincronizador
    // interno (useRoomPlayback) fuerza la corrección de deriva con `force`.
    if (roomMode && !force) return

    const motor = motorRef.current

    if (!motor || !motor.hasSource()) return

    const dur = motor.getDuration()
    const target = Math.min(Math.max(time, 0), Number.isFinite(dur) && dur > 0 ? dur : time)

    motor.seek(target)
    setCurrentTime(target)
  }, [roomMode])

  const next = useCallback(() => {
    if (roomMode) return

    const pending = pendingSkipRef.current

    if (pending !== null) {
      pendingSkipRef.current = null

      const remaining = removeIndex(queue, pending, pending, setQueue, setIndex, historyRef)

      if (!remaining.length) {
        setIndex(0)
        setIsPlaying(false)
        return
      }

      setIndex(Math.min(pending, remaining.length - 1))
      return
    }

    if (!queue.length) return

    if (queue[index + 1]?.queued) {
      historyRef.current.push(index)
      setIndex(index + 1)
      return
    }

    if (shuffle && queue.length > 1) {
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
    if (roomMode) return

    const motor = motorRef.current

    if (motor && motor.getCurrentTime() > RESTART_THRESHOLD_SECONDS) {
      seek(0)
      return
    }

    if (!queue.length) return

    if (historyRef.current.length) {
      const target = historyRef.current.pop()

      if (target < queue.length) {
        setIndex(target)
      }

      return
    }

    setIndex((prev) => (prev - 1 + queue.length) % queue.length)
  }, [queue, roomMode, seek])

  const togglePlay = useCallback(() => {
    if (!song) return

    if (!isPlaying && playBlocked) return

    setPlayPulse((n) => n + 1)
    setIsPlaying((prev) => !prev)
  }, [isPlaying, playBlocked, song])

  const pause = useCallback(() => setIsPlaying(false), [])

  const playSongs = useCallback((songs, startIndex = 0, source = null, options = {}) => {
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
  }, [])

  const addToQueue = useCallback((songToQueue) => {
    if (!songToQueue?.id || roomMode) return false

    if (!song) {
      playSongs([{ ...songToQueue, queued: true }], 0)
      return true
    }

    setQueue((current) => {
      let insertAt = index + 1
      while (insertAt < current.length && current[insertAt].queued) insertAt += 1

      const nextQueue = current.slice()
      nextQueue.splice(insertAt, 0, { ...songToQueue, queued: true })
      return nextQueue
    })

    return true
  }, [index, playSongs, roomMode, song])

  const jumpTo = useCallback((position) => {
    if (roomMode || !queue.length) return
    if (!Number.isInteger(position) || position < 0 || position >= queue.length) return
    if (position === index) return

    historyRef.current.push(index)
    setIndex(position)
    setIsPlaying(true)
  }, [index, queue.length, roomMode])

  const enterRoomMode = useCallback(() => {
    setShuffle(false)
    setRepeat('off')
    setRoomMode(true)
  }, [])

  const exitRoomMode = useCallback(() => {
    onEndedRef.current = null
    setRoomMode(false)
    setPlayBlocked(false)
  }, [])

  const removeFromPlaylistQueue = useCallback((songId, playlistId) => {
    const source = queueSourceRef.current

    if (!source || source.isFavorites) return false
    if (!sameSong(source.playlistId, playlistId)) return false

    const position = queue.findIndex((item) => sameSong(item.id, songId))

    if (position === -1) return false

    if (position === index) {
      pendingSkipRef.current = position
      return true
    }

    removeIndex(queue, position, index, setQueue, setIndex, historyRef)

    return true
  }, [index, queue])

  const removeFromFavoritesQueue = useCallback((songId) => {
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
  }, [index, queue])

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

  const goIdle = useCallback(() => {
    setQueue([])
    setIndex(0)
    setIsPlaying(false)
    setCurrentTime(0)
    setDuration(0)
    setIsExpanded(false)
    setRoomMode(false)
    setPlayBlocked(false)
    setIsMuted(false)
    historyRef.current = []
    queueSourceRef.current = null
    pendingSkipRef.current = null
    pendingSeekRef.current = null
    onEndedRef.current = null
  }, [])

  const userId = user?.id == null ? null : String(user.id)
  const lastUserIdRef = useRef(userId)

  useEffect(() => {
    if (lastUserIdRef.current === userId) return

    lastUserIdRef.current = userId
    goIdle()
  }, [userId, goIdle])

  const toggleShuffle = useCallback(() => {
    if (roomMode) return

    setShuffle((prev) => !prev)
  }, [roomMode])

  const cycleRepeat = useCallback(() => {
    if (roomMode) return

    setRepeat((prev) => REPEAT_MODES[(REPEAT_MODES.indexOf(prev) + 1) % REPEAT_MODES.length])
  }, [roomMode])

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => !prev)
  }, [])

  const expand = useCallback((origin) => {
    if (origin && typeof origin.x === 'number' && typeof origin.y === 'number') {
      setExpandedOrigin(origin)
    }

    setIsExpanded(true)
  }, [])
  const collapse = useCallback(() => setIsExpanded(false), [])

  // Eventos del motor.
  useEffect(() => {
    const motor = motorRef.current

    if (!motor) return undefined

    const handleTimeUpdate = () => setCurrentTime(motor.getCurrentTime())

    const handleLoadedMetadata = () => {
      if (Number.isFinite(motor.getDuration())) setDuration(motor.getDuration())

      if (pendingSeekRef.current > 0) {
        motor.seek(pendingSeekRef.current)
        setCurrentTime(pendingSeekRef.current)
        pendingSeekRef.current = 0
      }
    }

    const handleEnded = () => {
      if (onEndedRef.current) {
        onEndedRef.current()
        return
      }

      if (repeat === 'track') {
        motor.seek(0)
        motor.play().catch(() => setIsPlaying(false))
        return
      }

      next()
    }

    const unsubTime = motor.onTimeUpdate(handleTimeUpdate)
    const unsubMeta = motor.onLoadedMetadata(handleLoadedMetadata)
    const unsubEnded = motor.onEnded(handleEnded)

    return () => {
      unsubTime()
      unsubMeta()
      unsubEnded()
    }
  }, [next, repeat])

  const value = useMemo(() => ({
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
    isMuted,
    isIdle,
    isExpanded,
    expandedOrigin,
    playPulse,
    hasQueue: queue.length > 0,
    playSongs,
    addToQueue,
    jumpTo,
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
    toggleMute,
    expand,
    collapse,
    setPlayBlocked,
    getAudioCurrentTime: () => (motorRef.current ? motorRef.current.getCurrentTime() : 0),
    hasAudio: () => Boolean(motorRef.current && motorRef.current.hasSource()),
    getAudioElement: () => (motorRef.current ? motorRef.current.element ?? null : null),
  }), [
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
    isMuted,
    isIdle,
    isExpanded,
    expandedOrigin,
    playPulse,
    playSongs,
    addToQueue,
    jumpTo,
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
    toggleMute,
    expand,
    collapse,
  ])

  return (
    <PlayerContext.Provider value={value}>
      {children}
    </PlayerContext.Provider>
  )
}