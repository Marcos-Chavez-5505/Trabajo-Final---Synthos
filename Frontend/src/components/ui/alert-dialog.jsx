/* Alert dialog — AlertDialog, AlertDialogTrigger, AlertDialogContent,
 * AlertDialogHeader, AlertDialogMedia, AlertDialogTitle,
 * AlertDialogDescription, AlertDialogFooter, AlertDialogCancel,
 * AlertDialogAction.
 *
 * Traducido de ReUI (MIT, commit 067aa0d), variantes c-alert-dialog-1/5/9.
 * La mecánica la da el Dialog local (`components/ui/dialog.jsx`), el mismo
 * primitivo que usa el `Sheet`: focus trap, Escape, clic fuera, bloqueo del
 * scroll, `aria-labelledby`/`aria-describedby` y devolución del foco al
 * disparador. Los estilos viven en styles/components.css con los tokens del
 * proyecto.
 *
 * Lo que se agrega sobre la primitiva:
 *   - `role="alertdialog"` (el Dialog local expone `dialog`).
 *   - foco inicial en Cancelar (la acción segura), incluso en la variante 9,
 *     donde el checkbox aparece antes en el DOM.
 *   - `size`, `flush` y `layout` como data-attributes, que reemplazan las
 *     clases del original.
 */

import * as React from 'react'
import {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogPortal,
  DialogBackdrop,
  DialogPopup,
  DialogTitle,
  DialogDescription,
} from './dialog'
import { cn } from '@/lib/utils'

const AlertDialog = Dialog

function AlertDialogTrigger({ className, ...props }) {
  return (
    <DialogTrigger
      data-slot="alert-dialog-trigger"
      className={className}
      {...props}
    />
  )
}

function AlertDialogContent({
  size = 'default',
  flush = false,
  className,
  children,
  ...props
}) {
  const popupRef = React.useRef(null)

  // El Dialog local enfoca el primer elemento tabbable. En un alertdialog el
  // foco va a lo que no rompe nada: Cancelar. Se busca por el data-slot del
  // botón para que también funcione en la variante 9, donde el checkbox va
  // primero.
  const setInitialFocus = React.useCallback(() => {
    return (
      popupRef.current?.querySelector('[data-slot="alert-dialog-cancel"]') ??
      null
    )
  }, [])

  return (
    <DialogPortal>
      <DialogBackdrop
        data-slot="alert-dialog-backdrop"
        className="AlertDialogBackdrop"
      />
      <DialogPopup
        {...props}
        ref={popupRef}
        data-slot="alert-dialog-content"
        data-size={size}
        data-flush={flush ? 'true' : undefined}
        role="alertdialog"
        aria-modal="true"
        initialFocus={setInitialFocus}
        className={cn('AlertDialogContent', className)}
      >
        {children}
      </DialogPopup>
    </DialogPortal>
  )
}

function AlertDialogHeader({ className, ...props }) {
  return (
    <div
      data-slot="alert-dialog-header"
      className={cn('AlertDialogHeader', className)}
      {...props}
    />
  )
}

/**
 * Círculo de ícono del encabezado (variante 5). `variant` reemplaza las clases
 * `bg-destructive/10 text-destructive` del original por los tokens de ícono
 * semántico. El ícono se pasa como hijo, no como prop: así el componente no
 * depende de ninguna librería de íconos.
 */
function AlertDialogMedia({ variant = 'default', className, ...props }) {
  return (
    <div
      data-slot="alert-dialog-media"
      data-variant={variant}
      className={cn('AlertDialogMedia', className)}
      {...props}
    />
  )
}

function AlertDialogTitle({ className, ...props }) {
  return (
    <DialogTitle
      data-slot="alert-dialog-title"
      className={cn('AlertDialogTitle', className)}
      {...props}
    />
  )
}

function AlertDialogDescription({ className, ...props }) {
  return (
    <DialogDescription
      data-slot="alert-dialog-description"
      className={cn('AlertDialogDescription', className)}
      {...props}
    />
  )
}

/* `layout` reemplaza el className del original para la fila repartida de la
   variante 9 ("no volver a preguntar" + botones). */
function AlertDialogFooter({ layout = 'stack', className, ...props }) {
  return (
    <div
      data-slot="alert-dialog-footer"
      data-layout={layout}
      className={cn('AlertDialogFooter', className)}
      {...props}
    />
  )
}

/* Close ya cierra y devuelve el foco al disparador: no hace falta manejarlo a
   mano como con el `<dialog>` nativo. */
function AlertDialogCancel({ className, ...props }) {
  return (
    <DialogClose
      data-slot="alert-dialog-cancel"
      className={cn('AlertDialogCancel', className)}
      {...props}
    />
  )
}

function AlertDialogAction({ variant = 'default', className, ...props }) {
  return (
    <DialogClose
      data-slot="alert-dialog-action"
      data-variant={variant}
      className={cn('AlertDialogAction', className)}
      {...props}
    />
  )
}

export {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
}
