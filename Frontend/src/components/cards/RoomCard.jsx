import { Link } from "react-router-dom";
import roomIcon from "@synthos/shared/assets/icons/headphones.svg";

/**
 * Tarjeta de una sala en la grilla de `/salas`.
 *
 * Muestra el nombre, quién la anfitriona, su calificación promedio, cuántas
 * personas están y cuántas caben. El botón va en el slot `action`, fuera del
 * enlace, por el mismo patrón que `UserRow` con `SearchPersonRow` (TS-10b): así
 * la tarjeta es presentacional y la pantalla decide qué acción ofrecer.
 *
 * `isPrivate` casi nunca se ve acá: el listado público no trae salas privadas
 * (se entra a ellas con el código, D14), pero la tarjeta también se usa en
 * "Mis Salas", donde sí puede aparecer una privada.
 */
export default function RoomCard({ room, action }) {
	const full =
		room.membersCount >= room.maxCapacity && room.maxCapacity !== null;

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
							Anfitriona:{" "}
							{room.hostId || room.hostUserId || room.ownerId ? (
								<Link
									to={`/profile/${room.hostId || room.hostUserId || room.ownerId}`}
									className="hover:underline"
								>
									{room.hostUsername}
								</Link>
							) : (
								room.hostUsername
							)}
						</p>
					)}
				</div>
			</div>

			{room.description && (
				<p className="text-muted-foreground TextMedium mt-3 line-clamp-2">
					{room.description}
				</p>
			)}

			{/* La calificación del anfitrión es lo que ordena la grilla cuando el
          criterio es "Mejor calificado". Ahora "sin calificaciones" se decide
          por `ratingsCount` y no por `hostRating === null`: el SQL hace
          `COALESCE(..., 0)`, así que el promedio nunca llega en null. */}
			<div className="mt-4 flex items-center gap-1.5">
				{!room.ratingsCount ? (
					<span className="text-muted-foreground TextMedium">
						Sin calificaciones
					</span>
				) : (
					<span className="text-foreground TextMedium">
						{Number(room.hostRating).toFixed(2)}
						<span className="text-muted-foreground"> / 5</span>
						<span className="text-muted-foreground">
							{" -- "}
							{room.ratingsCount}{" "}
							{room.ratingsCount === 1
								? "persona calificó"
								: "personas calificaron"}
						</span>
					</span>
				)}
			</div>

			<div className="text-muted-foreground TextTiny mt-auto flex items-center gap-3 pt-4">
				<span>
					{room.membersCount}
					{room.maxCapacity !== null && `/${room.maxCapacity}`}
					{room.membersCount === 1 ? " persona" : " personas"}
				</span>
				<span>
					{room.songsCount} {room.songsCount === 1 ? "canción" : "canciones"}
				</span>
				{room.isPrivate && <span>Privada</span>}
				{full && <span>Llena</span>}
			</div>

			{action && <div className="mt-3 flex gap-2">{action}</div>}
		</article>
	);
}
