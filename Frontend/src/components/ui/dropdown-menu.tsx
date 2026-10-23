import * as React from "react"

import { cn } from "@/lib/utils"
import { mergeProps, useRender, type RenderProp } from "@/lib/render"
import { Portal } from "@/lib/Portal"
import { getTransformOrigin, useAnchoredPosition } from "@/lib/floating"
import { usePopupTransition } from "@/lib/usePopupTransition"
import { useScrollLock } from "@/lib/focus"
import { useComposedRefs } from "@/lib/refs"
import checkIcon from "@/assets/check.svg"

const itemClass =
  "relative flex w-full cursor-pointer select-none items-center gap-2.5 rounded-sm px-2 py-1.5 TextRegluar text-popover-foreground outline-hidden transition-colors data-disabled:pointer-events-none data-disabled:opacity-50 data-highlighted:bg-sidebar-accent data-highlighted:text-sidebar-accent-foreground [&_img]:size-4 [&_img]:shrink-0"

const MenuContext = React.createContext<any>(null)
const MenuPositionerContext = React.createContext({
  side: "bottom",
  align: "start",
})
const MenuGroupContext = React.createContext<React.Dispatch<
  React.SetStateAction<string | undefined>
> | null>(null)

function useMenuContext() {
  const context = React.useContext(MenuContext)
  if (!context) {
    throw new Error("Los componentes de DropdownMenu deben usarse dentro de <DropdownMenu>")
  }
  return context
}

function getMenuItems(popup: HTMLElement | null) {
  if (!popup) return []

  return Array.from(
    popup.querySelectorAll<HTMLElement>(
      '[role="menuitem"],[role="menuitemcheckbox"]'
    )
  ).filter(
    (item) =>
      item.getAttribute("aria-disabled") !== "true" &&
      item.getClientRects().length > 0
  )
}

function getItemLabel(item: HTMLElement) {
  return (item.getAttribute("data-menu-label") || item.textContent || "")
    .trim()
    .toLowerCase()
}

type MenuRootProps = {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  onOpenChangeComplete?: (open: boolean) => void
  modal?: boolean
  disabled?: boolean
  children?: React.ReactNode
}

function DropdownMenu({
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  onOpenChangeComplete,
  modal = true,
  disabled = false,
  children,
}: MenuRootProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
  const open = openProp ?? uncontrolledOpen
  const popupRef = React.useRef<HTMLDivElement | null>(null)
  const triggerRef = React.useRef<HTMLElement | null>(null)
  const [focusLast, setFocusLast] = React.useState(false)
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null)
  const [highlightedId, setHighlightedId] = React.useState<string | null>(null)
  const triggerId = React.useId()
  const popupId = React.useId()

  const setOpen = React.useCallback(
    (nextOpen: boolean) => {
      if (openProp === undefined) {
        setUncontrolledOpen(nextOpen)
      }
      onOpenChange?.(nextOpen)
    },
    [openProp, onOpenChange]
  )

  const { mounted, status } = usePopupTransition(open, {
    elementRef: popupRef,
    onComplete(nextOpen) {
      if (!nextOpen) {
        setHighlightedId(null)
        setFocusLast(false)
        const target = triggerRef.current
        if (target?.isConnected) {
          target.focus({ preventScroll: true })
        }
      }
      onOpenChangeComplete?.(nextOpen)
    },
  })

  useScrollLock(open && modal)

  const value = React.useMemo(
    () => ({
      open,
      setOpen,
      mounted,
      status,
      modal,
      disabled,
      popupRef,
      triggerRef,
      anchorEl,
      setAnchorEl,
      highlightedId,
      setHighlightedId,
      focusLast,
      setFocusLast,
      triggerId,
      popupId,
    }),
    [
      open,
      setOpen,
      mounted,
      status,
      modal,
      disabled,
      anchorEl,
      highlightedId,
      focusLast,
      triggerId,
      popupId,
    ]
  )

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>
}

type MenuTriggerProps = React.ComponentPropsWithoutRef<"button"> & {
  render?: RenderProp
  disabled?: boolean
  ref?: React.Ref<HTMLElement>
}

function DropdownMenuTrigger({
  render,
  disabled = false,
  ref: forwardedRef,
  ...props
}: MenuTriggerProps) {
  const context = useMenuContext()
  const setRef = useComposedRefs(
    context.triggerRef,
    context.setAnchorEl,
    forwardedRef
  )
  const isDisabled = disabled || context.disabled

  function handleClick(event: React.MouseEvent<HTMLElement>) {
    if (isDisabled) {
      event.preventDefault()
      return
    }

    if (context.open) {
      context.setOpen(false)
      return
    }

    context.setFocusLast(false)
    context.setOpen(true)
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLElement>) {
    if (isDisabled) return

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault()
      const last = event.key === "ArrowUp"

      if (!context.open) {
        context.setFocusLast(last)
        context.setOpen(true)
        return
      }

      const items = getMenuItems(context.popupRef.current)
      const target = last ? items[items.length - 1] : items[0]
      if (target) {
        context.setHighlightedId(target.id)
        target.focus({ preventScroll: true })
      }
      return
    }

    if (event.key === "Escape" && context.open) {
      event.preventDefault()
      context.setOpen(false)
      return
    }

    if (
      (event.key === "Enter" || event.key === " ") &&
      event.currentTarget.tagName !== "BUTTON"
    ) {
      event.preventDefault()
      handleClick(event as unknown as React.MouseEvent<HTMLElement>)
    }
  }

  return useRender({
    defaultTagName: "button",
    render,
    props: mergeProps(
      {
        "data-slot": "dropdown-menu-trigger",
        id: context.triggerId,
        "aria-haspopup": "menu",
        "aria-expanded": context.open,
        "aria-controls": context.open ? context.popupId : undefined,
        "data-popup-open": context.open ? "" : undefined,
        disabled: isDisabled || undefined,
        ref: setRef,
        onClick: handleClick,
        onKeyDown: handleKeyDown,
      },
      props
    ),
  })
}

function DropdownMenuPortal({
  children,
  container,
}: {
  children?: React.ReactNode
  container?: Element | DocumentFragment
}) {
  const context = useMenuContext()
  if (!context.mounted) return null

  return (
    <Portal container={container}>
      {context.modal && (
        <div
          data-slot="dropdown-menu-backdrop"
          aria-hidden="true"
          className="fixed inset-0 z-40"
          onPointerDown={(event) => {
            event.preventDefault()
            context.setOpen(false)
          }}
        />
      )}
      {children}
    </Portal>
  )
}

type MenuPositionerProps = React.ComponentPropsWithoutRef<"div"> & {
  side?: "top" | "right" | "bottom" | "left" | "inline-start" | "inline-end"
  align?: "start" | "center" | "end"
  sideOffset?: number
  alignOffset?: number
  collisionPadding?: number
  ref?: React.Ref<HTMLDivElement>
}

function DropdownMenuPositioner({
  className,
  style,
  side = "bottom",
  align = "start",
  sideOffset = 6,
  alignOffset = 0,
  collisionPadding = 8,
  ref: forwardedRef,
  ...props
}: MenuPositionerProps) {
  const context = useMenuContext()
  const {
    setFloating,
    floatingStyles,
    side: resolvedSide,
    align: resolvedAlign,
  } = useAnchoredPosition({
    open: true,
    anchor: context.anchorEl,
    side,
    align,
    sideOffset,
    alignOffset,
    collisionPadding,
  })
  const setRef = useComposedRefs(setFloating, forwardedRef)

  return (
    <MenuPositionerContext.Provider
      value={{ side: resolvedSide, align: resolvedAlign }}
    >
      <div
        {...props}
        ref={setRef}
        data-slot="dropdown-menu-positioner"
        data-side={resolvedSide}
        data-align={resolvedAlign}
        data-open={context.open ? "" : undefined}
        data-closed={context.open ? undefined : ""}
        className={cn("z-50", className)}
        style={{
          ...floatingStyles,
          ...style,
          "--transform-origin": getTransformOrigin(resolvedSide, resolvedAlign),
        }}
      />
    </MenuPositionerContext.Provider>
  )
}

type MenuPopupProps = React.ComponentPropsWithoutRef<"div"> & {
  render?: RenderProp
  ref?: React.Ref<HTMLDivElement>
}

function DropdownMenuPopup({
  className,
  render,
  ref: forwardedRef,
  ...props
}: MenuPopupProps) {
  const context = useMenuContext()
  const positioner = React.useContext(MenuPositionerContext)
  const { open, mounted, popupRef, highlightedId, focusLast, setHighlightedId } =
    context
  const setRef = useComposedRefs(popupRef, forwardedRef)
  const typeahead = React.useRef({ buffer: "", time: 0 })

  React.useEffect(() => {
    if (!open || !mounted) return undefined
    const popup = popupRef.current
    if (!popup) return undefined

    let frame = 0

    function focusInitial() {
      const items = getMenuItems(popup)
      if (items.length === 0) {
        if (document.activeElement !== popup) {
          popup.focus({ preventScroll: true })
        }
        return
      }

      if (items.some((item) => item.id === highlightedId)) return

      const target = focusLast ? items[items.length - 1] : items[0]
      setHighlightedId(target.id)
      target.focus({ preventScroll: true })
    }

    frame = requestAnimationFrame(focusInitial)
    const observer = new MutationObserver(focusInitial)
    observer.observe(popup, { childList: true, subtree: true })

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [open, mounted, popupRef, highlightedId, focusLast, setHighlightedId])

  function focusItem(item: HTMLElement) {
    context.setHighlightedId(item.id)
    item.focus({ preventScroll: true })
  }

  function handleTypeahead(
    key: string,
    items: HTMLElement[],
    currentIndex: number,
    now: number
  ) {
    const state = typeahead.current
    if (now - state.time > 500) state.buffer = ""
    state.buffer += key.toLowerCase()
    state.time = now

    const ordered = [
      ...items.slice(currentIndex + 1),
      ...items.slice(0, currentIndex + 1),
    ]
    const match = ordered.find((item) =>
      getItemLabel(item).startsWith(state.buffer)
    )
    if (!match) return false

    focusItem(match)
    return true
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.defaultPrevented) return

    const popup = context.popupRef.current
    const items = getMenuItems(popup)
    if (items.length === 0) return

    const currentIndex = items.findIndex(
      (item) => item.id === context.highlightedId
    )

    function move(delta: number) {
      event.preventDefault()
      const start = currentIndex === -1 ? (delta > 0 ? -1 : 0) : currentIndex
      const nextIndex = (start + delta + items.length) % items.length
      focusItem(items[nextIndex])
    }

    switch (event.key) {
      case "ArrowDown":
        move(1)
        return
      case "ArrowUp":
        move(-1)
        return
      case "Home":
        event.preventDefault()
        focusItem(items[0])
        return
      case "End":
        event.preventDefault()
        focusItem(items[items.length - 1])
        return
      case "Escape":
        event.preventDefault()
        event.stopPropagation()
        context.setOpen(false)
        return
      case "Tab":
        event.preventDefault()
        context.setOpen(false)
        return
      case "Enter":
      case " ": {
        const target = items[currentIndex] ?? document.activeElement
        if (!(target instanceof HTMLElement)) return
        if (target.tagName === "BUTTON" || target.tagName === "A") return
        event.preventDefault()
        target.click()
        return
      }
      default:
        if (
          event.key.length === 1 &&
          !event.ctrlKey &&
          !event.metaKey &&
          !event.altKey
        ) {
          if (handleTypeahead(event.key, items, currentIndex, event.timeStamp)) {
            event.preventDefault()
          }
        }
    }
  }

  const renderedProps = mergeProps(
    // `handleKeyDown` accede al ref del typeahead recién al ejecutarse.
    // oxlint-disable-next-line react/refs
    {
      "data-slot": "dropdown-menu-content",
      id: context.popupId,
      role: "menu",
      "aria-labelledby": context.triggerId,
      "aria-orientation": "vertical",
      tabIndex: -1,
      "data-open": context.open ? "" : undefined,
      "data-closed": context.open ? undefined : "",
      "data-starting-style": context.status === "starting" ? "" : undefined,
      "data-ending-style": context.status === "ending" ? "" : undefined,
      "data-side": positioner.side,
      "data-align": positioner.align,
      className: cn(
        "max-h-[var(--available-height)] w-max min-w-52 origin-[var(--transform-origin)] overflow-y-auto rounded-lg border border-sidebar-border bg-popover p-1 shadow-lg transition-[transform,scale,opacity] duration-150 ease-out data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0",
        className
      ),
      onKeyDown: handleKeyDown,
    },
    props
  )
  renderedProps.ref = setRef

  return useRender({
    defaultTagName: "div",
    render,
    props: renderedProps,
  })
}

type MenuItemProps = React.ComponentPropsWithoutRef<"div"> & {
  render?: RenderProp
  label?: string
  nativeButton?: boolean
  disabled?: boolean
  closeOnClick?: boolean
}

function DropdownMenuItem({
  className,
  render,
  label,
  nativeButton: _nativeButton,
  disabled = false,
  closeOnClick = true,
  ...props
}: MenuItemProps) {
  const context = useMenuContext()
  const id = React.useId()
  const highlighted = context.highlightedId === id

  return useRender({
    defaultTagName: "div",
    render,
    props: mergeProps(
      {
        id,
        role: "menuitem",
        tabIndex: highlighted ? 0 : -1,
        "data-slot": "dropdown-menu-item",
        "data-highlighted": highlighted ? "" : undefined,
        "data-disabled": disabled ? "" : undefined,
        "aria-disabled": disabled ? "true" : undefined,
        "data-menu-label": label,
        className: cn(itemClass, className),
        onClick: (event: React.MouseEvent<HTMLElement>) => {
          if (disabled) {
            event.preventDefault()
            return
          }
          if (closeOnClick) context.setOpen(false)
        },
        onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
          if (disabled) return
          context.setHighlightedId(id)
          if (document.activeElement !== event.currentTarget) {
            event.currentTarget.focus({ preventScroll: true })
          }
        },
      },
      props
    ),
  })
}

type MenuLinkItemProps = React.ComponentPropsWithoutRef<"a"> & {
  render?: RenderProp
  label?: string
  closeOnClick?: boolean
}

function DropdownMenuLinkItem({
  className,
  render,
  label,
  closeOnClick = false,
  ...props
}: MenuLinkItemProps) {
  const context = useMenuContext()
  const id = React.useId()
  const highlighted = context.highlightedId === id

  return useRender({
    defaultTagName: "a",
    render,
    props: mergeProps(
      {
        id,
        role: "menuitem",
        tabIndex: highlighted ? 0 : -1,
        "data-slot": "dropdown-menu-link-item",
        "data-highlighted": highlighted ? "" : undefined,
        "data-menu-label": label,
        className: cn(itemClass, className),
        onClick: () => {
          if (closeOnClick) context.setOpen(false)
        },
        onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
          context.setHighlightedId(id)
          if (document.activeElement !== event.currentTarget) {
            event.currentTarget.focus({ preventScroll: true })
          }
        },
      },
      props
    ),
  })
}

type MenuCheckboxItemProps = React.ComponentPropsWithoutRef<"div"> & {
  render?: RenderProp
  label?: string
  nativeButton?: boolean
  disabled?: boolean
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  closeOnClick?: boolean
}

function DropdownMenuCheckboxItem({
  className,
  render,
  label,
  nativeButton: _nativeButton,
  disabled = false,
  checked: checkedProp,
  defaultChecked = false,
  onCheckedChange,
  closeOnClick = false,
  children,
  ...props
}: MenuCheckboxItemProps) {
  const context = useMenuContext()
  const id = React.useId()
  const highlighted = context.highlightedId === id
  const [uncontrolledChecked, setUncontrolledChecked] =
    React.useState(defaultChecked)
  const checked = checkedProp ?? uncontrolledChecked

  function handleClick(event: React.MouseEvent<HTMLElement>) {
    if (disabled) {
      event.preventDefault()
      return
    }

    const nextChecked = !checked
    onCheckedChange?.(nextChecked)
    if (checkedProp === undefined) {
      setUncontrolledChecked(nextChecked)
    }
    if (closeOnClick) context.setOpen(false)
  }

  return useRender({
    defaultTagName: "div",
    render,
    props: mergeProps(
      {
        id,
        role: "menuitemcheckbox",
        "aria-checked": checked,
        tabIndex: highlighted ? 0 : -1,
        "data-slot": "dropdown-menu-checkbox-item",
        "data-highlighted": highlighted ? "" : undefined,
        "data-disabled": disabled ? "" : undefined,
        "data-checked": checked ? "" : undefined,
        "aria-disabled": disabled ? "true" : undefined,
        "data-menu-label": label,
        className: cn(itemClass, "pl-8", className),
        onClick: handleClick,
        onPointerMove: (event: React.PointerEvent<HTMLElement>) => {
          if (disabled) return
          context.setHighlightedId(id)
          if (document.activeElement !== event.currentTarget) {
            event.currentTarget.focus({ preventScroll: true })
          }
        },
        children: (
          <>
            {checked && (
              <span
                data-slot="dropdown-menu-checkbox-item-indicator"
                className="absolute left-2 flex items-center justify-center"
              >
                <img src={checkIcon} alt="" aria-hidden="true" />
              </span>
            )}
            {children}
          </>
        ),
      },
      props
    ),
  })
}

function DropdownMenuGroup({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [labelId, setLabelId] = React.useState<string | undefined>(undefined)

  return (
    <MenuGroupContext.Provider value={setLabelId}>
      <div
        role="group"
        aria-labelledby={labelId}
        data-slot="dropdown-menu-group"
        className={cn(className)}
        {...props}
      />
    </MenuGroupContext.Provider>
  )
}

function DropdownMenuGroupLabel({
  className,
  id: idProp,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const generatedId = React.useId()
  const id = idProp ?? generatedId
  const setLabelId = React.useContext(MenuGroupContext)

  React.useEffect(() => {
    if (!setLabelId) return undefined
    setLabelId(id)
    return () => {
      setLabelId((current) => (current === id ? undefined : current))
    }
  }, [id, setLabelId])

  return (
    <div
      id={id}
      aria-hidden="true"
      data-slot="dropdown-menu-group-label"
      className={cn("flex flex-col gap-0.5 px-2 py-1.5 text-left", className)}
      {...props}
    />
  )
}

function DropdownMenuSeparator({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      data-slot="dropdown-menu-separator"
      className={cn("-mx-1 my-1 h-px bg-sidebar-border", className)}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuPortal,
  DropdownMenuPositioner,
  DropdownMenuPopup,
  DropdownMenuGroup,
  DropdownMenuGroupLabel,
  DropdownMenuItem,
  DropdownMenuLinkItem,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
}
