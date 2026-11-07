import { ALBUM_TYPE_LABELS } from "@synthos/shared";
import GeneralRow from "../GeneralRow/GeneralRow";
import RowCover from "../RowCover/RowCover";

/**
 * Si el álbum todavía no tiene pantalla de detalle, se usa sin `onPress`.
 */
export default function AlbumRow({ album, onPress }) {
	const label = ALBUM_TYPE_LABELS[album.type] ?? album.type;

	return (
		<GeneralRow
			leading={<RowCover coverUrl={album.coverUrl} />}
			title={album.name}
			subtitle={album.artistName ?? "Artista desconocido"}
			label={label}
			onPress={onPress}
			accessibilityLabel={onPress ? `Ver álbum ${album.name}` : undefined}
		/>
	);
}
