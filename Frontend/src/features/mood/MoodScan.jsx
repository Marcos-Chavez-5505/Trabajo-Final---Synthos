import { useCallback, useEffect, useRef, useState } from 'react'
import cameraIcon from '../../assets/microphone.svg'
import { mapApiError, useMoodSongs } from '@synthos/shared'
import { MOODS, MOOD_LABELS } from './moodDetection.js'
import MoodPicker from './MoodPicker.jsx'
import MoodResults from './MoodResults.jsx'
import { detectMood, prepareDetector } from './moodDetection.js'

/**
 * Recomendaciones por estado de ánimo (TS-20 / F9, decisión D4).
 *
 * El flujo tiene tres caminos y ninguno deja la pantalla rota:
 *
 * 1. **Cámara**: se pide permiso, se analiza un frame y sale el estado.
 * 2. **A mano**: si no hay cámara, si el permiso se denegó, si no se detectó un
 *    rostro o si el detector no se pudo descargar (sin red / sin CDN). Es el
 *    mismo `onPick` que usa la detección, así que de arriba no se distingue.
 * 3. **Sin rostro ni ganas de elegir**: solo se explica y se ofrece el selector.
 *
 * El video se detiene siempre en el cleanup: dejar la cámara encendida es el
 * error clásico de esta pantalla (se ve el indicatorito arriba en cualquier
 * pestaña).
 */
export default function MoodScan() {
  const videoRef = useRef(null)
  const streamRef = useRef(null)

  const [cameraState, setCameraState] = useState('idle') // idle | starting | on | error
  const [cameraError, setCameraError] = useState(null)
  const [detectorReady, setDetectorReady] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [notice, setNotice] = useState(null)

  const { mood, songs, songsError, loadSongs, setSongs } = useMoodSongs()

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    setCameraState('idle')
  }, [])

  // Se apaga la cámara si el componente se desmonta (o si React 19 lo hace en
  // modo estricto durante desarrollo).
  useEffect(() => stopCamera, [stopCamera])

  // El detector se prepara al entrar, no al apretar el botón: son ~500 KB de
  // pesos y prefiero que la espera ocurra mientras se lee la pantalla. Si falla,
  // se sigue con el selector manual.
  useEffect(() => {
    let active = true

    prepareDetector().then((ready) => {
      if (active) setDetectorReady(ready)
    })

    return () => {
      active = false
    }
  }, [])

  const handlePick = useCallback(
    (nextMood) => {
      stopCamera()
      setNotice(null)
      loadSongs(nextMood)
    },
    [loadSongs, stopCamera],
  )

  async function startCamera() {
    setCameraError(null)
    setNotice(null)
    setCameraState('starting')

    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraState('error')
      setCameraError('Este navegador no permite usar la cámara.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 } },
        audio: false,
      })

      streamRef.current = stream
      setCameraState('on')

      // El <video> tiene que estar montado antes de asignarle el stream; el
      // estado ya quedó en "on", así que el ref existe para el próximo render.
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
    } catch (cause) {
      setCameraState('error')
      setCameraError(
        cause?.name === 'NotAllowedError'
          ? 'No diste permiso para usar la cámara. Podés elegir a mano.'
          : 'No encontramos ninguna cámara en este dispositivo.',
      )
    }
  }

  async function analyze() {
    if (!videoRef.current || !detectorReady) return

    setAnalyzing(true)
    setNotice(null)

    try {
      const result = await detectMood(videoRef.current)

      if (!result.hasFace) {
        setNotice('No detectamos un rostro. Probá de nuevo mirando a la cámara.')
        return
      }

      handlePick(result.mood)
    } catch (cause) {
      setNotice(mapApiError(cause, 'No pudimos analizar la imagen.'))
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="p-6 md:p-10">
      <h1 className="Header3">Recomendaciones por estado de ánimo</h1>
      <p className="mt-2 max-w-2xl TextRegluar opacity-70">
        Miramos cómo estás con la cámara y elegimos canciones para ese momento. La imagen se analiza
        en tu dispositivo: no se sube a ningún servidor.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="SurfaceLight rounded p-4">
          <div className="flex items-center gap-2">
            <img src={cameraIcon} alt="" aria-hidden="true" className="h-5 w-5 invert" />
            <p className="TextMedium">Escanear con la cámara</p>
          </div>

          <div className="mt-3 aspect-3/2 w-full overflow-hidden rounded Volume">
            <video
              ref={videoRef}
              playsInline
              muted
              className="h-full w-full object-cover"
              // eslint-disable-next-line jsx-a11y/media-has-caption
            />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {cameraState !== 'on' ? (
              <button
                type="button"
                onClick={startCamera}
                disabled={cameraState === 'starting'}
                className="rounded px-4 py-2 Fucsia Button hover:brightness-110 disabled:opacity-50"
              >
                {cameraState === 'starting' ? 'Encendiendo cámara…' : 'Activar cámara'}
              </button>
            ) : (
              <button
                type="button"
                onClick={analyze}
                disabled={analyzing || !detectorReady}
                className="rounded px-4 py-2 Fucsia Button hover:brightness-110 disabled:opacity-50"
              >
                {analyzing
                  ? 'Analizando…'
                  : detectorReady
                    ? 'Analizar mi estado'
                    : 'Descargando detector…'}
              </button>
            )}

            {cameraState === 'on' && (
              <button
                type="button"
                onClick={stopCamera}
                className="rounded px-4 py-2 Volume Button hover:brightness-110"
              >
                Apagar cámara
              </button>
            )}
          </div>

          {cameraError && <p className="mt-3 Salmon TextMedium">{cameraError}</p>}
          {notice && <p className="mt-3 TextMedium opacity-80">{notice}</p>}
          {!detectorReady && cameraState !== 'on' && (
            <p className="mt-3 TextMedium opacity-70">
              El detector todavía no está listo (o no se pudo descargar). Podés elegir a mano.
            </p>
          )}
        </div>

        <div>
          <MoodPicker onPick={handlePick} title="Elegí a mano" />
          <p className="mt-3 TextTiny opacity-70">
            Estados del catálogo: {MOODS.map((mood) => MOOD_LABELS[mood]).join(' · ')}. Si el detector no puede leer tu cara, elegí uno
            y seguí igual.
          </p>
        </div>
      </div>

      {songsError && <p className="mt-6 Salmon TextMedium">{songsError}</p>}

      {songs !== null && !songsError && (
        <MoodResults mood={mood} songs={songs} onRescan={() => setSongs(null)} />
      )}
    </div>
  )
}