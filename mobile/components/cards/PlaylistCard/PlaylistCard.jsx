import { Image, Pressable, Text, View } from "react-native";
import { colors } from "../../../theme";
import { PlaylistIcon } from "../../icons";
import { PLAYLIST_CARD_STYLES as styles } from "./PlaylistCard.styles";

/**
 * Tarjeta de una playlist en la grilla de Playlists (análoga a `RoomCard` y a
 * `PlaylistTile` web).
 *
 * No reproduce: una playlist sin resolver contra la API todavía no tiene cola y
 * arma la cola el detalle con `playSongs`.
 */
export default function PlaylistCard({ playlist, onPress }) {
	const count = playlist.songIds.length;

	return (
		<Pressable
			onPress={onPress}
			style={({ pressed }) => [styles.card, pressed && styles.pressed]}
			accessibilityRole="button"
			accessibilityLabel={`Abrir ${playlist.name}`}
		>
			<View style={styles.cover}>
				{playlist.coverUrl ? (
					<Image
						source={{ uri: playlist.coverUrl }}
						style={styles.coverImage}
						resizeMode="cover"
					/>
				) : (
					<PlaylistIcon size={32} color={colors.textPrimary} />
				)}
			</View>

			<Text style={styles.name} numberOfLines={1}>
				{playlist.name}
			</Text>

			<Text style={styles.meta} numberOfLines={1}>
				{playlist.isFavorites
					? "Generada automáticamente"
					: `${count} ${count === 1 ? "canción" : "canciones"}`}
			</Text>

			{playlist.isCollaborative ? (
				<Text style={styles.collaborative} numberOfLines={1}>
					{playlist.role === "creator"
						? "Colaborativa"
						: `De ${playlist.creator.username}`}
				</Text>
			) : null}
		</Pressable>
	);
}
