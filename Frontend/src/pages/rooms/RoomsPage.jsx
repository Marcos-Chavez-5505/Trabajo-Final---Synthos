import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  joinRoom,
  ROOM_SORTS,
  DEFAULT_ROOM_SORT,
  ROOM_ORDERS,
  DEFAULT_ROOM_ORDER,
} from '@synthos/shared'
import { useDebounce, useRoomsList, useMyRooms, useAuth } from '@synthos/shared'
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import CreateButton from '@/components/actions/CreateButton.jsx'
import RoomCard from '@/components/cards/RoomCard.jsx'
import JoinRoomDialog from '@/features/rooms/components/JoinRoomDialog.jsx'
import RoomCreateForm from '@/features/rooms/components/RoomCreateForm.jsx'
import RoomSortMenu from '@/features/rooms/components/RoomSortMenu.jsx'
import roomIcon from '@synthos/shared/assets/icons/headphones.svg'
import searchIcon from '@synthos/shared/assets/icons/search.svg'
import scanIcon from '@synthos/shared/assets/icons/scan-barcode.svg'
import { mapApiError } from '@synthos/shared'

const DEBOUNCE_MS = 300

export default function RoomsPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const query = searchParams.get('q') ?? ''
  const sort = readSort(searchParams.get('sort'))
  const order = readOrder(searchParams.get('order'))

  const [input, setInput] = useState(query)
  const [joinOpen, setJoinOpen] = useState(false)
  const [creating, setCreating] = useState(false)

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

  const { isCurrent, rooms, error } = useRoomsList(query, sort, order)
  const { user } = useAuth()
  const { currentRoom } = useMyRooms()

  const isCurrentHost = currentRoom
    ? String(currentRoom.hostId) === String(user?.id)
    : false

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

  function handleSortChange({ sort: nextSort, order: nextOrder }) {
    patchParams({
      sort: nextSort === DEFAULT_ROOM_SORT ? null : nextSort,
      order: nextOrder === DEFAULT_ROOM_ORDER ? null : nextOrder,
    })
  }

  return (
    <section className="px-6 py-4 md:px-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-foreground Header3">Salas</h1>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setJoinOpen(true)}
            className="Volume TextMedium flex items-center gap-2 rounded-lg px-3 py-2 hover:brightness-110"
          >
            <img src={scanIcon} alt="" aria-hidden="true" className="h-4 w-4" />
            Unirme con código
          </button>
          <Popover open={creating} onOpenChange={setCreating}>
            <PopoverTrigger
              render={
                <CreateButton
                  active={creating}
                  aria-label={creating ? 'Cancelar creación de sala' : 'Crear sala'}
                >
                  Crear sala
                </CreateButton>
              }
            />

            <PopoverContent
              align="end"
              className="w-80 max-h-(--available-height) overflow-y-auto"
            >
              <PopoverHeader>
                <PopoverTitle className="text-muted-foreground">Nueva sala</PopoverTitle>
              </PopoverHeader>
              <RoomCreateForm
                onCreated={(room) => navigate(`/salas/${room.id}`)}
                onCancel={() => setCreating(false)}
              />
            </PopoverContent>
          </Popover>
        </div>
      </header>

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="w-full max-w-md flex-1 basis-72" role="search">
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

        <RoomSortMenu sort={sort} order={order} onChange={handleSortChange} />
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
              <RoomCard
                room={room}
                action={
                  <RoomCardAction
                    room={room}
                    currentRoom={currentRoom}
                    isCurrentHost={isCurrentHost}
                  />
                }
              />
            </li>
          ))}
        </ul>
      )}

      <JoinRoomDialog
        open={joinOpen}
        onOpenChange={setJoinOpen}
        currentRoom={currentRoom}
        isCurrentHost={isCurrentHost}
      />
    </section>
  )
}

function RoomCardAction({ room, currentRoom, isCurrentHost }) {
  const isCurrent = currentRoom && String(currentRoom.id) === String(room.id)
  const full =
    !isCurrent &&
    room.maxCapacity !== null &&
    room.membersCount >= room.maxCapacity
  const blockedByHost = Boolean(currentRoom) && isCurrentHost && !isCurrent

  return (
    <JoinRoomButton
      room={room}
      full={full}
      isCurrent={isCurrent}
      blockedByHost={blockedByHost}
      switching={Boolean(currentRoom) && !isCurrent}
    />
  )
}

function JoinRoomButton({ room, full, isCurrent, blockedByHost, switching }) {
  const navigate = useNavigate()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')

  async function handleJoin() {
    if (pending || full) return

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

  if (isCurrent) {
    return (
      <span className="flex flex-col items-end">
        <button
          type="button"
          onClick={() => navigate(`/salas/${room.id}`)}
          className="rounded-full px-6 py-2.5 Fucsia Button text-surface font-bold hover:brightness-110"
        >
          Ir a mi sala
        </button>
      </span>
    )
  }

  if (blockedByHost) {
    return (
      <span className="flex flex-col items-end">
        <button
          type="button"
          disabled
          title="Cierra tu sala para entrar a otra"
          className="rounded-full px-6 py-2.5 Volume Button font-bold disabled:cursor-not-allowed disabled:opacity-50"
        >
          Cierra tu sala
        </button>
      </span>
    )
  }

  return (
    <span className="flex flex-col items-end">
      <button
        type="button"
        onClick={handleJoin}
        disabled={pending || full}
        aria-label={full ? 'Sala llena' : undefined}
        className="rounded-full px-6 py-2.5 Fucsia Button text-surface font-bold hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100"
      >
        {full
          ? 'Llena'
          : pending
            ? 'Uniéndote…'
            : switching
              ? 'Cambiar de sala'
              : 'Unirme'}
      </button>
      {error && (
        <span className="text-muted-foreground TextTiny mt-1 max-w-40 text-right">
          {error}
        </span>
      )}
    </span>
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
            Probá con otro nombre de sala o de anfitrión. Si la sala es privada,
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

function readSort(value) {
  return ROOM_SORTS.some((c) => c.value === value) ? value : DEFAULT_ROOM_SORT
}

function readOrder(value) {
  return ROOM_ORDERS.some((o) => o.value === value) ? value : DEFAULT_ROOM_ORDER
}