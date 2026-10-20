/**
 * Calificación promedio como anfitrión de salas (TS-11).
 *
 * Aparece en el perfil propio y en el de otra persona. Con `alwaysShow` la fila
 * se renderiza igual cuando no hay calificaciones, con "Sin calificaciones"
 * (mismo criterio que la tarjeta de sala): el perfil de cada persona muestra su
 * propio rating, aunque todavía no tenga votos. Sin `alwaysShow` pasa a ser
 * invisible con `hostRating === null`, para listados donde "todavía sin calificar"
 * no aporta.
 *
 * No lleva enlace: la lista de quién calificado a quién no es parte del alcance, y
 * un número sin destino es menos confuso que uno que promete una pantalla.
 *
 * @param {object} props
 * @param {number|null} props.hostRating Promedio sobre 5, o `null` si no hay.
 * @param {number} [props.hostRatingsCount] Cuántas calificaciones lo componen.
 * @param {boolean} [props.alwaysShow] Si es `true`, muestra el estado vacío.
 */
export default function HostRatingBadge({ hostRating, hostRatingsCount = 0, alwaysShow = false }) {
  if (hostRating === null || hostRating === undefined) {
    if (!alwaysShow) return null

    return (
      <p className="text-muted-foreground TextMedium mt-2 flex items-center gap-1.5">
        <span>Sin calificaciones como anfitrión</span>
      </p>
    )
  }

  return (
    <p className="text-muted-foreground TextMedium mt-2 flex items-center gap-1.5">
      <span className="text-foreground">
        {hostRating.toFixed(2)}
        <span className="text-muted-foreground"> / 5</span>
      </span>
      {hostRatingsCount > 0 && (
        <span>
          como anfitrión · {hostRatingsCount}{' '}
          {hostRatingsCount === 1 ? 'calificación' : 'calificaciones'}
        </span>
      )}
    </p>
  )
}