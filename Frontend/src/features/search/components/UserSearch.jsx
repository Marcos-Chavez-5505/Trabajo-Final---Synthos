import { useEffect, useId, useRef, useState } from 'react'
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { motion, useReducedMotion } from 'motion/react'
import closeIcon from '@synthos/shared/assets/icons/close.svg'
import collapseIcon from '@synthos/shared/assets/icons/collapse.svg'
import globeIcon from '@synthos/shared/assets/icons/globe.svg'
import searchIcon from '@synthos/shared/assets/icons/search.svg'
import trashIcon from '@synthos/shared/assets/icons/trash.svg'

const DEBOUNCE_MS = 300
const MIN_QUERY = 2
const PAGE_SIZE = 10
// Alto de la zona de resultados contraída: deja ver la pista de búsqueda.
const COLLAPSED_HEIGHT = 48

const INVITATION_STATUS_LABEL = {
  pendiente: 'Pendiente',
  aceptada: 'Aceptó',
  rechazada: 'Rechazó',
}

// Los <img> no heredan currentColor: para teñir el SVG se usa la misma máscara
// que el diálogo de eliminar playlist (`bg` + `mask-image`).
const TRASH_ICON_MASK = {
  maskImage: `url("${trashIcon}")`,
  maskPosition: 'center',
  maskRepeat: 'no-repeat',
  maskSize: 'contain',
  WebkitMaskImage: `url("${trashIcon}")`,
  WebkitMaskPosition: 'center',
  WebkitMaskRepeat: 'no-repeat',
  WebkitMaskSize: 'contain',
}

/** Fila de un integrante actual: avatar, nombre + @usuario y rol a la derecha. */
function MemberRow({ member, isViewer, canManage, onRemoveMember }) {
  const isCreator = member.role === 'creator'
  const canRemove = canManage && !isCreator
  const [menuOpen, setMenuOpen] = useState(false)
  const [removing, setRemoving] = useState(false)
  const [removeError, setRemoveError] = useState('')

  function handleOpenChange(next) {
    setMenuOpen(next)
    if (!next) setRemoveError('')
  }

  async function handleRemove() {
    if (removing) return

    setRemoving(true)
    setRemoveError('')

    try {
      await onRemoveMember?.(member)
      setMenuOpen(false)
    } catch (cause) {
      setRemoveError(mapApiError(cause))
    } finally {
      setRemoving(false)
    }
  }

  return (
    <li className="flex items-center gap-3 rounded px-4 py-2 hover:bg-(--ds-volume)">
      <Avatar
        src={member.avatarUrl}
        name={member.username}
        className="size-10 shrink-0"
      />

      <div className="min-w-0 flex-1">
        <p className="TextRegluar truncate font-medium">
          {member.username}
          {isViewer ? ' (tú)' : ''}
        </p>
        <p className="TextMedium truncate text-muted-foreground">@{member.username}</p>
      </div>

      {canRemove ? (
        <Popover open={menuOpen} onOpenChange={handleOpenChange}>
          <PopoverTrigger
            render={
              <button
                type="button"
                className="TextRegluar text-muted-foreground flex shrink-0 cursor-pointer items-center gap-1 rounded px-1 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              />
            }
          >
            Colaborador
            <img
              src={collapseIcon}
              alt=""
              aria-hidden="true"
              className={`size-5 transition-transform duration-200 opacity-70 ${
                menuOpen
                  ? 'transform-[perspective(80px)_rotateX(180deg)]'
                  : 'transform-[perspective(80px)_rotate(0deg)]'
              }`}
            />
          </PopoverTrigger>

          <PopoverContent align="end" className="w-52 gap-0 p-1">
            <button
              type="button"
              disabled={removing}
              onClick={handleRemove}
              className="TextRegular flex w-full cursor-pointer items-center gap-2 rounded px-3 py-2 text-left text-destructive hover:bg-(--ds-volume) disabled:cursor-not-allowed disabled:opacity-50"
            >
              <span
                aria-hidden="true"
                className="size-5 shrink-0 bg-destructive"
                style={TRASH_ICON_MASK}
              />
              {removing ? 'Eliminando…' : 'Eliminar de la playlist'}
            </button>

            {removeError && (
              <p className="Salmon TextMedium mt-1 rounded px-3 py-2">{removeError}</p>
            )}
          </PopoverContent>
        </Popover>
      ) : (
        <span className="TextRegular text-muted-foreground shrink-0 pr-1">
          {isCreator ? 'Creador' : 'Colaborador'}
        </span>
      )}
    </li>
  )
}

/** Fila de un resultado de búsqueda: avatar, nombre y estado o botón Invitar. */
function InviteRow({ id, person, status, active, pending, disabled, onInvite, onHover }) {
  return (
    <li
      id={id}
      role="option"
      aria-selected={active}
      onMouseMove={onHover}
      className={cn(
        'flex items-center gap-3 rounded px-4 py-1.5',
        active && 'bg-(--ds-volume)'
      )}
    >
      <Avatar
        src={person.avatarUrl}
        name={person.username}
        className="size-8 shrink-0"
      />

      <p className="TextRegluar min-w-0 flex-1 truncate font-medium">{person.username}</p>

      <div className="flex w-24 shrink-0 justify-center">
        {status ? (
          <span className="TextMedium text-muted-foreground">
            {INVITATION_STATUS_LABEL[status] ?? INVITATION_STATUS_LABEL.pendiente}
          </span>
        ) : pending ? (
          <span className="TextMedium text-muted-foreground">Enviando…</span>
        ) : (
          <button
            type="button"
            tabIndex={-1}
            disabled={disabled}
            onClick={onInvite}
            className="Lighter TextMedium cursor-pointer rounded-full px-3 py-1 font-medium text-surface hover:brightness-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Invitar
          </button>
        )}
      </div>
    </li>
  )
}

/**
 * Diálogo "Colaboradores": integrantes actuales de la playlist arriba y, debajo,
 * buscador para invitar a más personas.
 *
 * Lo abre quien lo usa (hoy, el botón "Invitar" de una playlist). `onSelect`
 * decide qué hacer con la persona elegida; si devuelve una promesa, la fila
 * muestra "Enviando…" y el error de la API aparece sin cerrar el diálogo, para
 * poder invitar a varias personas seguidas.
 *
 * Solo se busca a partir de `MIN_QUERY` letras: con la query vacía
 * `GET /users/search` devuelve el catálogo completo. El debounce y el
 * `AbortController` evitan pedir en cada tecla y que una respuesta vieja pise a
 * la nueva. Con la query vacía no se lista nada: las invitaciones ya enviadas
 * solo se marcan sobre el resultado que coincide con su `receiver`.
 *
 * Teclado: ↑/↓ mueven la fila activa y Enter invita a la persona activa.
 *
 * @param {object} props
 * @param {boolean} props.open
 * @param {(open: boolean) => void} props.onOpenChange
 * @param {(person: object) => void|Promise<void>} props.onSelect
 * @param {object[]} [props.members] Integrantes actuales ({id, username, avatarUrl, role}).
 * @param {string[]} [props.excludeIds] Personas que no deben aparecer en la búsqueda.
 * @param {string|null} [props.userId] Persona que usa el buscador.
 * @param {boolean} [props.canManageMembers] Muestra el menú de cada colaborador.
 * @param {(member: object) => void|Promise<void>} [props.onRemoveMember]
 * @param {string} [props.visibilityLabel] Texto sobre el título (ej. "Public Playlist").
 * @param {string} [props.title]
 * @param {string} [props.description] Descripción accesible (no se ve).
 * @param {string} [props.inviteTitle]
 * @param {string} [props.placeholder]
 * @param {object[]} [props.invitations] Invitaciones enviadas ({receiver, status}).
 */
export default function UserSearch({
  open,
  onOpenChange,
  onSelect,
  members = [],
  excludeIds = [],
  userId = null,
  canManageMembers = true,
  onRemoveMember,
  visibilityLabel = 'Public Playlist',
  title = 'Colaboradores',
  description = 'Integrantes de la playlist e invitación de nuevas personas.',
  inviteTitle = 'Invitar colaboradores',
  placeholder = 'Buscar personas…',
  invitations = [],
}) {
  const listId = useId()
  const prefersReduced = useReducedMotion()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [response, setResponse] = useState({ key: null, items: [], error: null })
  const [pendingId, setPendingId] = useState(null)
  const [submitError, setSubmitError] = useState('')

  const trimmedQuery = query.trim()
  const hasMinChars = trimmedQuery.length >= MIN_QUERY
  const debouncedQuery = useDebounce(trimmedQuery, DEBOUNCE_MS)
  const canSearch = debouncedQuery.length >= MIN_QUERY
  const requestKey = canSearch ? debouncedQuery : null
  const inputRef = useRef(null)

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
  // La zona de resultados se expande al haber búsqueda y se contrae al vaciarla.
  const expanded = hasMinChars

  const invitationStatusById = new Map(
    invitations.map((invitation) => [invitation.receiver.id, invitation.status])
  )

  // Resultados de la API (sin quien busca ni los integrantes). Sin query no se
  // lista nada: las invitaciones solo marcan el estado de un resultado.
  const rows =
    isSettled && isCurrent
      ? response.items.filter(
          (person) => person.id !== userId && !excludeIds.includes(person.id)
        )
      : []

  const safeActiveIndex = Math.min(activeIndex, Math.max(rows.length - 1, 0))

  useEffect(() => {
    if (!open) return
    document
      .getElementById(`${listId}-${safeActiveIndex}`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [open, listId, safeActiveIndex])

  function handleOpenChange(next) {
    onOpenChange(next)
    setSubmitError('')

    if (!next) {
      setQuery('')
      setActiveIndex(0)
      setResponse({ key: null, items: [], error: null })
      setPendingId(null)
    }
  }

  async function handleSelect(person) {
    if (pendingId || invitationStatusById.has(person.id)) return

    setPendingId(person.id)
    setSubmitError('')

    try {
      await onSelect(person)
    } catch (cause) {
      setSubmitError(mapApiError(cause))
    } finally {
      setPendingId(null)
    }
  }

  function handleKeyDown(event) {
    if (rows.length === 0) return

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex(Math.min(safeActiveIndex + 1, rows.length - 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex(Math.max(safeActiveIndex - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      handleSelect(rows[safeActiveIndex])
    }
  }

  const emptyMessage = searchError ? (
    <span className="text-destructive">{searchError}</span>
  ) : isLoading ? (
    'Buscando…'
  ) : !hasMinChars ? (
    `Escribe al menos ${MIN_QUERY} letras para buscar personas`
  ) : (
    `No encontramos personas para “${trimmedQuery}”.`
  )

  function clearQuery() {
    setQuery('')
    setActiveIndex(0)
    inputRef.current?.focus()
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="SurfaceLight top-[15%] max-h-[calc(85dvh-1rem)] translate-y-0 gap-0 overflow-y-auto rounded-xl border border-(--ds-volume) p-0 text-(--ds-lighter) sm:max-w-160"
      >
        {/* Cabecera */}
        <DialogHeader className="relative gap-0 px-8 pt-5 pb-3 text-left">
          <p className="TextMedium flex items-center gap-2 text-muted-foreground">
            <img src={globeIcon} alt="" aria-hidden="true" className="size-5 opacity-70" />
            {visibilityLabel}
          </p>
          <DialogTitle className="Header3">{title}</DialogTitle>
          <DialogDescription className="sr-only">{description}</DialogDescription>

          <button
            type="button"
            onClick={() => handleOpenChange(false)}
            aria-label="Cerrar"
            className="absolute top-4 right-4 cursor-pointer rounded p-1 hover:brightness-75 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <img src={closeIcon} alt="" aria-hidden="true" className="size-6" />
          </button>
        </DialogHeader>

        {/* Integrantes */}
        <section aria-label="Integrantes" className="border-t-1 border-(--ds-wall) py-3 pl-8 pr-4">
          <ul className="ArrowScroll max-h-44 overflow-y-auto pr-2">
            {members.map((member) => (
              <MemberRow
                key={member.id}
                member={member}
                isViewer={String(member.id) === String(userId)}
                canManage={canManageMembers}
                onRemoveMember={onRemoveMember}
              />
            ))}
          </ul>
        </section>

        {/* Invitar */}
        <section aria-labelledby={`${listId}-invite`} className="border-t-1 border-(--ds-wall) pt-3 pb-5">
          <h3 id={`${listId}-invite`} className="Header4 px-8">
            {inviteTitle}
          </h3>

          {submitError && (
            <p className="Salmon TextMedium mx-8 mt-2 rounded px-3 py-2">{submitError}</p>
          )}

          <div className="relative mx-8 mt-3">
            <img
              src={searchIcon}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 opacity-70"
            />
            <input
              ref={inputRef}
              autoFocus
              type="text"
              role="combobox"
              aria-expanded={expanded}
              aria-controls={listId}
              aria-activedescendant={rows.length > 0 ? `${listId}-${safeActiveIndex}` : undefined}
              aria-label="Buscar personas"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                setActiveIndex(0)
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className={cn(
                'TextRegluar Placeholder h-10 w-full rounded-full bg-(--ds-shadow) pl-12 outline-none focus-visible:ring-1 focus-visible:ring-ring',
                query ? 'pr-16' : 'pr-10'
              )}
            />
            {isLoading && (
              <span
                role="status"
                aria-label="Buscando personas"
                className="pointer-events-none absolute top-1/2 right-11 -translate-y-1/2 text-muted-foreground"
              >
                <span className="block size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              </span>
            )}

            {query && (
              <button
                type="button"
                onClick={clearQuery}
                aria-label="Borrar búsqueda"
                className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer rounded-full p-1 opacity-70 hover:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <img src={closeIcon} alt="" aria-hidden="true" className="size-4" />
              </button>
            )}
          </div>

          <motion.div
            initial={false}
            animate={{ height: expanded ? 'auto' : COLLAPSED_HEIGHT }}
            transition={
              prefersReduced ? { duration: 0 } : { duration: 0.25, ease: 'easeInOut' }
            }
            className="overflow-hidden pr-4 pl-8"
          >
            <div className="pt-2">
              {!expanded ? (
                <p
                  id={listId}
                  className="TextMedium flex h-10 items-center justify-center px-6 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </p>
              ) : rows.length > 0 ? (
                <ul
                  id={listId}
                  role="listbox"
                  aria-label="Resultados de usuarios"
                  className="ArrowScroll h-44 overflow-y-auto pr-2"
                >
                  {rows.map((person, index) => (
                    <InviteRow
                      key={person.id}
                      id={`${listId}-${index}`}
                      person={person}
                      status={invitationStatusById.get(person.id)}
                      active={index === safeActiveIndex}
                      pending={pendingId === person.id}
                      disabled={pendingId !== null}
                      onInvite={() => handleSelect(person)}
                      onHover={() => setActiveIndex(index)}
                    />
                  ))}
                </ul>
              ) : (
                <p
                  id={listId}
                  className="TextMedium flex h-44 items-center justify-center px-6 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </p>
              )}
            </div>
          </motion.div>
        </section>
      </DialogContent>
    </Dialog>
  )
}