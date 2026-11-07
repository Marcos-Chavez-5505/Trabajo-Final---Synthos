import { Image, View } from "react-native";
import { colors } from "../../../theme";
import { MusicNoteIcon } from "../../icons";
import { ROW_COVER_STYLES as styles } from "./RowCover.styles";

/**
 * Portada cuadrada de una fila. Si la entidad no tiene imagen, muestra la nota
 * musical con el mismo fallback que las cards.
 */
export default function RowCover({ coverUrl = null }) {
	return (
		<View style={styles.cover}>
			{coverUrl ? (
				<Image
					source={{ uri: coverUrl }}
					style={styles.image}
					resizeMode="cover"
				/>
			) : (
				<View style={styles.fallback}>
					<MusicNoteIcon size={28} color={colors.textPrimary} />
				</View>
			)}
		</View>
	);
}
