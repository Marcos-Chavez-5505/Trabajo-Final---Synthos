import { useRef, useState } from 'react'
import closeIcon from '@synthos/shared/assets/icons/close.svg'
import useRecentSearches from '../../hooks/useRecentSearches.js'
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
} from '../motion/combobox.tsx'

/** El filtro del listado y el que decide el Enter comparten esta función. */
function filterTerm(term, query) {
  const needle = query.trim().toLocaleLowerCase()
  return needle === '' || term.toLocaleLowerCase().includes(needle)
}

/**
 * Caja de búsqueda con las búsquedas recientes del usuario como desplegable.
 *
 * Solo hay un tipo de opción (el historial): no hay sugerencias ni opciones
 * fijas. Con coincidencias, Enter elige la opción resaltada (lo resuelve el
 * primitivo de beUI); sin coincidencias, Enter envía el texto escrito.
 *
 * Sin historial el panel igual se abre al escribir, con un texto que invita a
 * buscar. Enfocar o hacer clic no lo abre: solo lo hace el primer carácter.
 *
 * @param {object} props
 * @param {string|number|null} [props.userId] Dueño del historial; sin él no se lee ni se escribe.
 * @param {string} [props.value] Término actual, el que se ve con el panel cerrado.
 * @param {(term: string) => void} [props.onSearch] Ejecuta la búsqueda (navegar, filtrar, etc.).
 */
export default function RecentSearchesCombobox({
  userId = null,
  value,
  onSearch,
  placeholder = 'Buscar canciones o personas',
  title = 'Búsquedas recientes',
  emptyLabel = 'Buscar por…',
  clearInputLabel = 'Limpiar búsqueda',
  removeLabel = 'Eliminar búsqueda',
  submitHint = 'Enter para buscar',
  className,
}) {
  const { searches, add, remove } = useRecentSearches(userId)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  // `value` es el término aplicado (la URL en el buscador global). Se copia a
  // un estado propio para poder vaciar el input sin depender del padre.
  const [ownValue, setOwnValue] = useState(value ?? '')
  const [lastValue, setLastValue] = useState(value ?? '')

  if ((value ?? '') !== lastValue) {
    setLastValue(value ?? '')
    setOwnValue(value ?? '')
  }

  const currentValue = ownValue
  const hasSearches = searches.length > 0
  const hasMatches = searches.some((term) => filterTerm(term, query))

  // El input del primitivo abre el panel al enfocar o al hacer clic; acá se
  // ignora esa apertura solo cuando el usuario nunca buscó nada. Con historial
  // el panel se abre normal; sin historial hace falta escribir (y ahí el panel
  // muestra "Enter para buscar…").
  const queryRef = useRef('')

  const handleOpenChange = (next) => {
    if (next && queryRef.current.trim() === '' && !hasSearches) return
    setOpen(next)
  }

  const handleQueryChange = (next) => {
    queryRef.current = next
    setQuery(next)
    // Vaciar el input cierra el panel: sin texto no hay nada que ofrecer.
    setOpen(next.trim() !== '')
  }

  const clearInput = () => {
    handleQueryChange('')
    setOwnValue('')
  }

  const submit = (term) => {
    const next = typeof term === 'string' ? term.trim() : ''
    if (!next) return

    setOwnValue(next)
    add(next)
    handleQueryChange('')
    setOpen(false)
    onSearch?.(next)
  }

  const handleKeyDown = (event) => {
    // Con coincidencias el primitivo resuelve el Enter (elige la resaltada).
    // Sin coincidencias no hay nada que elegir: se envía lo escrito.
    if (event.key !== 'Enter' || query.trim() === '' || hasMatches) return

    event.preventDefault()
    submit(query)
  }

  return (
    <Combobox
      className={className}
      value={currentValue}
      open={open}
      onOpenChange={handleOpenChange}
      query={query}
      onQueryChange={handleQueryChange}
      onValueChange={submit}
      filter={filterTerm}
    >
      <ComboboxTrigger>
        <ComboboxInput
          aria-label={placeholder}
          placeholder={placeholder}
          className="min-w-0 flex-1"
          onChange={(event) => {
            if (event.target.value.trim() === '') setOwnValue('')
          }}
          onKeyDown={handleKeyDown}
        />
        {(query.trim() !== '' || currentValue !== '') && (
          <button
            type="button"
            aria-label={clearInputLabel}
            onClick={clearInput}
            className="ml-auto grid size-6 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <img src={closeIcon} alt="" aria-hidden="true" className="size-3.5" />
          </button>
        )}
      </ComboboxTrigger>

      <ComboboxContent>
        <ComboboxList ariaLabel={title}>
          {searches.map((term) => (
            <ComboboxItem key={term} value={term} textValue={term}>
              <span className="flex w-full min-w-0 items-center gap-2">
                <span className="min-w-0 truncate">{term}</span>
                <span
                  role="button"
                  tabIndex={-1}
                  aria-label={`${removeLabel}: ${term}`}
                  onClick={(event) => {
                    event.stopPropagation()
                    remove(term)
                  }}
                  onPointerDown={(event) => event.stopPropagation()}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return
                    event.preventDefault()
                    event.stopPropagation()
                    remove(term)
                  }}
                  className="ml-auto grid size-6 shrink-0 place-items-center rounded-full text-muted-foreground hover:opacity-50 hover:text-foreground"
                >
                  <img src={closeIcon} alt="" aria-hidden="true" className="size-3.5" />
                </span>
              </span>
            </ComboboxItem>
          ))}

          <ComboboxEmpty>
            {query.trim() === '' ? (
              emptyLabel
            ) : (
              <>
                {submitHint}{' '}
                <span className="text-foreground">“{query.trim()}”</span>
              </>
            )}
          </ComboboxEmpty>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}
