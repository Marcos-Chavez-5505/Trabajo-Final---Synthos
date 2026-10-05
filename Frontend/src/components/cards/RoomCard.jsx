import roomIcon from '../../assets/join_music_room.svg'

/**
 * Tarjeta de una sala en la grilla de `/salas`.
 *
 * Muestra el nombre, quién la anfitriona, el cupo y —lo que pide TS-17— la
 * calificación promedio del anfitrión, con el ícono de sala y el número sobre 5.
 *
 * No reproduce ni permite unirse: esas son TS-14/TS-15/TS-19, y esta tarjeta es
 * solo de lectura para que se pueda comprobar el orden.
 *
 * `isPrivate` no se oculta: la sala privada aparece igual con su candado, porque
 * el listado todavía no filtra (eso es TS-16). Cuando llegue el filtro, esta
 * tarjeta no cambia.
 */
export default function RoomCard({ room }) {
  const count = room.songIds.length

  return (
    <article className="SurfaceLight CardRadius Elevation1 flex h-full flex-col p-4">
      <div className="flex items-start gap-3">
        <div className="Light CardRadius flex h-12 w-12 shrink-0 items-center justify-center">
          <img
            src={roomIcon}
            alt=""
            aria-hidden="true"
            className="h-6 w-6 invert opacity-70"
          />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-foreground TextRegluar truncate">{room.name}</h3>

          {room.hostUsername && (
            <p className="text-muted-foreground TextMedium mt-0.5 truncate">
              Anfitriona: {room.hostUsername}
            </p>
          )}
        </div>
      </div>

      {room.description && (
        <p className="text-muted-foreground TextMedium mt-3 line-clamp-2">
          {room.description}
        </p>
      )}

      {/* TS-17: la calificación del anfitrión, que es lo que ordena la grilla.
          El "Sin calificar" importa: `hostRating` en null no es un 0. */}
      <div className="mt-4 flex items-center gap-1.5">
        {room.hostRating === null ? (
          <span className="text-muted-foreground TextMedium">Sin calificar</span>
        ) : (
          <span className="text-foreground TextMedium">
            {room.hostRating.toFixed(2)}
            <span className="text-muted-foreground"> / 5</span>
            {room.ratingsCount > 0 && (
              <span className="text-muted-foreground">
                {' '}
                · {room.ratingsCount}{' '}
                {room.ratingsCount === 1 ? 'calificación' : 'calificaciones'}
              </span>
            )}
          </span>
        )}
      </div>

      <div className="text-muted-foreground TextTiny mt-auto flex items-center gap-3 pt-4">
        <span>
          {count} {count === 1 ? 'canción' : 'canciones'}
        </span>
        {room.maxCapacity !== null && <span>Cupo {room.maxCapacity}</span>}
        {room.isPrivate && <span>Privada</span>}
      </div>
    </article>
  )
}