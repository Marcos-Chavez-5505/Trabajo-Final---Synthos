import { Image, Pressable, Text, View } from "react-native";
import QueueActionButton from "../../ui/QueueActionButton/QueueActionButton";
import { MINI_MEDIA_CARD_STYLES as styles } from "./MiniMediaCard.styles";
import { colors } from "../../../theme";
import { MusicNoteIcon } from "../../icons";

export default function MiniMediaCard({
	title,
	artist,
	label,
	coverUrl = null,
	onPlay,
	onAddToQueue,
}) {
	return (
		<View style={styles.container}>
			<Pressable onPress={onPlay} style={styles.coverWrapper}>
				{coverUrl ? (
					<Image
						source={{ uri: coverUrl }}
						style={styles.coverImage}
						resizeMode="cover"
					/>
				) : (
					<View style={styles.coverFallback}>
						<MusicNoteIcon size={32} color={colors.textPrimary} />
					</View>
				)}
			</Pressable>

			{onAddToQueue ? (
				<View style={styles.queueButtonWrapper}>
					<QueueActionButton
						onAdd={onAddToQueue}
						label={`Añadir ${title} a la cola`}
						size={16}
						buttonSize={32}
						style={styles.queueButton}
					/>
				</View>
			) : null}

			<Text style={styles.title} numberOfLines={1}>
				{title}
			</Text>
			<Text style={styles.artist} numberOfLines={1}>
				{artist}
			</Text>
			<Text style={styles.label} numberOfLines={1}>
				{label}
			</Text>
		</View>
	);
}