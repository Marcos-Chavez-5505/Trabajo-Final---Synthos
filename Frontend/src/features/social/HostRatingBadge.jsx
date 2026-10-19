/**
 * Calificación promedio como anfitrión de salas (TS-11).
 *
 * Aparece en el perfil propio y en el de otra persona, y solo cuando hay
 * calificaciones: con `hostRating === null` no se muestra nada, porque "todavía
 * sin calificar" no es lo mismo que "calificado con cero".
 *
 * No lleva enlace: la lista de quién calificado a quién no es parte del alcance, y
 * un número sin destino es menos confuso que uno que promete una pantalla.
 *
 * @param {object} props
 * @param {number|null} props.hostRating Promedio sobre 5, o `null` si no hay.
 * @param {number} [props.hostRatingsCount] Cuántas calificaciones lo componen.
 */
export default function HostRatingBadge({ hostRating, hostRatingsCount = 0 }) {
  if (hostRating === null || hostRating === undefined) return null

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