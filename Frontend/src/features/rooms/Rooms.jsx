import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuPopup,
  DropdownMenuPositioner,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu.tsx'
import {
  searchRooms,
  joinRoom,
  ROOM_SORTS,
  DEFAULT_ROOM_SORT,
  ROOM_ORDERS,
  DEFAULT_ROOM_ORDER,
} from '@synthos/shared'
import { useDebounce } from '@synthos/shared'
import RoomCard from '../../components/cards/RoomCard.jsx'
import JoinRoomDialog from './JoinRoomDialog.jsx'
import roomIcon from '../../assets/join_music_room.svg'
import searchIcon from '../../assets/search.svg'
import threeDotsIcon from '../../assets/three_dots.svg'
import { mapApiError } from '@synthos/shared'

const DEBOUNCE_MS = 300

/**
 * `/salas`: listado de salas con buscador y filtros (TS-16 + TS-17).
 *
 * La búsqueda y el orden viven en la URL (`?q=`, `?sort=`, `?order=`) por la misma
 * razón que en `/buscar`: la vista es compartible y el botón "atrás" del browser
 * deshace el cambio. Por eso no son `useState`: salen de `useSearchParams`.
 *
 * El orden lo resuelve el servidor (`GET /api/rooms?query=&sort=&order=`), así
 * que esta pantalla no reordena nada: el array que llega ya viene en el orden
 * pedido.
 *
 * Las salas privadas no aparecen en este listado (D14): a esas se entra con el
 * código, desde el botón "Unirme con código".
 */
export default function Rooms() {
  const [searchParams, setSearchParams] = useSearchParams()

  const query = searchParams.get('q') ?? ''
  const sort = readSort(searchParams.get('sort'))
  const order = readOrder(searchParams.get('order'))

  const [input, setInput] = useState(query)
  const [response, setResponse] = useState({ key: null, rooms: [], error: null })
  const [joinOpen, setJoinOpen] = useState(false)

  // El input es controlado desde la URL, como el de la TopBar: si el `?q=` cambia
  // (por ejemplo al navegar atrás) el input se entera sin duplicar estado.
  const debounced = useDebounce(input, DEBOUNCE_MS)

  useEffect(() => {
    setInput(query)
  }, [query])

  useEffect(() => {
    const next = debounced.trim()

    if (next === query.trim()) return

    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev)

        if (next) params.set('q', next)
        else params.delete('q')

        return params
      },
      { replace: true },
    )
  }, [debounced, query, setSearchParams])

  // Patrón "key": mientras la respuesta no sea de la request vigente se muestra
  // vacío, así no se ve la lista vieja con los filtros nuevos.
  useEffect(() => {
    let active = true
    const key = `${query}|${sort}|${order}`

    searchRooms({ query, sort, order })
      .then((rooms) => {
        if (active) setResponse({ key, rooms, error: null })
      })
      .catch((cause) => {
        if (active) setResponse({ key, rooms: [], error: mapApiError(cause) })
      })

    return () => {
      active = false
    }
  }, [query, sort, order])

  function patchParams(patch) {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev)

      Object.entries(patch).forEach(([key, value]) => {
        if (value === null) next.delete(key)
        else next.set(key, value)
      })

      return next
    })
  }

  function handleSort(criterio) {
    // El default no se escribe en la URL: `/salas` a secas tiene que significar lo
    // mismo que `/salas?sort=name`, si no la vista del criterio por defecto queda
    // con un query param de más.
    patchParams({ sort: criterio === DEFAULT_ROOM_SORT ? null : criterio })
  }

  function handleOrder(sentido) {
    patchParams({ order: sentido === DEFAULT_ROOM_ORDER ? null : sentido })
  }

  const key = `${query}|${sort}|${order}`
  const isCurrent = response.key === key
  const rooms = isCurrent ? response.rooms : []
  const error = isCurrent ? response.error : null

  return (
    <section className="px-6 py-4 md:px-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-foreground Header3">Salas</h1>
          <p className="text-muted-foreground TextMedium mt-1">
            Salas de escucha compartida. Buscá por nombre de sala o por el nombre
            de quien la anfitriona.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            to="/salas/crear"
            className="rounded px-4 py-2 Fucsia Button hover:brightness-110"
          >
            Crear sala
          </Link>
          <button
            type="button"
            onClick={() => setJoinOpen(true)}
            className="rounded px-4 py-2 Volume Button hover:brightness-110"
          >
            Unirme con código
          </button>
          <RoomSortMenu
            sort={sort}
            order={order}
            onSort={handleSort}
            onOrder={handleOrder}
          />
        </div>
      </header>

      <div className="mt-6 max-w-md" role="search">
        <div className="Volume flex items-center gap-2 rounded-full px-4 py-2">
          <img src={searchIcon} alt="" aria-hidden="true" className="h-4 w-4 shrink-0" />
          <input
            type="search"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Buscar sala o anfitriona"
            aria-label="Buscar sala por nombre o por anfitriona"
            className="text-foreground TextRegluar placeholder-muted-foreground/60 w-full bg-transparent outline-none"
          />
        </div>
      </div>

      {error && <p className="mt-6 rounded px-3 py-2 Salmon TextMedium">{error}</p>}

      {!isCurrent ? (
        <p className="text-muted-foreground TextRegluar mt-8">Buscando salas…</p>
      ) : rooms.length === 0 ? (
        <EmptyState hasQuery={Boolean(query.trim())} />
      ) : (
        <ul className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rooms.map((room) => (
            <li key={room.id}>
              <RoomCard room={room} action={<RoomCardAction room={room} />} />
            </li>
          ))}
        </ul>
      )}

      <JoinRoomDialog open={joinOpen} onOpenChange={setJoinOpen} />
    </section>
  )
}

/**
 * Acción de la tarjeta: unirse si hay lugar.
 *
 * No hay "ver la sala" en el listado: `GET /api/rooms/:id` es solo para
 * miembros (`room.controller.js` → 403), así que una vista previa no tiene
 * endpoint que la sostenga. "Unirme" además es idempotente (`200` si ya era
 * miembro), así que sirve también para volver a una sala propia.
 *
 * La sala privada no aparece en el listado, así que acá siempre es pública: no
 * hace falta el código ni la contraseña, y el backend responde 201 directo.
 */
function RoomCardAction({ room }) {
  const full = room.maxCapacity !== null && room.membersCount >= room.maxCapacity

  if (full) {
    return (
      <span className="text-muted-foreground TextTiny self-center">
        Sala llena ({room.membersCount}/{room.maxCapacity})
      </span>
    )
  }

  return <JoinRoomButton room={room} />
}

function JoinRoomButton({ room }) {
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function handleJoin() {
    if (pending) return

    setPending(true)
    setError('')

    try {
      const joined = await joinRoom(room.code)

      navigate(`/salas/${joined.id}`)
    } catch (cause) {
      setError(mapApiError(cause))
      setPending(false)
    }
  }

  return (
    <span className="flex flex-1 flex-col">
      <button
        type="button"
        onClick={handleJoin}
        disabled={pending}
        className="rounded px-3 py-2 Fucsia Button hover:brightness-110 disabled:opacity-50"
      >
        {pending ? 'Uniéndote…' : 'Unirme'}
      </button>
      {error && <span className="text-muted-foreground TextTiny mt-1">{error}</span>}
    </span>
  )
}

/**
 * Menú de ordenamiento.
 *
 * Es el dropdown de Base UI (`components/ui/dropdown-menu.tsx`), el mismo que usa
 * el menú de cuenta del Sidebar. El trigger muestra el criterio activo, no un
 * ícono suelto: con dos opciones, "Mejor calificado" es más claro de leer que un
 * botón con tres puntitos.
 *
 * El ítem activo se marca con `Fucsia` y una fuente medium. Los SVG traen el
 * color hardcodeado (#F4F0F9) y no se recolorean, así que el estado activo se
 * juega con el fondo del ítem, no con el ícono (regla 10 de AGENTS.md).
 */
function RoomSortMenu({ sort, order, onSort, onOrder }) {
  const active = ROOM_SORTS.find((c) => c.value === sort) ?? ROOM_SORTS[0]
  const sentido = ROOM_ORDERS.find((o) => o.value === order) ?? ROOM_ORDERS[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="Volume Button CardRadius flex items-center gap-2 rounded px-4 py-2"
            aria-label={`Ordenar por ${active.label}, ${sentido.label}`}
          />
        }
      >
        <img src={threeDotsIcon} alt="" aria-hidden="true" className="h-4 w-4" />
        {active.label} · {sentido.label}
      </DropdownMenuTrigger>

      <DropdownMenuPortal>
        <DropdownMenuPositioner side="bottom" align="end">
          <DropdownMenuPopup>
            {ROOM_SORTS.map((criterio) => (
              <DropdownMenuItem
                key={criterio.value}
                nativeButton
                label={`Ordenar por ${criterio.label}`}
                onClick={() => onSort(criterio.value)}
                className={
                  criterio.value === sort ? 'bg-sidebar-accent TextMedium' : undefined
                }
              >
                {criterio.label}
              </DropdownMenuItem>
            ))}

            <DropdownMenuItem
              nativeButton
              label={
                order === 'asc' ? 'Cambiar a orden descendente' : 'Cambiar a orden ascendente'
              }
              onClick={() => onOrder(order === 'asc' ? 'desc' : 'asc')}
              className="border-t border-sidebar-border"
            >
              {order === 'asc' ? 'Orden descendente' : 'Orden ascendente'}
            </DropdownMenuItem>
          </DropdownMenuPopup>
        </DropdownMenuPositioner>
      </DropdownMenuPortal>
    </DropdownMenu>
  )
}

function EmptyState({ hasQuery }) {
  return (
    <div className="py-16 text-center">
      <img
        src={roomIcon}
        alt=""
        aria-hidden="true"
        className="mx-auto h-10 w-10 invert opacity-50"
      />
      {hasQuery ? (
        <>
          <p className="text-foreground Header4 mt-4">
            No encontramos salas con ese criterio
          </p>
          <p className="text-muted-foreground TextRegluar mt-1">
            Probá con otro nombre de sala o de anfitriona. Si la sala es privada,
            entrá con su código.
          </p>
        </>
      ) : (
        <>
          <p className="text-foreground Header4 mt-4">Todavía no hay salas</p>
          <p className="text-muted-foreground TextRegluar mt-1">
            Cuando alguien abra una sala, aparece acá.
          </p>
        </>
      )}
    </div>
  )
}

/**
 * Lee el criterio de la URL.
 *
 * Un `?sort=` desconocido cae al default en vez de romper: la lista alfabética
 * siempre se puede mostrar, y el service normaliza lo que llega igual.
 */
function readSort(value) {
  return ROOM_SORTS.some((c) => c.value === value) ? value : DEFAULT_ROOM_SORT
}

function readOrder(value) {
  return ROOM_ORDERS.some((o) => o.value === value) ? value : DEFAULT_ROOM_ORDER
}