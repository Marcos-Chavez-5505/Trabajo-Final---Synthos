import { Pressable, Text, View } from "react-native";
import GeneralRow from "../GeneralRow/GeneralRow";
import RowCover from "../RowCover/RowCover";
import { SONG_ROW_STYLES as styles } from "./SongRow.styles";

export default function SongRow({ song, label, onPress, onAddToQueue }) {
	const genres = Array.isArray(song.genres) ? song.genres : [];
	const genreChips =
		label || genres.length === 0 ? null : (
			<View style={styles.genres}>
				{genres.map((genre) => (
					<View key={genre} style={styles.genreChip}>
						<Text style={styles.genreText}>{genre}</Text>
					</View>
				))}
			</View>
		);

	return (
		<GeneralRow
			leading={<RowCover coverUrl={song.coverUrl} />}
			title={song.title}
			subtitle={song.artist}
			label={label}
			labelContent={genreChips}
			action={
				onAddToQueue ? (
					<Pressable
						onPress={() => onAddToQueue(song)}
						style={styles.addButton}
						accessibilityRole="button"
						accessibilityLabel={`AÃ±adir ${song.title} a la cola`}
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
