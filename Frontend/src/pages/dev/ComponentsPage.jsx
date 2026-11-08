import {
  AlertDialogExample1,
  AlertDialogExample5,
  AlertDialogExample9,
} from '@/pages/dev/examples/alert-dialog-examples'
import {
  ToastExampleAdd,
  ToastExamplePromise,
  ToastExampleUpdate,
} from '@/pages/dev/examples/toast-examples'
import {
  TabsExampleControlled,
  TabsExampleOverflow,
  TabsExampleUncontrolled,
} from '@/pages/dev/examples/tabs-examples'
import {
  PopoverExampleForm,
  PopoverExampleInfo,
} from '@/pages/dev/examples/popover-examples'

export default function ComponentsPage() {
  return (
    <div className="SurfaceLight CardRadius Elevation1" style={{ margin: 24, padding: 24, display: "flex", flexDirection: "column", gap: 24 }}>
      <h1 className="Header3">Componentes — Alert Dialog</h1>
      <p className="TextRegluar" style={{ color: "var(--ds-light-muted)" }}>
        Página de prueba (sin vínculos en el sidebar). Cada botón abre un Alert Dialog.
        Cierre con Escape, Cancelar, acción o clic fuera del diálogo.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        <AlertDialogExample1 />
        <AlertDialogExample5 />
        <AlertDialogExample9 />
      </div>

      <h2 className="Header4">Componentes — Toast</h2>
      <p className="TextRegluar" style={{ color: "var(--ds-light-muted)" }}>
        toast.add, toast.promise y toast.update contra la API real. Con
        &quot;reducir movimiento&quot; activado en el sistema, los toasts aparecen
        y desaparecen sin desplazarse.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        <ToastExampleAdd />
        <ToastExamplePromise />
        <ToastExampleUpdate />
      </div>

      <h2 className="Header4">Componentes — Tabs (pill)</h2>
      <p className="TextRegluar" style={{ color: "var(--ds-light-muted)" }}>
        Variante pill adaptada de beUI. No controlado, controlado con iconos que
        se abren en la pestaña activa, y overflow con flechas en un contenedor
        angosto.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        <TabsExampleUncontrolled />
        <TabsExampleControlled />
        <TabsExampleOverflow />
      </div>

      <h2 className="Header4">Componentes — Popover</h2>
      <p className="TextRegluar text-muted-foreground">
        Variante Base UI. Trigger con `render`, contenido informativo y un
        formulario corto con estado controlado. Cierre con Escape o clic fuera;
        el foco vuelve al trigger.
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        <PopoverExampleInfo />
        <PopoverExampleForm />
      </div>
    </div>
  )
}
