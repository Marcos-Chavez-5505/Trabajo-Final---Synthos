import { ALBUM_TYPE_LABELS } from "@synthos/shared";
import MiniMediaCard from "./MiniMediaCard.jsx";

export default function AlbumCard({ album, onClick }) {
	if (!album) return null;

	const artistName = album.artistName ?? "Artista desconocido";

	const typeLabel = ALBUM_TYPE_LABELS[album.type] ?? album.type ?? "";

	return (
		<MiniMediaCard
			title={album.name}
			artist={artistName}
			label={typeLabel}
			coverUrl={album.coverUrl}
			onPlay={onClick}
		/>
	);
}
