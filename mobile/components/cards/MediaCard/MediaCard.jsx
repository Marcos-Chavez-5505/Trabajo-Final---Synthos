import { Image, Pressable, Text, View } from "react-native";
import { colors, sizes } from "../../../theme";
import { MEDIA_CARD_STYLES } from "./MediaCard.styles";
import { SvgXml } from "react-native-svg";
import QueueActionButton from "../../ui/QueueActionButton/QueueActionButton";
import ScalePressable from "../../ui/ScalePressable/ScalePressable";
import { MusicNoteIcon } from "../../icons";

const PLAY_ICON = `<svg width="16" height="16" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M23.7903 10.3931C26.1482 11.6754 26.1482 14.9947 23.7903 16.2769L9.55294 24.0191C7.26124 25.2654 4.44495 23.6433 4.44495 21.0772V5.59281C4.44495 3.02669 7.26124 1.40465 9.55293 2.65087L23.7903 10.3931Z" fill="#F4F0F9"/></svg>`;

export default function MediaCard({
	title,
	artist,
	label,
	coverUrl = null,
	onPlay,
	onAddToQueue,
}) {
	return (
		<Pressable onPress={onPlay} style={MEDIA_CARD_STYLES.container}>
			<View style={MEDIA_CARD_STYLES.coverContainer}>
				{coverUrl ? (
					<Image
						source={{ uri: coverUrl }}
						style={MEDIA_CARD_STYLES.coverImage}
						resizeMode="cover"
					/>
				) : (
					<View style={MEDIA_CARD_STYLES.coverFallback}>
						<MusicNoteIcon size={32} color={colors.textPrimary} />
					</View>
				)}
			</View>

			<View style={MEDIA_CARD_STYLES.overlay}>
				<Text style={MEDIA_CARD_STYLES.label} numberOfLines={1}>
					{label}
				</Text>
				<Text style={MEDIA_CARD_STYLES.title} numberOfLines={1}>
					{title}
				</Text>
				<Text style={MEDIA_CARD_STYLES.artist} numberOfLines={1}>
					{artist}
				</Text>
			</View>

			<View style={MEDIA_CARD_STYLES.buttonsContainer}>
				{onAddToQueue && (
					<QueueActionButton
						onAdd={onAddToQueue}
						label={`Añadir ${title} a la cola`}
						size={16}
						buttonSize={sizes.mediaCardPlay}
						style={MEDIA_CARD_STYLES.queueButton}
					/>
				)}

				<ScalePressable
					onPress={onPlay}
					style={MEDIA_CARD_STYLES.playButton}
					hitSlop={8}
					accessibilityRole="button"
					accessibilityLabel={`Reproducir ${title}`}
				>
					<SvgXml xml={PLAY_ICON} width={16} height={16} />
				</ScalePressable>
			</View>
		</Pressable>
	);
}
