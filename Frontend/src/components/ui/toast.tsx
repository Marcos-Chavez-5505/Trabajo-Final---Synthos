"use client"

import * as React from "react"
import * as ToastPrimitive from "@/components/animate-ui/primitives/toast"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import checkIcon from "@synthos/shared/assets/icons/check.svg"
import closeIcon from "@synthos/shared/assets/icons/close.svg"

const toast = ToastPrimitive.createToastManager()

function ToastProvider(props: ToastPrimitive.ToastProviderProps) {
  return <ToastPrimitive.Provider {...props} />
}

function ToastPortal(props: ToastPrimitive.ToastPortalProps) {
  return <ToastPrimitive.Portal data-slot="toast-portal" {...props} />
}

function ToastViewport({
  className,
  ...props
}: ToastPrimitive.ToastViewportProps) {
  return (
    <ToastPrimitive.Viewport
      data-slot="toast-viewport"
      className={cn(
        // `bottom-24` (96px) deja libre la PlayerBar (carátula de 48px + py-3
        // + borde = 72px). El viewport es `fixed` y vive en el portal, así que
        // no lo afecta el `isolate` del layout del sidebar.
        "pointer-events-none fixed inset-x-4 bottom-24 z-50 mx-auto w-auto max-w-xs outline-none sm:right-4 sm:left-auto sm:mx-0 sm:w-full",
        className,
      )}
      {...props}
    />
  )
}

function Toast({ className, ...props }: ToastPrimitive.ToastRootProps) {
  return (
    <ToastPrimitive.Root
      data-slot="toast"
      className={cn(
        "group/toast pointer-events-auto absolute right-0 bottom-0 z-[calc(1000-var(--toast-index))] w-full origin-bottom rounded-[var(--ds-radius-lg)] border border-sidebar-border bg-popover text-popover-foreground will-change-transform outline-none select-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
        "[--gap:0.75rem] [--height:var(--toast-frontmost-height,var(--toast-height))]",
        "h-(--height)",
        "after:absolute after:top-full after:left-0 after:h-[calc(var(--gap)+1px)] after:w-full after:content-['']",
        "data-expanded:h-(--toast-height)",
        "data-limited:opacity-0",
        className,
      )}
      {...props}
    />
  )
}

function ToastContent({
  className,
  ...props
}: ToastPrimitive.ToastContentProps) {
  return (
    <ToastPrimitive.Content
      data-slot="toast-content"
      className={cn(
        "flex h-full items-center gap-2.5 overflow-hidden p-3 data-behind:opacity-0 data-expanded:opacity-100",
        className,
      )}
      {...props}
    />
  )
}

function ToastTitle({ className, ...props }: ToastPrimitive.ToastTitleProps) {
  return (
    <ToastPrimitive.Title
      data-slot="toast-title"
      className={cn("TextRegluar font-medium", className)}
      {...props}
    />
  )
}

function ToastDescription({
  className,
  ...props
}: ToastPrimitive.ToastDescriptionProps) {
  return (
    <ToastPrimitive.Description
      data-slot="toast-description"
      className={cn("TextMedium text-muted-foreground", className)}
      {...props}
    />
  )
}

function ToastAction({
  className,
  render = <Button variant="outline" size="sm" />,
  ...props
}: ToastPrimitive.ToastActionProps) {
  return (
    <ToastPrimitive.Action
      data-slot="toast-action"
      render={render}
      className={cn("shrink-0", className)}
      {...props}
    />
  )
}

function ToastClose({
  className,
  children,
  render = <Button variant="ghost" size="icon-sm" />,
  ...props
}: ToastPrimitive.ToastCloseProps) {
  return (
    <ToastPrimitive.Close
      data-slot="toast-close"
      aria-label="Cerrar notificación"
      render={render}
      className={cn(
        "relative shrink-0 text-muted-foreground after:absolute after:-inset-2 after:content-[''] hover:text-foreground",
        className,
      )}
      {...props}
    >
      {children ?? (
        <img src={closeIcon} alt="" aria-hidden="true" className="h-3.5 w-3.5" />
      )}
    </ToastPrimitive.Close>
  )
}

/**
 * Ícono por tipo. El set propio (`shared/assets/icons`) no tiene íconos de
 * estado: `success` usa el check y `loading` un spinner CSS. `error`, `info`
 * y `warning` quedan sin ícono a propósito: el único asset parecido a un error
 * es `close.svg`, que ya usa el botón de cerrar y se leería como duplicado.
 * Los SVG se importan como URL (regla 10), así que no se pueden recolorear.
 */
function ToastIcon({ type }: { type: string | undefined }) {
  if (type === "loading") {
    return (
      <span data-slot="toast-icon" className="shrink-0">
        <span
          aria-hidden="true"
          className="block size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent motion-reduce:animate-none"
        />
      </span>
    )
  }

  if (type !== "success") return null

  return (
    <span data-slot="toast-icon" className="shrink-0">
      <img src={checkIcon} alt="" aria-hidden="true" className="h-3.5 w-3.5" />
    </span>
  )
}

function ToastList() {
  const { toasts } = ToastPrimitive.useToastManager()

  return toasts.map((toastItem) => (
    <Toast key={toastItem.id} toast={toastItem}>
      <ToastContent>
        <ToastIcon type={toastItem.type} />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <ToastTitle />
          <ToastDescription />
        </div>
        <ToastAction />
        <ToastClose />
      </ToastContent>
    </Toast>
  ))
}

function Toaster({
  children,
  toastManager = toast,
  ...props
}: ToastPrimitive.ToastProviderProps) {
  return (
    <ToastProvider toastManager={toastManager} {...props}>
      {children}
      <ToastPortal>
        <ToastViewport>
          <ToastList />
        </ToastViewport>
      </ToastPortal>
    </ToastProvider>
  )
}

const createToastManager = ToastPrimitive.createToastManager
const useToastManager = ToastPrimitive.useToastManager

export {
  Toaster,
  Toast,
  ToastAction,
  ToastClose,
  ToastContent,
  ToastDescription,
  ToastIcon,
  ToastPortal,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  createToastManager,
  toast,
  useToastManager,
}
