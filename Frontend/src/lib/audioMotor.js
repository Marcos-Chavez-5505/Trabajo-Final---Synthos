/**
 * Motor de audio para la web: envuelve un `<audio>` HTML5 detrás de la
 * interfaz compartida `load / play / pause / seek / onTimeUpdate / onEnded /
 * onLoadedMetadata / getCurrentTime / getDuration / setMuted / hasSource`.
 *
 * `load(src, song?)` recibe la canción como segundo argumento opcional: las
 * plataformas que necesitan metadata (mobile, para el lock screen) la usan;
 * este adaptador la ignora y solo toma la URL.
 *
 * `PlayerContext` (compartido en el futuro) solo habla con esta interfaz, así
 * que en mobile se puede reemplazar por un adaptador sobre `expo-audio` sin
 * tocar la lógica de la cola.
 */
export function createHtmlAudioMotor(element) {
  if (!element) return null

  return {
    get element() {
      return element
    },
    get src() {
      return element.src || ''
    },
    hasSource() {
      return Boolean(element.src)
    },
    load(src) {
      element.src = src
      element.load()
    },
    play() {
      return element.play()
    },
    pause() {
      element.pause()
    },
    seek(time) {
      element.currentTime = time
    },
    getCurrentTime() {
      return element.currentTime || 0
    },
    getDuration() {
      return Number.isFinite(element.duration) ? element.duration : 0
    },
    setMuted(value) {
      element.muted = Boolean(value)
    },
    onTimeUpdate(handler) {
      element.addEventListener('timeupdate', handler)
      return () => element.removeEventListener('timeupdate', handler)
    },
    onLoadedMetadata(handler) {
      element.addEventListener('loadedmetadata', handler)
      return () => element.removeEventListener('loadedmetadata', handler)
    },
    onEnded(handler) {
      element.addEventListener('ended', handler)
      return () => element.removeEventListener('ended', handler)
    },
  }
}