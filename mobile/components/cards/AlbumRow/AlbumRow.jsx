import { Image, Pressable, Text, View } from "react-native";
import { colors } from "../../../theme";
import { MusicNoteIcon } from "../../icons";
import { ALBUM_ROW_STYLES as styles } from "./AlbumRow.styles";

/**
 * Fila de álbum para listas y resultados de búsqueda.
 *
 * Presentacional: recibe los mismos campos que las cards (`title`, `artist`,
 * `label`, `coverUrl`) y delega la navegación en `onPress`. Si el álbum todavía
 * no tiene pantalla de detalle, se usa sin `onPress`.
 */
export default function AlbumRow({
	title,
	artist,
	label,
	coverUrl = null,
	onPress,
}) {
	return (
		<Pressable
			onPress={onPress}
			disabled={!onPress}
			style={({ pressed }) => [styles.row, pressed && styles.pressed]}
			accessibilityRole={onPress ? "button" : undefined}
			accessibilityLabel={onPress ? `Ver álbum ${title}` : undefined}
		>
			<View style={styles.cover}>
				{coverUrl ? (
					<Image
						source={{ uri: coverUrl }}
						style={styles.coverImage}
						resizeMode="cover"
					/>
				) : (
					<View style={styles.coverFallback}>
						<MusicNoteIcon size={28} color={colors.textPrimary} />
					</View>
				)}
			</View>

			<View style={styles.text}>
				<Text style={styles.title} numberOfLines={1}>
					{title}
				</Text>
				<Text style={styles.artist} numberOfLines={1}>
					{artist}
				</Text>
				{label ? (
					<Text style={styles.label} numberOfLines={1}>
						{label}
					</Text>
				) : null}
			</View>
		</Pressable>
	);
}
