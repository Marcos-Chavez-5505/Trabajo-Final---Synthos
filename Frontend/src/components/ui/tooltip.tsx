"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { mergeProps, useRender } from "@/lib/render"
import { Portal } from "@/lib/Portal"
import { getTransformOrigin, useAnchoredPosition } from "@/lib/floating"
import { usePopupTransition } from "@/lib/usePopupTransition"
import { useComposedRefs } from "@/lib/refs"

const DEFAULT_OPEN_DELAY = 600

const TooltipProviderContext = React.createContext(undefined)
const TooltipContext = React.createContext(null)
const TooltipPositionerContext = React.createContext({
  side: "top",
  align: "center",
  arrowStyle: undefined,
  setArrowNode: () => {},
})

function useTooltipContext() {
  const context = React.useContext(TooltipContext)
  if (!context) {
    throw new Error("TooltipTrigger y TooltipContent deben usarse dentro de <Tooltip>")
  }
  return context
}

function TooltipProvider({ delay = 0, closeDelay, children }) {
  const value = React.useMemo(
    () => ({ delay, closeDelay }),
    [delay, closeDelay]
  )
  return (
    <TooltipProviderContext.Provider value={value}>
      {children}
    </TooltipProviderContext.Provider>
  )
}

function Tooltip({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  delay,
  closeDelay,
  children,
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const open = openProp ?? uncontrolledOpen
  const [anchorEl, setAnchorEl] = React.useState(null)
  const [contentHidden, setContentHidden] = React.useState(false)
  const popupRef = React.useRef(null)
  const popupId = React.useId()
  const { mounted, status } = usePopupTransition(open, {
    elementRef: popupRef,
  })

  const setOpen = React.useCallback(
    (nextOpen) => {
      if (openProp === undefined) {
        setUncontrolledOpen(nextOpen)
      }
      onOpenChange?.(nextOpen)
    },
    [openProp, onOpenChange]
  )

  const value = React.useMemo(
    () => ({
      open,
      setOpen,
      anchorEl,
      setAnchorEl,
      contentHidden,
      setContentHidden,
      popupRef,
      popupId,
      mounted,
      status,
      delay,
      closeDelay,
    }),
    [
      open,
      setOpen,
      anchorEl,
      contentHidden,
      popupId,
      mounted,
      status,
      delay,
      closeDelay,
    ]
  )

  return <TooltipContext.Provider value={value}>{children}</TooltipContext.Provider>
}

function TooltipTrigger({
  render,
  delay,
  closeDelay,
  closeOnClick = true,
  disabled = false,
  ref: forwardedRef,
  ...props
}) {
  const context = useTooltipContext()
  const provider = React.useContext(TooltipProviderContext)
  const openTimer = React.useRef(0)
  const closeTimer = React.useRef(0)
  const setRef = useComposedRefs(context.setAnchorEl, forwardedRef)

  const clearTimers = React.useCallback(() => {
    clearTimeout(openTimer.current)
    clearTimeout(closeTimer.current)
    openTimer.current = 0
    closeTimer.current = 0
  }, [])

  React.useEffect(() => clearTimers, [clearTimers])

  const openDelay =
    delay ?? context.delay ?? provider?.delay ?? DEFAULT_OPEN_DELAY
  const closeDelayMs =
    closeDelay ?? context.closeDelay ?? provider?.closeDelay ?? 0

  const scheduleOpen = (event) => {
    if (disabled || event.pointerType !== "mouse") return
    clearTimers()
    openTimer.current = window.setTimeout(
      () => context.setOpen(true),
      Math.max(0, openDelay)
    )
  }

  const scheduleClose = (event) => {
    if (event.pointerType !== "mouse") return
    clearTimers()
    if (context.open) {
      closeTimer.current = window.setTimeout(
        () => context.setOpen(false),
        Math.max(0, closeDelayMs)
      )
    }
  }

  const renderedProps = mergeProps(
    // Los handlers acceden a refs recién al ejecutarse; no se leen en render.
    // oxlint-disable-next-line react/refs
    {
      "data-slot": "tooltip-trigger",
      "data-popup-open": context.open ? "" : undefined,
      "data-trigger-disabled": disabled ? "" : undefined,
      "aria-describedby":
        context.open && context.mounted && !context.contentHidden
          ? context.popupId
          : undefined,
      onPointerEnter: scheduleOpen,
      onPointerLeave: scheduleClose,
      onPointerDown: () => {
        if (disabled) return
        if (closeOnClick && !context.open) clearTimers()
      },
      onFocus: () => {
        if (disabled) return
        clearTimers()
        context.setOpen(true)
      },
      onBlur: () => {
        if (disabled) return
        clearTimers()
        context.setOpen(false)
      },
      onClick: () => {
        if (disabled) return
        clearTimers()
        if (closeOnClick && context.open) context.setOpen(false)
      },
      onKeyDown: (event) => {
        if (event.key === "Escape" && context.open) {
          event.preventDefault()
          context.setOpen(false)
        }
      },
    },
    props
  )
  renderedProps.ref = setRef

  return useRender({
    defaultTagName: "button",
    render,
    props: renderedProps,
  })
}

function TooltipContent({
  className,
  side = "top",
  sideOffset = 4,
  align = "center",
  alignOffset = 0,
  hidden = false,
  children,
  ...props
}) {
  const context = useTooltipContext()
  const { setContentHidden } = context

  React.useEffect(() => {
    setContentHidden(hidden)
    return () => setContentHidden(false)
  }, [hidden, setContentHidden])

  if (!context.mounted || hidden) return null

  return (
    <Portal>
      <TooltipPositioner
        side={side}
        align={align}
        sideOffset={sideOffset}
        alignOffset={alignOffset}
      >
        <TooltipPopup className={className} {...props}>
          {children}
        </TooltipPopup>
      </TooltipPositioner>
    </Portal>
  )
}

function TooltipPositioner({ side, align, sideOffset, alignOffset, children }) {
  const context = useTooltipContext()
  const arrowRef = React.useRef(null)
  const setArrowNode = React.useCallback((node) => {
    arrowRef.current = node
  }, [])
  const {
    setFloating,
    floatingStyles,
    side: resolvedSide,
    align: resolvedAlign,
    arrowStyle,
  } = useAnchoredPosition({
    open: true,
    anchor: context.anchorEl,
    side,
    align,
    sideOffset,
    alignOffset,
    arrowRef,
  })

  const style = {
    ...floatingStyles,
    "--transform-origin": getTransformOrigin(resolvedSide, resolvedAlign),
  }

  return (
    <TooltipPositionerContext.Provider
      value={{
        side: resolvedSide,
        align: resolvedAlign,
        arrowStyle,
        setArrowNode,
      }}
    >
      <div
        ref={setFloating}
        style={style}
        data-side={resolvedSide}
        data-align={resolvedAlign}
        className="isolate z-50"
      >
        {children}
      </div>
    </TooltipPositionerContext.Provider>
  )
}

function TooltipPopup({ className, children, ref: forwardedRef, ...props }) {
  const context = useTooltipContext()
  const positioner = React.useContext(TooltipPositionerContext)
  const setRef = useComposedRefs(context.popupRef, forwardedRef)

  const renderedProps = mergeProps(
    {
      "data-slot": "tooltip-content",
      id: context.popupId,
      role: "tooltip",
      "data-open": context.open ? "" : undefined,
      "data-closed": context.open ? undefined : "",
      "data-starting-style": context.status === "starting" ? "" : undefined,
      "data-ending-style": context.status === "ending" ? "" : undefined,
      "data-side": positioner.side,
      "data-align": positioner.align,
      className: cn(
        "bg-foreground text-background z-50 select-none inline-flex w-fit max-w-xs origin-(--transform-origin) items-center gap-1.5 rounded-md px-3 py-1.5 text-xs has-data-[slot=kbd]:pr-1.5 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 **:data-[slot=kbd]:relative **:data-[slot=kbd]:isolate **:data-[slot=kbd]:z-50 **:data-[slot=kbd]:rounded-sm data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
        className
      ),
      children: (
        <>
          {children}
          <TooltipArrow className="bg-foreground fill-foreground z-50 size-2.5 translate-y-[calc(-50%-2px)] rotate-45 rounded-xs data-[side=bottom]:top-1 data-[side=inline-end]:top-1/2! data-[side=inline-end]:-left-1 data-[side=inline-end]:-translate-y-1/2 data-[side=inline-start]:top-1/2! data-[side=inline-start]:-right-1 data-[side=inline-start]:-translate-y-1/2 data-[side=left]:top-1/2! data-[side=left]:-right-1 data-[side=left]:-translate-y-1/2 data-[side=right]:top-1/2! data-[side=right]:-left-1 data-[side=right]:-translate-y-1/2 data-[side=top]:-bottom-2.5" />
        </>
      ),
    },
    props
  )
  renderedProps.ref = setRef

  return useRender({
    defaultTagName: "div",
    props: renderedProps,
  })
}

function TooltipArrow({ className, style, ...props }) {
  const { setArrowNode, side, arrowStyle } = React.useContext(
    TooltipPositionerContext
  )

  return (
    <div
      {...props}
      ref={setArrowNode}
      data-side={side}
      style={{ ...arrowStyle, ...style }}
      className={className}
    />
  )
}

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
