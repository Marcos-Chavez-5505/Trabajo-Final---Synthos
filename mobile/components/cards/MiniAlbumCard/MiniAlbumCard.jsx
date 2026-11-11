import { useNavigation } from "@react-navigation/native";
import { ALBUM_TYPE_LABELS } from "@synthos/shared";
import MiniMediaCard from "../MiniMediaCard/MiniMediaCard";

export default function MiniAlbumCard({ album, onAddToQueue }) {
	const navigation = useNavigation();

	const songsLabel = `${album.songsCount} ${
		album.songsCount === 1 ? "canción" : "canciones"
	}`;
	const typeLabel = ALBUM_TYPE_LABELS[album.type] ?? album.type;

	return (
		<MiniMediaCard
			title={album.name}
			artist={album.releaseYear ? String(album.releaseYear) : "Sin año"}
			label={`${typeLabel} · ${songsLabel}`}
			coverUrl={album.coverUrl}
			onPlay={() => navigation.navigate("AlbumDetail", { id: album.id })}
			onAddToQueue={onAddToQueue}
		/>
	);
}
