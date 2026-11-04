import {
  AlertDialogExample1,
  AlertDialogExample5,
  AlertDialogExample9,
} from "@/components/ui/alert-dialog-examples"
import {
  ToastExampleAdd,
  ToastExamplePromise,
  ToastExampleUpdate,
} from "@/components/ui/toast-examples"

export default function Components() {
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
    </div>
  )
}
