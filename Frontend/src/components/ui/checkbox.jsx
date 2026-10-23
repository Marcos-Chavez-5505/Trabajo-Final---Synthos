/* Checkbox propio. El proyecto no tenía ninguno y la variante 9 del alert
 * dialog lo necesita ("no volver a preguntar").
 *
 * Es un <button role="checkbox"> como el de Radix, no un <input>: así el
 * indicador es un nodo real (el check SVG) en vez de un pseudo-elemento que los
 * navegadores no pintan igual sobre un input con appearance:none. El botón ya
 * activa con Space/Enter, y aria-checked es lo que lee el lector de pantalla.
 */

import * as React from 'react'
import { cn } from '@/lib/utils'
import checkIcon from '@/assets/check.svg'

function Checkbox({
  checked,
  defaultChecked = false,
  onCheckedChange,
  disabled = false,
  className,
  ...props
}) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultChecked)
  const isControlled = checked !== undefined
  const isChecked = isControlled ? checked : uncontrolled

  const toggle = () => {
    if (disabled) return
    const next = !isChecked
    if (!isControlled) setUncontrolled(next)
    onCheckedChange?.(next)
  }

  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={isChecked}
      data-slot="checkbox"
      data-checked={isChecked ? '' : undefined}
      disabled={disabled}
      className={cn('Checkbox', className)}
      onClick={toggle}
      {...props}
    >
      <span className="CheckboxIndicator" hidden={!isChecked}>
        <img src={checkIcon} alt="" aria-hidden="true" />
      </span>
    </button>
  )
}

export { Checkbox }
