import { useEffect, useState } from 'react'
import useDebounce from '../../hooks/useDebounce.js'
import { searchUsers } from '../../services/usersService.js'
import { sendInvitation } from '../../services/playlistsService.js'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../../components/ui/sheet'
import { Input } from '../../components/ui/input'
import UserRow from '../../components/cards/UserRow.jsx'
import { mapApiError } from '../../utils/mapError.js'

const DEBOUNCE_MS = 300
const PAGE_SIZE = 10
const MIN_QUERY = 2

/**
 * Buscador para invitar a una playlist (TS-13).
 *
 * La invitación va a una persona concreta de la app: no hay link ni pantalla
 * externa. Al aceptar queda como `colaborator` y puede agregar y quitar
 * canciones; el creador conserva editar, borrar, invitar y echar. Invitar a una
 * playlist personal la convierte en colaborativa (lo reporta `converted`).
 *
 * Solo se busca a partir de `MIN_QUERY` letras: con la query vacía
 * `GET /users/search` devuelve el catálogo completo. `excludeIds` esconde a
 * quien ya participa o ya tiene una invitación abierta, y `onInvited` le avisa
 * al detalle para que refresque la playlist y su lista de invitados.
 */
export default function InviteUserDialog({
  open,
  onOpenChange,
  playlistId,
  userId,
  isCollaborative = true,
  excludeIds = [],
  onInvited,
}) {
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState({ key: null, items: [], error: null })
  const [pendingId, setPendingId] = useState(null)
  const [error, setError] = useState('')

  const debouncedQuery = useDebounce(query, DEBOUNCE_MS)
  // Con la query vacía `GET /users/search` devuelve el catálogo completo: abrir el
  // diálogo no puede mirar todos los usuarios registrados. Se busca recién a
  // partir de dos letras.
  const canSearch = debouncedQuery.trim().length >= MIN_QUERY

  useEffect(() => {
    if (!open || !canSearch) return undefined

    let active = true

    searchUsers(debouncedQuery, 1, PAGE_SIZE)
      .then((data) => {
        if (active) setResponse({ key: debouncedQuery, items: data.items, error: null })
      })
      .catch((cause) => {
        if (active) setResponse({ key: debouncedQuery, items: [], error: mapApiError(cause) })
      })

    return () => {
      active = false
    }
  }, [debouncedQuery, canSearch, open])

  async function handleInvite(person) {
    if (pendingId) return

    setPendingId(person.id)
    setError('')

    try {
      const result = await sendInvitation(userId, playlistId, person.id)
      onInvited?.(result)
    } catch (cause) {
      setError(mapApiError(cause))
    } finally {
      setPendingId(null)
    }
  }

  const isCurrent = response.key === debouncedQuery
  const searchError = isCurrent ? response.error : null
  const people = (isCurrent ? response.items : []).filter(
    (person) => person.id !== userId && !excludeIds.includes(person.id)
  )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Invitar a la playlist</SheetTitle>
          <SheetDescription>
            {isCollaborative
              ? 'Buscá a quien quieras sumar. Van a poder agregar y quitar canciones.'
              : 'Buscá a quien quieras sumar. Al invitar a alguien, la playlist deja de ser privada y pasa a ser colaborativa.'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-3 px-4 pb-4">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Nombre de usuario"
            aria-label="Buscar a quién invitar"
            autoFocus
          />

          {error && <p className="rounded px-3 py-2 Salmon TextMedium">{error}</p>}

          {searchError ? (
            <p className="rounded px-3 py-2 Salmon TextMedium">{searchError}</p>
          ) : !canSearch ? (
            <p className="text-muted-foreground TextMedium">
              {debouncedQuery.trim()
                ? `Escribí al menos ${MIN_QUERY} letras para buscar.`
                : 'Escribí un nombre de usuario para buscar.'}
            </p>
          ) : !isCurrent ? (
            <p className="text-muted-foreground TextMedium">Buscando…</p>
          ) : people.length === 0 ? (
            <p className="text-muted-foreground TextMedium">
              Nadie coincide con esa búsqueda.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {people.map((person) => (
                <li key={person.id}>
                  <UserRow
                    person={person}
                    action={
                      <button
                        type="button"
                        onClick={() => handleInvite(person)}
                        disabled={pendingId !== null}
                        className="shrink-0 rounded px-4 py-2 Fucsia Button hover:brightness-110 disabled:opacity-50"
                      >
                        {pendingId === person.id ? 'Invitando…' : 'Invitar'}
                      </button>
                    }
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}