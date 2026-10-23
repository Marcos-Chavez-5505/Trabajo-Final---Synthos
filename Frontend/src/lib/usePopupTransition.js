import * as React from "react"

function parseTimeList(value) {
  return String(value || "")
    .split(",")
    .map((part) => {
      const trimmed = part.trim()
      const amount = Number.parseFloat(trimmed)
      if (!Number.isFinite(amount)) return 0
      return trimmed.endsWith("ms") ? amount : amount * 1000
    })
}

/** Duración total (transición o animación) del elemento, en milisegundos. */
export function getTransitionDuration(element) {
  if (!element || typeof window === "undefined") return 0

  const style = window.getComputedStyle(element)
  const durations = parseTimeList(style.transitionDuration)
  const delays = parseTimeList(style.transitionDelay)
  const animations = parseTimeList(style.animationDuration)
  const animationDelays = parseTimeList(style.animationDelay)

  const transitionTotal = durations.map(
    (duration, index) => duration + (delays[index % delays.length] ?? 0)
  )
  const animationTotal = animations.map(
    (duration, index) => duration + (animationDelays[index % animationDelays.length] ?? 0)
  )

  return Math.max(0, ...transitionTotal, ...animationTotal)
}

/**
 * Ciclo de montaje de un popup con animación de salida.
 *
 * `starting` dura dos frames: el elemento se monta con `data-starting-style`,
 * se pinta una vez y recién ahí se quita para que el CSS interpole. Al cerrar
 * se aplica `data-ending-style` y se desmonta cuando termina la transición.
 * `onComplete` se llama en los dos sentidos, como el
 * `onOpenChangeComplete` de Base UI.
 */
function transitionReducer(state, action) {
  switch (action.type) {
    case "start":
      return { mounted: true, status: "starting" }
    case "open":
      return { ...state, mounted: true, status: null }
    case "ending":
      return { ...state, status: "ending" }
    case "close":
      return { mounted: false, status: null }
    default:
      return state
  }
}

export function usePopupTransition(open, { elementRef, onComplete }) {
  const [state, dispatch] = React.useReducer(transitionReducer, {
    mounted: open,
    status: open ? "starting" : null,
  })
  const mountedRef = React.useRef(false)
  const completeRef = React.useRef(onComplete)

  React.useEffect(() => {
    completeRef.current = onComplete
  }, [onComplete])

  React.useEffect(() => {
    let firstFrame = 0
    let secondFrame = 0
    let timer = 0

    function clear() {
      cancelAnimationFrame(firstFrame)
      cancelAnimationFrame(secondFrame)
      clearTimeout(timer)
    }

    if (open) {
      const wasMounted = mountedRef.current
      mountedRef.current = true
      dispatch({ type: wasMounted ? "open" : "start" })

      function scheduleComplete() {
        const duration = getTransitionDuration(elementRef.current)
        timer = window.setTimeout(() => completeRef.current?.(true), duration + 20)
      }

      if (wasMounted) {
        scheduleComplete()
      } else {
        firstFrame = requestAnimationFrame(() => {
          secondFrame = requestAnimationFrame(() => {
            dispatch({ type: "open" })
            scheduleComplete()
          })
        })
      }
    } else if (mountedRef.current) {
      dispatch({ type: "ending" })
      firstFrame = requestAnimationFrame(() => {
        const duration = getTransitionDuration(elementRef.current)
        timer = window.setTimeout(() => {
          mountedRef.current = false
          dispatch({ type: "close" })
          completeRef.current?.(false)
        }, duration + 30)
      })
    }

    return clear
  }, [open, elementRef])

  return { mounted: state.mounted, status: state.status }
}
