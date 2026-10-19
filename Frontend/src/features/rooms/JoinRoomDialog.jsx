import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../../components/ui/sheet'
import { joinRoom } from '../../services/roomsService.js'
import { mapApiError } from '../../utils/mapError.js'

/**
 * Modal "Unirme con código" (TS-14).
 *
 * Es la única vía de entrada a una sala privada (D14): las privadas no salen en el
 * listado de `/salas`, así que sin este diálogo no habría forma de llegar a una.
 *
 * El proyecto no tiene `dialog.tsx`: el modal del repo es el `Sheet` de Base UI,
 * el mismo que usa `InviteUserDialog` para las invitaciones de playlist.
 *
 * La contraseña solo se pide si la sala resultara privada, y el backend responde
 * 403 tanto si falta como si es incorrecta, así que el campo va siempre visible
 * con su explicación en vez de aparecer y desaparecer.
 */
export default function JoinRoomDialog({ open, onOpenChange }) {
  const navigate = useNavigate()

  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
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
      const joined = await joinRoom(code, password)

      onOpenChange(false)
      navigate(`/salas/${joined.id}`)
    } catch (cause) {
      setError(mapApiError(cause))
      setPending(false)
    }
  }

  function handleOpenChange(next) {
    if (!next) {
      setCode('')
      setPassword('')
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
            te pasó quien la creó, y con su contraseña si es privada.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 px-4 pb-4">
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

          <label className="block space-y-1">
            <span className="text-muted-foreground TextMedium">
              Contraseña (solo si la sala es privada)
            </span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Dejala vacía si la sala es pública"
              aria-label="Contraseña de la sala"
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