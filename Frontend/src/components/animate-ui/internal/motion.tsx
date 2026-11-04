// Tokens y utilidades de movimiento de Animate UI
// (packages/react/src/utils/motion/index.tsx del repo imskyleen/animate-ui).
//
// Portado tal cual pero recortado al subconjunto que consume el Toast: los
// roles de spring/transition/scale/blur/shift/stagger que usa la primitiva.
// Los valores son los del original; si algún día se trae otro componente de
// Animate UI, conviene mover esto a un archivo por rol en vez de duplicarlo.

import * as React from "react"
import {
  createGeneratorEasing,
  generateLinearEasing,
  MotionConfig,
  MotionConfigContext,
  spring as springGenerator,
  type Transition,
} from "motion/react"

const ease = {
  out: [0.23, 1, 0.32, 1],
  draw: [0, 0, 0.58, 1],
  inOut: [0.77, 0, 0.175, 1],
  away: [0.33, 0.17, 0.67, 0.5],
} as const

const spring = {
  toast: { type: "spring", stiffness: 280, damping: 24 },
  pop: { type: "spring", stiffness: 400, damping: 29 },
  checkPop: { type: "spring", stiffness: 500, damping: 24 },
} as const satisfies Record<string, Transition>

const transition = {
  fade: { duration: 0.2, ease: ease.out },
  check: { duration: 0.3, delay: 0.2, ease: ease.draw },
  swap: { duration: 0.15, ease: ease.out },
  dismiss: { duration: 0.2, ease: ease.away },
  shake: { duration: 0.4, ease: ease.inOut },
} as const satisfies Record<string, Transition>

const scale = {
  toast: 0.96,
  tooltip: 0.7,
  icon: 0.5,
} as const

const blur = {
  icon: "blur(2px)",
  surface: "blur(4px)",
} as const

const shift = {
  shake: 3,
} as const

const stagger = {
  stack: 0.03,
} as const

const TIME_KEYS = [
  "duration",
  "visualDuration",
  "delay",
  "repeatDelay",
  "delayChildren",
]

function scaleTransition<T extends Transition | undefined>(
  value: T,
  tempo: number,
): T {
  if (!value || tempo === 1 || typeof value !== "object") return value
  const scaled: Record<string, unknown> = {}
  for (const [key, inner] of Object.entries(value)) {
    if (typeof inner === "number" && TIME_KEYS.includes(key))
      scaled[key] = inner * tempo
    else if (typeof inner === "number" && key === "stiffness")
      scaled[key] = inner / (tempo * tempo)
    else if (typeof inner === "number" && key === "damping")
      scaled[key] = inner / tempo
    else if (inner && typeof inner === "object" && !Array.isArray(inner))
      scaled[key] = scaleTransition(inner as Transition, tempo)
    else scaled[key] = inner
  }
  return scaled as T
}

function createMotionTokens(tempo = 1) {
  const pace = <T extends Record<string, Transition>>(set: T): T =>
    tempo === 1
      ? set
      : (Object.fromEntries(
          Object.entries(set).map(([role, value]) => [
            role,
            scaleTransition(value, tempo),
          ]),
        ) as T)

  return {
    tempo,
    ease,
    scale,
    blur,
    shift,
    stagger:
      tempo === 1
        ? stagger
        : (Object.fromEntries(
            Object.entries(stagger).map(([role, delay]) => [role, delay * tempo]),
          ) as typeof stagger),
    spring: pace(spring),
    transition: pace(transition),
  } as const
}

export type MotionTokens = ReturnType<typeof createMotionTokens>

const motionTokens: MotionTokens = createMotionTokens()

const MotionTokensContext = React.createContext<MotionTokens>(motionTokens)

export function useTempoTransition<T extends Transition | undefined>(
  motionTransition: T,
): T {
  const { tempo } = React.use(MotionTokensContext)
  return scaleTransition(motionTransition, tempo)
}

export function useMotionTokens(): MotionTokens {
  return React.use(MotionTokensContext)
}

export type CssTiming = { duration: number; easing: string }

const CSS_EASINGS: Record<string, string> = {
  linear: "linear",
  easeIn: "cubic-bezier(0.42, 0, 1, 1)",
  easeOut: "cubic-bezier(0, 0, 0.58, 1)",
  easeInOut: "cubic-bezier(0.42, 0, 0.58, 1)",
  circIn: "cubic-bezier(0, 0.65, 0.55, 1)",
  circOut: "cubic-bezier(0.55, 0, 1, 0.45)",
  backIn: "cubic-bezier(0.31, 0.01, 0.66, -0.59)",
  backOut: "cubic-bezier(0.33, 1.53, 0.69, 0.99)",
}

const SPRING_KEYS = [
  "stiffness",
  "damping",
  "mass",
  "bounce",
  "visualDuration",
]

function toCssEase(curve: unknown): string {
  if (
    Array.isArray(curve) &&
    curve.length === 4 &&
    curve.every(Number.isFinite)
  )
    return `cubic-bezier(${curve.join(", ")})`
  if (typeof curve === "string") return CSS_EASINGS[curve] ?? "ease"
  return CSS_EASINGS.easeInOut!
}

/**
 * Convierte un `Transition` de Motion en una transición CSS: un spring se
 * escribe como `linear()` (la misma curva que generaría Motion), un tween
 * conserva su duración y su cubic-bezier.
 */
export function toCssTiming(motionTransition: Transition): CssTiming {
  const options = motionTransition as Record<string, unknown>
  const isSpring =
    options.type === "spring" || SPRING_KEYS.some((key) => key in options)

  if (isSpring) {
    const springOptions =
      typeof options.duration === "number"
        ? { ...options, duration: options.duration * 1000 }
        : options
    const { duration, ease: curve } = createGeneratorEasing(
      springOptions,
      100,
      springGenerator,
    )
    const ms = Math.round(duration * 1000)
    return { duration: ms, easing: generateLinearEasing(curve, ms) }
  }

  const seconds = typeof options.duration === "number" ? options.duration : 0.3
  return {
    duration: Math.round(seconds * 1000),
    easing: toCssEase(options.ease),
  }
}

type ReducedMotion = "user" | "never" | "always"

const ReducedMotionContext = React.createContext<ReducedMotion>("user")

function useReducedMotionSetting(): ReducedMotion {
  const own = React.use(ReducedMotionContext)
  const { reducedMotion } = React.use(MotionConfigContext)
  return reducedMotion === "always" ? "always" : own
}

export function ReducedMotionConfig({
  children,
}: {
  children: React.ReactNode
}) {
  const reducedMotion = useReducedMotionSetting()

  return (
    <MotionConfig reducedMotion={reducedMotion}>{children}</MotionConfig>
  )
}

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)"

function subscribeToReducedMotion(onChange: () => void) {
  const mql = window.matchMedia(REDUCED_MOTION_QUERY)
  mql.addEventListener("change", onChange)
  return () => mql.removeEventListener("change", onChange)
}

export function useShouldReduceMotion() {
  const reducedMotion = useReducedMotionSetting()
  const prefersReduced = React.useSyncExternalStore(
    subscribeToReducedMotion,
    () => window.matchMedia(REDUCED_MOTION_QUERY).matches,
    () => false,
  )

  if (reducedMotion === "never") return false
  return reducedMotion === "always" || prefersReduced
}

export { motionTokens }
