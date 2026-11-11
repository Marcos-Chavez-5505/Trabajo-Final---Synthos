import { Pressable, Text } from "react-native";
import GeneralRow from "../GeneralRow/GeneralRow";
import RowCover from "../RowCover/RowCover";
import { SONG_ROW_STYLES as styles } from "./SongRow.styles";

export default function SongRow({ song, label, onPress, onAddToQueue }) {
	return (
		<GeneralRow
			leading={<RowCover coverUrl={song.coverUrl} />}
			title={song.title}
			subtitle={song.artist}
			label={label}
			action={
				onAddToQueue ? (
					<Pressable
						onPress={() => onAddToQueue(song)}
						style={styles.addButton}
						accessibilityRole="button"
						accessibilityLabel={`Añadir ${song.title} a la cola`}
					>
						<Text style={styles.addLabel}>+</Text>
					</Pressable>
				) : null
			}
			onPress={onPress}
			accessibilityLabel={onPress ? `Reproducir ${song.title}` : undefined}
		/>
	);
}
