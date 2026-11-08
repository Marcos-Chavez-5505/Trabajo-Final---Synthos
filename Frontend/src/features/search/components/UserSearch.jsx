import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { mapApiError, searchUsers, useDebounce } from '@synthos/shared'
import Avatar from '@/components/ui/Avatar.jsx'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'

const DEBOUNCE_MS = 300
const MIN_QUERY = 2
const PAGE_SIZE = 10

const INVITATION_STATUS_LABEL = {
  pendiente: 'Pendiente',
  aceptada: 'Aceptó',
  rechazada: 'Rechazó',
}

function Kbd({ className, ...props }) {
  return (
    <kbd
      className={cn(
        'TextTiny pointer-events-none flex h-5 items-center justify-center gap-1 rounded border border-input bg-background px-1 font-medium text-muted-foreground select-none',
        className
      )}
      {...props}
    />
  )
}

/**
 * Buscador de personas con el `Command` de shadcn (variante Base UI).
 *
 * Lo abre quien lo usa (hoy, el botón "Invitar" de una playlist) y elige una
 * persona con click o Enter. `onSelect` decide qué hacer con ella; si devuelve
 * una promesa, el diálogo muestra el estado de envío y el error de la API sin
 * cerrarse, para poder invitar a varias personas seguidas.
 *
 * Solo se busca a partir de `MIN_QUERY` letras: con la query vacía
 * `GET /users/search` devuelve el catálogo completo. El debounce y el
 * `AbortController` evitan pedir en cada tecla y que una respuesta vieja pise a
 * la nueva; `shouldFilter={false}` porque el filtrado lo hace la API.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {(open: boolean) => void} props.onOpenChange
 * @param {(person: object) => void|Promise<void>} props.onSelect
 * @param {string[]} [props.excludeIds] Personas que no deben aparecer.
 * @param {string|null} [props.userId] Persona que usa el buscador (no se lista).
 * @param {string} [props.title]
 * @param {string} [props.description]
 * @param {string} [props.placeholder]
 * @param {string} [props.actionLabel] Texto del pie junto a la tecla Enter.
 * @param {object[]} [props.invitations] Invitaciones enviadas que se listan
 *   debajo del buscador, con su estado.
 */
export default function UserSearch({
  open,
  onOpenChange,
  onSelect,
  excludeIds = [],
  userId = null,
  title = 'Buscar personas',
  description = 'Buscá personas por nombre de usuario o email.',
  placeholder = 'Buscar personas…',
  actionLabel = 'Seleccionar',
  invitations = [],
}) {
  const [query, setQuery] = useState('')
  const [response, setResponse] = useState({ key: null, items: [], error: null })
  const [pendingId, setPendingId] = useState(null)
  const [submitError, setSubmitError] = useState('')

  const trimmedQuery = query.trim()
  const hasMinChars = trimmedQuery.length >= MIN_QUERY
  const debouncedQuery = useDebounce(trimmedQuery, DEBOUNCE_MS)
  const canSearch = debouncedQuery.length >= MIN_QUERY
  const requestKey = canSearch ? debouncedQuery : null

  useEffect(() => {
    if (!open || !canSearch) return undefined

    const controller = new AbortController()
    let active = true

    searchUsers(debouncedQuery, 1, PAGE_SIZE, { signal: controller.signal })
      .then((data) => {
        if (!active) return
        setResponse({ key: requestKey, items: data.items, error: null })
      })
      .catch((cause) => {
        if (!active || cause?.name === 'AbortError') return
        setResponse({ key: requestKey, items: [], error: mapApiError(cause) })
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [open, canSearch, debouncedQuery, requestKey])

  const isSettled = trimmedQuery === debouncedQuery
  const isCurrent = response.key === requestKey
  const isLoading = open && hasMinChars && (!isSettled || (canSearch && !isCurrent))
  const searchError = isSettled && isCurrent ? response.error : null

  const people = isSettled && isCurrent
    ? response.items.filter(
        (person) => person.id !== userId && !excludeIds.includes(person.id)
      )
    : []

  function handleOpenChange(next) {
    onOpenChange(next)
    setSubmitError('')

    if (!next) {
      setQuery('')
      setResponse({ key: null, items: [], error: null })
      setPendingId(null)
    }
  }

  async function handleSelect(person) {
    if (pendingId) return

    setPendingId(person.id)
    setSubmitError('')

    try {
      await onSelect(person)
      setQuery('')
    } catch (cause) {
      setSubmitError(mapApiError(cause))
    } finally {
      setPendingId(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton
        className="top-[15%] translate-y-0 gap-0 overflow-hidden rounded-xl p-0 sm:max-w-lg"
      >
        <DialogHeader className="border-b border-input px-4 py-3 pr-12">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {submitError && (
          <p className="Salmon TextMedium mx-4 my-2 rounded px-3 py-2">
            {submitError}
          </p>
        )}

        <Command shouldFilter={false} className="rounded-none bg-transparent p-0">
          <div className="relative">
            <CommandInput
              autoFocus
              value={query}
              onValueChange={setQuery}
              placeholder={placeholder}
              aria-label="Buscar personas"
              className="TextRegluar"
            />
            {isLoading && (
              <span
                role="status"
                aria-label="Buscando personas"
                className="pointer-events-none absolute top-1/2 right-3 flex -translate-y-1/2 items-center justify-center text-muted-foreground"
              >
                <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              </span>
            )}
          </div>

          <CommandList
            label="Resultados de usuarios"
            className="min-h-72 max-h-72"
          >
            <CommandEmpty className="TextMedium flex min-h-72 items-center justify-center px-6 text-muted-foreground">
              {searchError ? (
                <span className="text-destructive">{searchError}</span>
              ) : isLoading ? (
                'Buscando…'
              ) : !hasMinChars ? (
                `Escribí al menos ${MIN_QUERY} letras para buscar personas.`
              ) : (
                `No encontramos personas para “${trimmedQuery}”.`
              )}
            </CommandEmpty>

            {people.length > 0 && (
              <CommandGroup heading="Personas">
                {people.map((person) => (
                  <CommandItem
                    key={person.id}
                    value={`${person.username} ${person.email ?? ''}`}
                    disabled={pendingId !== null}
                    onSelect={() => handleSelect(person)}
                  >
                    <Avatar
                      src={person.avatarUrl}
                      name={person.username}
                      className="size-8"
                    />
                    <div className="min-w-0">
                      <p className="TextRegluar truncate">{person.username}</p>
                      <p className="TextMedium text-muted-foreground truncate">
                        {person.email || `@${person.username}`}
                      </p>
                    </div>
                    {pendingId === person.id && (
                      <span className="TextMedium ml-auto shrink-0 text-muted-foreground">
                        Enviando…
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>

        {invitations.length > 0 && (
          <section
            aria-labelledby="invitaciones-enviadas"
            className="border-t border-input"
          >
            <h3
              id="invitaciones-enviadas"
              className="TextRegluar text-foreground px-4 pt-3 font-medium"
            >
              Invitaciones enviadas
            </h3>

            <ul className="flex max-h-40 flex-col gap-1 overflow-y-auto px-4 pt-2 pb-3">
              {invitations.map((invitation) => (
                <li
                  key={invitation.receiver.id}
                  className="flex items-center gap-2 py-1"
                >
                  <Avatar
                    src={invitation.receiver.avatarUrl}
                    name={invitation.receiver.username}
                    className="size-7"
                  />

                  <p className="TextRegluar text-foreground min-w-0 flex-1 truncate">
                    {invitation.receiver.username}
                  </p>

                  <span className="TextTiny text-muted-foreground">
                    {INVITATION_STATUS_LABEL[invitation.status] ?? 'Pendiente'}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="flex h-10 items-center gap-2 border-t border-input bg-muted/40 px-4 text-muted-foreground">
          <Kbd>↵</Kbd>
          <span className="TextMedium">{actionLabel}</span>
        </div>
      </DialogContent>
    </Dialog>
  )
}
