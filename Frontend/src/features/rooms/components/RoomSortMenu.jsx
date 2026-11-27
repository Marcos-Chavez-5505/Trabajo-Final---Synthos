import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuPopup,
  DropdownMenuPositioner,
  DropdownMenuPortal,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu.tsx'
import { ROOM_SORTS, ROOM_ORDERS } from '@synthos/shared'
import collapseIcon from '@synthos/shared/assets/icons/collapse.svg'
import arrowAZIcon from '@synthos/shared/assets/icons/arrow-down-a-z.svg'
import arrowZAIcon from '@synthos/shared/assets/icons/arrow-down-z-a.svg'
import arrow10Icon from '@synthos/shared/assets/icons/arrow-down-1-0.svg'
import arrow01Icon from '@synthos/shared/assets/icons/arrow-down-0-1.svg'

const SORT_OPTIONS = [
{ sort: 'name', order: 'asc', label: 'Nombre · Ascendente', icon: arrowAZIcon },
{ sort: 'name', order: 'desc', label: 'Nombre · Descendente', icon: arrowZAIcon },
  { sort: 'rating', order: 'asc', label: 'Calificación · Ascendente', icon: arrow10Icon },
  { sort: 'rating', order: 'desc', label: 'Calificación · Descendente', icon: arrow01Icon },
]

export default function RoomSortMenu({ sort, order, onChange }) {
  const active = SORT_OPTIONS.find((o) => o.sort === sort && o.order === order)

  const fallbackLabel = `${
    ROOM_SORTS.find((c) => c.value === sort)?.label ?? sort
  } · ${ROOM_ORDERS.find((o) => o.value === order)?.label ?? order}`
  const label = active?.label ?? fallbackLabel

  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground TextRegluar">Ordenar por</span>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              className="Volume TextRegluar flex h-10 items-center gap-2 rounded-xl px-3 py-2 hover:brightness-110"
              aria-label={`Ordenar por ${label}`}
            />
          }
        >
          {active && (
            <img src={active.icon} alt="" aria-hidden="true" className="h-4 w-4" />
          )}
          {label}
          <img src={collapseIcon} alt="" aria-hidden="true" className="h-4 w-4" />
        </DropdownMenuTrigger>

        <DropdownMenuPortal>
          <DropdownMenuPositioner side="bottom" align="end">
            <DropdownMenuPopup>
              {SORT_OPTIONS.map((option, index) => {
                const selected = option === active
                const startsGroup = index > 0 && SORT_OPTIONS[index - 1].sort !== option.sort

                return (
                  <div key={`${option.sort}-${option.order}`}>
                    {startsGroup && (
                      <div role="separator" className="my-1 border-t border-sidebar-border" />
                    )}
                    <DropdownMenuItem
                      nativeButton
                      role="menuitemradio"
                      aria-checked={selected}
                      label={option.label}
                      onClick={() => onChange({ sort: option.sort, order: option.order })}
                      className={`flex items-center gap-2${selected ? ' Volume' : ''}`}
                    >
                      <img src={option.icon} alt="" aria-hidden="true" className="h-4 w-4 shrink-0" />
                      {option.label}
                    </DropdownMenuItem>
                  </div>
                )
              })}
            </DropdownMenuPopup>
          </DropdownMenuPositioner>
        </DropdownMenuPortal>
      </DropdownMenu>
    </div>
  )
}