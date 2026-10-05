import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuPopup,
  DropdownMenuPositioner,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu.tsx'
import { listRooms, ROOM_SORTS, DEFAULT_ROOM_SORT } from '../../services/roomsService.js'
import RoomCard from '../../components/cards/RoomCard.jsx'
import roomIcon from '../../assets/join_music_room.svg'
import threeDotsIcon from '../../assets/three_dots.svg'

/**
 * `/salas`: listado de salas ordenable (TS-17).
 *
 * Lo único que agrega esta tarea sobre el listado es el criterio de orden. El
 * backend ya aceptaba `?sort=alphabetical|rating` (`room.service.js`), así que
 * acá lo que hay es la UI para elegirlo y el `hostRating` en la tarjeta.
 *
 * NO incluye, porque son otras tareas: crear sala (TS-14), buscar salas (TS-16),
 * unirse (TS-19), calificar al anfitrión (TS-11), reproducir ni el chat. La
 * tarjeta es de solo lectura a propósito: si algo de eso se agrega después, entra
 * como botón en `RoomCard` y no hay que tocar esta pantalla.
 *
 * El criterio vive en la URL (`?sort=`) por la misma razón que en `/buscar`: la
 * vista es compartible y el botón "atrás" del browser deshace el cambio de orden.
 * Por eso no es un `useState`: sale de `useSearchParams`, igual que las tabs de
 * `/buscar`.
 */
export default function Rooms() {
  const [searchParams, setSearchParams] = useSearchParams()
  const sort = readSort(searchParams.get('sort'))

  const [response, setResponse] = useState({ key: null, rooms: [], error: null })

  useEffect(() => {
    let active = true

    listRooms({ sort })
      .then((rooms) => {
        if (active) setResponse({ key: sort, rooms, error: null })
      })
      .catch((cause) => {
        if (active) setResponse({ key: sort, rooms: [], error: cause.message })
      })

    return () => {
      active = false
    }
  }, [sort])

  function handleSort(criterio) {
    // El default no se escribe en la URL: `/salas` a secas tiene que significar lo
    // mismo que `/salas?sort=alphabetical`, si no la vista compartible del criterio
    // por defecto queda con un query param de más.
    const next =
      criterio === DEFAULT_ROOM_SORT ? {} : { sort: criterio }

    setSearchParams(next)
  }

  const isCurrent = response.key === sort
  const rooms = isCurrent ? response.rooms : []
  const error = isCurrent ? response.error : null

  return (
    <section className="px-6 py-4 md:px-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-foreground Header3">Salas</h1>
          <p className="text-muted-foreground TextMedium mt-1">
            Salas de escucha compartida. Ordená por nombre o por la calificación del
            anfitrión.
          </p>
        </div>

        <RoomSortMenu sort={sort} onSort={handleSort} />
      </header>

      {error && <p className="mt-6 rounded px-3 py-2 Salmon TextMedium">{error}</p>}

      {!isCurrent ? (
        <p className="text-muted-foreground TextRegluar mt-8">Cargando salas…</p>
      ) : rooms.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rooms.map((room) => (
            <li key={room.id}>
              <RoomCard room={room} />
            </li>
          ))}
        </ul>
      )}
    </section>
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
function RoomSortMenu({ sort, onSort }) {
  const active = ROOM_SORTS.find((c) => c.value === sort) ?? ROOM_SORTS[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button
            type="button"
            className="Volume Button CardRadius flex items-center gap-2 rounded px-4 py-2"
            aria-label={`Ordenar por ${active.label}`}
          />
        }
      >
        <img src={threeDotsIcon} alt="" aria-hidden="true" className="h-4 w-4" />
        Orden: {active.label}
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
          </DropdownMenuPopup>
        </DropdownMenuPositioner>
      </DropdownMenuPortal>
    </DropdownMenu>
  )
}

function EmptyState() {
  return (
    <div className="py-16 text-center">
      <img
        src={roomIcon}
        alt=""
        aria-hidden="true"
        className="mx-auto h-10 w-10 invert opacity-50"
      />
      <p className="text-foreground Header4 mt-4">Todavía no hay salas</p>
      <p className="text-muted-foreground TextRegluar mt-1">
        Cuando alguien abra una sala, aparece acá.
      </p>
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