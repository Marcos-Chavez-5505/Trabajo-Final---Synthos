import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { PlayerContext } from './playerContext.js'
import { listSongs } from '../services/songsService.js'

const REPEAT_MODES = ['off', 'track', 'list']
const RESTART_THRESHOLD_SECONDS = 3

/**
 * Estado global de reproducción. Un solo <audio> HTML5 manejado acá; PlayerBar
 * (desktop) y MiniPlayerBar (mobile) son presentación de este mismo estado.
 */
export default function PlayerProvider({ children }) {
  const audioRef = useRef(null)

  const [queue, setQueue] = useState([])
  const [index, setIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [shuffle, setShuffle] = useState(false)
  const [repeat, setRepeat] = useState('off')

  const song = queue[index] ?? null

  // TODO(agente): TS-07/TS-09 arman la cola con la selección real del usuario.
  // Por ahora la cola inicial es el catálogo mock, para que el player sea usable.
  useEffect(() => {
    let active = true

    listSongs().then((songs) => {
      if (active) setQueue(songs)
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
    if (!queue.length) return

    if (shuffle && queue.length > 1) {
      const candidates = queue
        .map((_, i) => i)
        .filter((i) => i !== index)

      setIndex(candidates[Math.floor(Math.random() * candidates.length)])
      return
    }

    const nextIndex = index + 1

    if (nextIndex >= queue.length) {
      if (repeat === 'list') {
        setIndex(0)
        return
      }

      setIsPlaying(false)
      return
    }

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

    setIndex((prev) => (prev - 1 + queue.length) % queue.length)
  }, [queue, seek])

  const togglePlay = useCallback(() => {
    if (!song) return

    setIsPlaying((prev) => !prev)
  }, [song])

  const playSongs = useCallback((songs, startIndex = 0) => {
    if (!songs?.length) return

    setQueue(songs)
    setIndex(Math.min(Math.max(startIndex, 0), songs.length - 1))
    setIsPlaying(true)
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
