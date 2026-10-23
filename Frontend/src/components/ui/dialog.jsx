import * as React from "react"

import { cn } from "@/lib/utils"
import { mergeProps, useRender } from "@/lib/render"
import { Portal } from "@/lib/Portal"
import { getFocusRestoreTarget, getTabbables, useScrollLock } from "@/lib/focus"
import { usePopupTransition } from "@/lib/usePopupTransition"
import { useComposedRefs } from "@/lib/refs"

const DialogContext = React.createContext(null)
const openDialogs = []

function useDialogContext() {
  const context = React.useContext(DialogContext)
  if (!context) {
    throw new Error("Los componentes de Dialog deben usarse dentro de <Dialog>")
  }
  return context
}

function resolveInitialFocus(initialFocus, popup) {
  let target = initialFocus
  if (typeof target === "function") target = target()
  if (target && target.current) target = target.current
  if (target === false) return false
  if (target && typeof target.focus === "function") return target
  return getTabbables(popup)[0] ?? null
}

function Dialog({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  onOpenChangeComplete,
  modal = true,
  disablePointerDismissal = false,
  children,
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const open = openProp ?? uncontrolledOpen
  const dialogId = React.useId()
  const popupId = React.useId()
  const titleId = React.useId()
  const descriptionId = React.useId()
  const popupRef = React.useRef(null)
  const triggerRef = React.useRef(null)
  const previousFocusRef = React.useRef(null)
  const [hasTitle, setHasTitle] = React.useState(false)
  const [hasDescription, setHasDescription] = React.useState(false)

  const setOpen = React.useCallback(
    (nextOpen) => {
      if (openProp === undefined) {
        setUncontrolledOpen(nextOpen)
      }
      onOpenChange?.(nextOpen)
    },
    [openProp, onOpenChange]
  )

  const capturePreviousFocus = React.useCallback((element) => {
    if (!previousFocusRef.current && typeof document !== "undefined") {
      previousFocusRef.current = element ?? document.activeElement
    }
  }, [])

  const { mounted, status } = usePopupTransition(open, {
    elementRef: popupRef,
    onComplete(nextOpen) {
      if (!nextOpen) {
        const target = triggerRef.current ?? previousFocusRef.current
        if (target?.isConnected) {
          target.focus({ preventScroll: true })
        }
        previousFocusRef.current = null
      }
      onOpenChangeComplete?.(nextOpen)
    },
  })

  useScrollLock(open && modal)

  React.useEffect(() => {
    if (!open) return undefined
    const entry = { id: dialogId, close: () => setOpen(false) }
    openDialogs.push(entry)
    return () => {
      const index = openDialogs.indexOf(entry)
      if (index >= 0) openDialogs.splice(index, 1)
    }
  }, [open, dialogId, setOpen])

  const value = React.useMemo(
    () => ({
      id: dialogId,
      open,
      setOpen,
      mounted,
      status,
      modal,
      disablePointerDismissal,
      popupId,
      titleId,
      descriptionId,
      popupRef,
      triggerRef,
      capturePreviousFocus,
      hasTitle,
      setHasTitle,
      hasDescription,
      setHasDescription,
    }),
    [
      dialogId,
      open,
      setOpen,
      mounted,
      status,
      modal,
      disablePointerDismissal,
      popupId,
      titleId,
      descriptionId,
      capturePreviousFocus,
      hasTitle,
      hasDescription,
    ]
  )

  return <DialogContext.Provider value={value}>{children}</DialogContext.Provider>
}

function DialogTrigger({
  render,
  disabled = false,
  ref: forwardedRef,
  ...props
}) {
  const context = useDialogContext()
  const setRef = useComposedRefs(context.triggerRef, forwardedRef)

  return useRender({
    defaultTagName: "button",
    render,
    props: mergeProps(
      {
        "data-slot": "dialog-trigger",
        "aria-haspopup": "dialog",
        "aria-expanded": context.open,
        "data-popup-open": context.open ? "" : undefined,
        disabled: disabled || undefined,
        ref: setRef,
        onClick: (event) => {
          if (disabled) {
            event.preventDefault()
            return
          }
          context.capturePreviousFocus(document.activeElement)
          context.setOpen(!context.open)
        },
      },
      props
    ),
  })
}

function DialogClose({ render, disabled = false, ...props }) {
  const context = useDialogContext()

  return useRender({
    defaultTagName: "button",
    render,
    props: mergeProps(
      {
        "data-slot": "dialog-close",
        disabled: disabled || undefined,
        onClick: (event) => {
          if (disabled) {
            event.preventDefault()
            return
          }
          context.setOpen(false)
        },
      },
      props
    ),
  })
}

function DialogPortal({ children, container }) {
  const context = useDialogContext()
  if (!context.mounted) return null
  return <Portal container={container}>{children}</Portal>
}

function DialogBackdrop({ className, ...props }) {
  const context = useDialogContext()

  return useRender({
    defaultTagName: "div",
    props: mergeProps(
      {
        "data-slot": "dialog-backdrop",
        "aria-hidden": "true",
        "data-open": context.open ? "" : undefined,
        "data-closed": context.open ? undefined : "",
        "data-starting-style": context.status === "starting" ? "" : undefined,
        "data-ending-style": context.status === "ending" ? "" : undefined,
        className: cn(className),
        onClick: (event) => {
          if (event.defaultPrevented) return
          if (event.target !== event.currentTarget) return
          if (context.disablePointerDismissal) return
          context.setOpen(false)
        },
      },
      props
    ),
  })
}

function DialogPopup({
  className,
  render,
  initialFocus,
  ref: forwardedRef,
  ...props
}) {
  const context = useDialogContext()
  const {
    open,
    mounted,
    popupRef,
    capturePreviousFocus,
    modal,
    id,
    setOpen,
    triggerRef,
    disablePointerDismissal,
  } = context
  const setRef = useComposedRefs(popupRef, forwardedRef)

  React.useEffect(() => {
    if (!open || !mounted) return undefined
    const popup = popupRef.current
    if (!popup) return undefined

    capturePreviousFocus(getFocusRestoreTarget(popup))
    const frame = requestAnimationFrame(() => {
      const target = resolveInitialFocus(initialFocus, popup)
      if (target === false) {
        popup.focus({ preventScroll: true })
      } else if (target?.focus) {
        target.focus({ preventScroll: true })
      } else {
        popup.focus({ preventScroll: true })
      }
    })

    return () => cancelAnimationFrame(frame)
  }, [open, mounted, popupRef, capturePreviousFocus, initialFocus])

  React.useEffect(() => {
    if (!open || !modal) return undefined

    const popup = popupRef.current

    function handleKeyDown(event) {
      const isTopmost = openDialogs[openDialogs.length - 1]?.id === id
      if (!isTopmost) return

      if (event.key === "Escape") {
        event.preventDefault()
        event.stopPropagation()
        setOpen(false)
        return
      }

      if (event.key !== "Tab" || !popup) return

      const tabbables = getTabbables(popup)
      if (tabbables.length === 0) {
        event.preventDefault()
        popup.focus({ preventScroll: true })
        return
      }

      const first = tabbables[0]
      const last = tabbables[tabbables.length - 1]
      const active = document.activeElement

      if (event.shiftKey) {
        if (active === first || !popup.contains(active)) {
          event.preventDefault()
          last.focus({ preventScroll: true })
        }
      } else if (active === last || !popup.contains(active)) {
        event.preventDefault()
        first.focus({ preventScroll: true })
      }
    }

    function handlePointerDown(event) {
      if (disablePointerDismissal) return
      if (!popup || popup.contains(event.target)) return
      if (triggerRef.current?.contains(event.target)) return
      if (
        event.target.closest?.(
          '[data-slot="dropdown-menu-content"],[data-slot="dropdown-menu-positioner"],[data-slot="tooltip-content"]'
        )
      ) {
        return
      }
      setOpen(false)
    }

    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("pointerdown", handlePointerDown, true)
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("pointerdown", handlePointerDown, true)
    }
  }, [open, modal, id, setOpen, popupRef, triggerRef, disablePointerDismissal])

  return useRender({
    defaultTagName: "div",
    render,
    props: mergeProps(
      {
        "data-slot": "dialog-popup",
        id: context.popupId,
        role: "dialog",
        "aria-modal": context.modal ? "true" : undefined,
        "aria-labelledby": context.hasTitle ? context.titleId : undefined,
        "aria-describedby": context.hasDescription
          ? context.descriptionId
          : undefined,
        tabIndex: -1,
        "data-open": context.open ? "" : undefined,
        "data-closed": context.open ? undefined : "",
        "data-starting-style": context.status === "starting" ? "" : undefined,
        "data-ending-style": context.status === "ending" ? "" : undefined,
        className: cn(className),
        ref: setRef,
      },
      props
    ),
  })
}

function DialogTitle({ className, render, id, ...props }) {
  const context = useDialogContext()
  const { setHasTitle } = context

  React.useEffect(() => {
    setHasTitle(true)
    return () => setHasTitle(false)
  }, [setHasTitle])

  return useRender({
    defaultTagName: "h2",
    render,
    props: mergeProps(
      {
        "data-slot": "dialog-title",
        id: id ?? context.titleId,
        className: cn(className),
      },
      props
    ),
  })
}

function DialogDescription({ className, render, id, ...props }) {
  const context = useDialogContext()
  const { setHasDescription } = context

  React.useEffect(() => {
    setHasDescription(true)
    return () => setHasDescription(false)
  }, [setHasDescription])

  return useRender({
    defaultTagName: "p",
    render,
    props: mergeProps(
      {
        "data-slot": "dialog-description",
        id: id ?? context.descriptionId,
        className: cn(className),
      },
      props
    ),
  })
}

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogPortal,
  DialogBackdrop,
  DialogPopup,
  DialogTitle,
  DialogDescription,
}
