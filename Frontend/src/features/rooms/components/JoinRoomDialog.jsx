import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { joinRoom } from '@synthos/shared'
import { toastMessages } from '@/lib/toastMessages.js'

/**
 * Modal "Unirme con código" (TS-14).
 *
 * Es la única vía de entrada a una sala privada (D14): las privadas no salen en el
 * listado de `/salas`, así que sin este diálogo no habría forma de llegar a una.
 * Se entra con el código, sin contraseña (D27).
 *
 * El modal de este flujo es el `Sheet` de Base UI; el buscador de personas de
 * las playlists usa el `Dialog` de `components/ui`.
 */
export default function JoinRoomDialog({
  open,
  onOpenChange,
  currentRoom,
  isCurrentHost,
}) {
  const navigate = useNavigate()

  const [code, setCode] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()

    if (pending) return

    setError('')

    if (!code.trim()) {
      setError('Escribí el código de la sala.')
      return
    }

    setPending(true)

    try {
      const joined = await joinRoom(code)

      onOpenChange(false)
      navigate(`/salas/${joined.id}`)
    } catch (cause) {
      toastMessages.roomJoinError(cause)
      setPending(false)
    }
  }

  function handleOpenChange(next) {
    if (!next) {
      setCode('')
      setError('')
      setPending(false)
    }

    onOpenChange(next)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Unirme con código</SheetTitle>
          <SheetDescription>
            Las salas privadas no aparecen en el listado: entrás con el código que
            te pasó quien la creó.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-4 pb-4">
          {currentRoom && (
            <div className="rounded-lg px-3 py-2 Volume TextTiny">
              <p>
                {isCurrentHost
                  ? `Estás administrando «${currentRoom.name}». Cerrala para entrar a otra.`
                  : `Al entrar a otra sala vas a salir de «${currentRoom.name}».`}
              </p>
              <button
                type="button"
                onClick={() => {
                  onOpenChange(false)
                  navigate(`/salas/${currentRoom.id}`)
                }}
                className="TextFucsia mt-1 underline"
              >
                Ir a mi sala
              </button>
            </div>
          )}

          <label className="block space-y-1">
            <span className="text-muted-foreground TextMedium">Código de la sala</span>
            <input
              type="text"
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="ABC123"
              aria-label="Código de la sala"
              maxLength={12}
              autoFocus
              className="text-foreground TextRegluar w-full rounded px-3 py-2 Volume outline-none"
            />
          </label>

          {error && <p className="rounded px-3 py-2 Salmon TextMedium">{error}</p>}

          <button
            type="submit"
            disabled={pending}
            className="rounded px-4 py-2 Fucsia Button hover:brightness-110 disabled:opacity-50"
          >
            {pending ? 'Entrando…' : 'Entrar a la sala'}
          </button>
        </form>
      </SheetContent>
    </Sheet>
  )
}