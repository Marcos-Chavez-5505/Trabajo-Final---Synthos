/* Íconos del alert dialog (variantes 5 y 9).
 *
 * Solo quedan acá los que no existen en el set de `src/assets`: el check y los
 * tres puntos ya están en `assets/` y se usan con <img> (regla 10 de
 * AGENTS.md).
 *
 * Igual que esos assets: trazo con `currentColor` para que el ícono siga el
 * color del texto donde se lo use. El tamaño lo pone la clase de layout
 * (`ComponentIcon`), nunca el propio svg.
 */

const svgProps = {
  viewBox: '0 0 24 24',
  fill: 'none',
  xmlns: 'http://www.w3.org/2000/svg',
  'aria-hidden': true,
  focusable: false,
}

export function TrashIcon({ className = 'ComponentIcon' }) {
  return (
    <svg {...svgProps} className={className}>
      <path
        d="M4 7h16M10 4h4M6 7l1 13h10l1-13M10 11v6M14 11v6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function WarningIcon({ className = 'ComponentIcon' }) {
  return (
    <svg {...svgProps} className={className}>
      <path
        d="M12 3.2 2.5 20h19L12 3.2Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M12 9.5v5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="17.4" r="1.1" fill="currentColor" />
    </svg>
  )
}
