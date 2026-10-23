import { useId, useState } from 'react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../components/ui/alert-dialog'
import { Checkbox } from '../components/ui/checkbox'
import { TrashIcon, WarningIcon } from '../components/ui/icons'

/**
 * "/componentes": catálogo de los componentes traídos de ReUI (MIT) y
 * adaptados al design system del proyecto.
 *
 * No es una pantalla de producto: es el lugar donde se verifica a ojo que las
 * variantes se comporten y se vean como el original, sin datos falsos que
 * después haya que mantener. Por eso vive en `pages/` y no en `features/`.
 */
export default function Componentes() {
  return (
    <section className="px-6 py-4 md:px-10">
      <h1 className="Header3">Componentes</h1>
      <p className="mt-1 max-w-2xl TextRegluar text-muted-foreground">
        Alert dialog adaptado desde ReUI sobre el Dialog local, con los
        estilos del proyecto en <code>styles/components.css</code>.
      </p>

      <AlertDialogSection />
    </section>
  )
}

/* -------------------------------------------------------------------------
 * Alert dialog
 * ---------------------------------------------------------------------- */

function AlertDialogSection() {
  return (
    <div className="mt-10">
      <h2 className="Header4">Alert dialog</h2>
      <p className="mt-1 TextMedium text-muted-foreground">
        Foco inicial en Cancelar, Escape cancela, el clic en el fondo cancela y
        confirmar cierra. Entrada y salida animadas.
      </p>

      <div className="mt-6 grid gap-10 md:grid-cols-3">
        <article>
          <h3 className="TextLarge">1 · Básico</h3>
          <p className="mt-1 TextMedium text-muted-foreground">
            Título, descripción y dos acciones.
          </p>
          <div className="mt-4">
            <AlertDialogBasic />
          </div>
        </article>

        <article>
          <h3 className="TextLarge">5 · Con ícono</h3>
          <p className="mt-1 TextMedium text-muted-foreground">
            Acción destructiva con círculo de ícono.
          </p>
          <div className="mt-4">
            <AlertDialogWithIcon />
          </div>
        </article>

        <article>
          <h3 className="TextLarge">9 · Con opción</h3>
          <p className="mt-1 TextMedium text-muted-foreground">
            Frame, checkbox de &quot;no volver a preguntar&quot; y footer
            repartido.
          </p>
          <div className="mt-4">
            <AlertDialogWithFrame />
          </div>
        </article>
      </div>
    </div>
  )
}

/** c-alert-dialog-1 */
function AlertDialogBasic() {
  return (
    <AlertDialog>
      <AlertDialogTrigger className="rounded px-4 py-2 Volume Button hover:brightness-110">
        Abrir diálogo
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>¿Seguro que querés continuar?</AlertDialogTitle>
          <AlertDialogDescription>
            Esta acción no se puede deshacer. Se va a borrar tu cuenta y todos
            tus datos de nuestros servidores.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="AlertDialogButton">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction>Continuar</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/** c-alert-dialog-5 */
function AlertDialogWithIcon() {
  return (
    <AlertDialog>
      <AlertDialogTrigger className="rounded px-4 py-2 Salmon Button hover:brightness-110">
        Eliminar chat
      </AlertDialogTrigger>
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogMedia variant="danger">
            <TrashIcon />
          </AlertDialogMedia>
          <AlertDialogTitle>¿Eliminar este chat?</AlertDialogTitle>
          <AlertDialogDescription>
            Se borran los mensajes para todos los participantes. No se puede
            deshacer.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel className="AlertDialogButton">
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction variant="destructive">
            Eliminar
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/** c-alert-dialog-9 */
function AlertDialogWithFrame() {
  const id = useId()
  const [remember, setRemember] = useState(false)

  return (
    <AlertDialog>
      <AlertDialogTrigger className="rounded px-4 py-2 Volume Button hover:brightness-110">
        Descartar cambios
      </AlertDialogTrigger>
      <AlertDialogContent flush>
        <div className="Frame">
          <div className="FramePanel">
            <div className="flex items-start gap-3">
              <span className="ComponentIconBadge">
                <WarningIcon />
              </span>
              <div>
                <AlertDialogTitle>¿Descartar los cambios?</AlertDialogTitle>
                <AlertDialogDescription>
                  Perdés lo que editaste desde la última vez que guardaste.
                </AlertDialogDescription>
              </div>
            </div>

            <AlertDialogFooter layout="split" className="mt-6">
              <div className="AlertDialogRemember">
                <Checkbox
                  id={id}
                  checked={remember}
                  onCheckedChange={setRemember}
                />
                <label htmlFor={id} className="AlertDialogRememberLabel">
                  No volver a preguntar
                </label>
              </div>
              <div className="AlertDialogButtons">
                <AlertDialogCancel className="AlertDialogButton">
                  Seguir editando
                </AlertDialogCancel>
                <AlertDialogAction variant="destructive">
                  Descartar
                </AlertDialogAction>
              </div>
            </AlertDialogFooter>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
