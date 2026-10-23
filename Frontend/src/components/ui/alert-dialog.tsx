import * as React from "react"
import { AlertDialog as AlertDialogPrimitive } from "@base-ui/react/alert-dialog"

import { Button } from "@/components/ui/button"

const AlertDialogContext = React.createContext({
  onOpenChange: undefined,
  closeOnOutsideClick: false,
})

function AlertDialog({ closeOnOutsideClick = false, onOpenChange, ...props }) {
  return (
    <AlertDialogContext.Provider value={{ onOpenChange, closeOnOutsideClick }}>
      <AlertDialogPrimitive.Root
        data-slot="alert-dialog"
        onOpenChange={onOpenChange}
        {...props}
      />
    </AlertDialogContext.Provider>
  )
}

function AlertDialogTrigger({ ...props }: AlertDialogPrimitive.Trigger.Props) {
  return (
    <AlertDialogPrimitive.Trigger data-slot="alert-dialog-trigger" {...props} />
  )
}

function AlertDialogPortal({ ...props }: AlertDialogPrimitive.Portal.Props) {
  return (
    <AlertDialogPrimitive.Portal data-slot="alert-dialog-portal" {...props} />
  )
}

function AlertDialogOverlay({ className, onClick, ...props }: AlertDialogPrimitive.Backdrop.Props) {
  const ctx = React.useContext(AlertDialogContext)
  const handleClick = (event) => {
    if (onClick) onClick(event)
    if (ctx.closeOnOutsideClick && !event.defaultPrevented) {
      ctx.onOpenChange?.(false)
    }
  }
  return (
    <AlertDialogPrimitive.Backdrop
      data-slot="alert-dialog-overlay"
      className={["AlertDialogOverlay", className].filter(Boolean).join(" ")}
      onClick={handleClick}
      {...props}
    />
  )
}

function AlertDialogContent({
  className,
  size = "default",
  closeOnOutsideClick,
  ...props
}: AlertDialogPrimitive.Popup.Props & {
  size?: "default" | "sm"
  closeOnOutsideClick?: boolean
}) {
  const ctx = React.useContext(AlertDialogContext)
  const enabled = closeOnOutsideClick ?? ctx.closeOnOutsideClick
  const overlayClick = enabled ? () => ctx.onOpenChange?.(false) : undefined
  return (
    <AlertDialogPortal>
      <AlertDialogOverlay onClick={overlayClick} />
      <AlertDialogPrimitive.Popup
        data-slot="alert-dialog-content"
        data-size={size}
        className={["AlertDialogContent", className].filter(Boolean).join(" ")}
        {...props}
      />
    </AlertDialogPortal>
  )
}

function AlertDialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={["AlertDialogHeader", className].filter(Boolean).join(" ")}
      {...props}
    />
  )
}

function AlertDialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-footer"
      className={["AlertDialogFooter", className].filter(Boolean).join(" ")}
      {...props}
    />
  )
}

function AlertDialogMedia({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-dialog-media"
      className={["AlertDialogMedia", className].filter(Boolean).join(" ")}
      {...props}
    />
  )
}

function AlertDialogTitle({ className, ...props }: AlertDialogPrimitive.Title.Props) {
  return (
    <AlertDialogPrimitive.Title
      data-slot="alert-dialog-title"
      className={["AlertDialogTitle", className].filter(Boolean).join(" ")}
      {...props}
    />
  )
}

function AlertDialogDescription({
  className,
  ...props
}: AlertDialogPrimitive.Description.Props) {
  return (
    <AlertDialogPrimitive.Description
      data-slot="alert-dialog-description"
      className={["AlertDialogDescription", className].filter(Boolean).join(" ")}
      {...props}
    />
  )
}

function AlertDialogAction({ className, ...props }: React.ComponentProps<typeof Button>) {
  return (
    <Button
      data-slot="alert-dialog-action"
      className={["AlertDialogAction", className].filter(Boolean).join(" ")}
      {...props}
    />
  )
}

function AlertDialogCancel({
  className,
  variant = "ghost",
  size = "default",
  ...props
}: AlertDialogPrimitive.Close.Props &
  Pick<React.ComponentProps<typeof Button>, "variant" | "size">) {
  return (
    <AlertDialogPrimitive.Close
      data-slot="alert-dialog-cancel"
      className={["AlertDialogCancel", className].filter(Boolean).join(" ")}
      render={<Button variant={variant} size={size} />}
      {...props}
    />
  )
}

export {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogOverlay,
  AlertDialogPortal,
  AlertDialogTitle,
  AlertDialogTrigger,
}
