import * as React from "react"

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "object",
  "embed",
  "[contenteditable]",
  "[tabindex]:not([tabindex='-1'])",
].join(",")

export function getTabbables(container) {
  if (!container) return []

  return Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
    (element) => {
      if (element.closest("[inert]")) return false
      if (element.getAttribute("aria-hidden") === "true") return false
      const style = window.getComputedStyle(element)
      return (
        style.display !== "none" &&
        style.visibility !== "hidden" &&
        element.getClientRects().length > 0
      )
    }
  )
}

let lastFocusedElement = null
let previousFocusedElement = null

// `autoFocus` mueve el foco dentro del popup durante el commit, antes de que
// corran los efectos. Para devolverlo al disparador hace falta saber cuál era
// el foco anterior, no el actual.
if (typeof document !== "undefined") {
  document.addEventListener(
    "focusin",
    (event) => {
      if (event.target === lastFocusedElement) return
      previousFocusedElement = lastFocusedElement
      lastFocusedElement = event.target
    },
    true
  )
}

export function getFocusRestoreTarget(container) {
  const active = document.activeElement
  if (container && active && container.contains(active)) {
    return previousFocusedElement
  }
  return active
}

let scrollLockCount = 0
let originalOverflow = ""
let originalPaddingRight = ""

/**
 * Bloqueo del scroll del body con conteo de referencias, para que un menú
 * dentro de un diálogo no libere el scroll al cerrarse el menú.
 */
export function useScrollLock(locked) {
  React.useEffect(() => {
    if (!locked || typeof document === "undefined") return undefined

    if (scrollLockCount === 0) {
      const body = document.body
      const scrollbarGap = window.innerWidth - document.documentElement.clientWidth
      originalOverflow = body.style.overflow
      originalPaddingRight = body.style.paddingRight
      body.style.overflow = "hidden"
      if (scrollbarGap > 0) {
        const currentPadding = Number.parseFloat(window.getComputedStyle(body).paddingRight) || 0
        body.style.paddingRight = `${currentPadding + scrollbarGap}px`
      }
    }

    scrollLockCount += 1

    return () => {
      scrollLockCount -= 1
      if (scrollLockCount === 0) {
        document.body.style.overflow = originalOverflow
        document.body.style.paddingRight = originalPaddingRight
      }
    }
  }, [locked])
}
