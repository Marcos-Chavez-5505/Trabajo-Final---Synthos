import { useState } from 'react'
import { Link } from 'react-router-dom'
import { joinRoom } from '@synthos/shared'
import { toastMessages } from '@/lib/toastMessages.js'
import searchIcon from '@synthos/shared/assets/icons/search.svg'

/**
 * Formulario "Unirme con código" (TS-14), dentro del popover del listado.
 *
 * Es la única vía de entrada a una sala privada (D14): las privadas no salen en el
 * listado de `/salas`, así que sin este formulario no habría forma de llegar a una.
 * Se entra con el código, sin contraseña (D27).
 */
export default function JoinRoomForm({
  onJoined,
  onCancel,
  currentRoom,
  isCurrentHost,
}) {
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

      onJoined(joined)
    } catch (cause) {
      toastMessages.roomJoinError(cause)
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {currentRoom && (
        <div className="rounded-lg px-3 py-2 Volume TextTiny">
          <p>
            {isCurrentHost
              ? `Estás administrando «${currentRoom.name}». Cerrala para entrar a otra.`
              : `Al entrar a otra sala vas a salir de «${currentRoom.name}».`}
          </p>
          <Link
            to={`/salas/${currentRoom.id}`}
            onClick={onCancel}
            className="TextFucsia mt-1 inline-block underline"
          >
            Ir a mi sala
          </Link>
        </div>
      )}

      <div className="space-y-1">
        {/* <span className="text-muted-foreground TextMedium">Código de la sala</span> */}
        <div className="Volume flex items-center gap-2 rounded-full px-4 py-2">
          <img
            src={searchIcon}
            alt=""
            aria-hidden="true"
            className="h-4 w-4 shrink-0"
          />
          <input
            type="text"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            placeholder="ABC123"
            aria-label="Código de la sala"
            maxLength={12}
            autoFocus
            className="text-foreground TextRegluar placeholder-muted-foreground/60 w-full bg-transparent outline-none"
          />
        </div>
      </div>

      {error && <p className="rounded px-3 py-2 Salmon TextMedium">{error}</p>}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded px-4 py-2 Fucsia Button hover:brightness-110 disabled:opacity-50"
        >
          {pending ? 'Entrando…' : 'Entrar a la sala'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded px-4 py-2 Volume Button hover:brightness-110"
        >
          Cancelar
        </button>
      </div>
    </form>
  )
}
