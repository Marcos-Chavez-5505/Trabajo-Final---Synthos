import { ALBUM_TYPE_LABELS } from "@synthos/shared";
import MiniMediaCard from "../MiniMediaCard/MiniMediaCard";

export default function AlbumCard({ album, onPress, subtitle = "artist" }) {
	if (!album) return null;

	const subtitleText =
		subtitle === "year"
			? album.releaseYear
				? String(album.releaseYear)
				: "Sin año"
			: (album.artistName ?? "Artista desconocido");

	const typeLabel = ALBUM_TYPE_LABELS[album.type] ?? album.type ?? "";
	const songsLabel =
		album.songsCount != null
			? `${album.songsCount} ${
					album.songsCount === 1 ? "canción" : "canciones"
				}`
			: null;

	return (
		<MiniMediaCard
			title={album.name}
			artist={subtitleText}
			label={songsLabel ? `${typeLabel} · ${songsLabel}` : typeLabel}
			coverUrl={album.coverUrl}
			onPlay={onPress}
		/>
	);
}
