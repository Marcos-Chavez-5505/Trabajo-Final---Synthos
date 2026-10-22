import { Link } from "react-router-dom";
import Avatar from "../ui/Avatar.jsx";

/**
 * Tarjeta de artista para `/artistas`: foto redonda, nombre y cantidad de
 * álbumes. El destino es el detalle, donde se listan los discos.
 *
 * Es presentacional, igual que `MediaCard` y `UserRow`: recibe el artista ya
 * mapeado por `artistsService` y no pide datos.
 */
export default function ArtistCard({ artist }) {
	const albumsLabel = `${artist.albumsCount} ${
		artist.albumsCount === 1 ? "álbum" : "álbumes"
	}`;

	return (
		<article className="MiniMediaCardWidth shrink-0">
			<Link
				to={`/artistas/${artist.id}`}
				className="group block CardRadius focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
			>
				<Avatar
					src={artist.pictureUrl}
					name={artist.name}
					className="aspect-square w-full transition-opacity group-hover:opacity-90"
				/>

				<p className="text-foreground TextRegluar mt-2 truncate">
					{artist.name}
				</p>
				<p className="text-muted-foreground TextMedium mt-0.5 truncate">
					{albumsLabel}
				</p>
			</Link>
		</article>
	);
}
