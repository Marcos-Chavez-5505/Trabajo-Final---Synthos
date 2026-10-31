import { Image, Pressable, Text, View } from "react-native";
import { colors } from "../../../theme";
import { MEDIA_CARD_STYLES } from "./MediaCard.styles";
import { SvgXml } from "react-native-svg";

import musicNoteIcon from "@synthos/shared/assets/music_note.svg";
const PLAY_ICON = `<svg width="16" height="16" viewBox="0 0 27 27" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M23.7903 10.3931C26.1482 11.6754 26.1482 14.9947 23.7903 16.2769L9.55294 24.0191C7.26124 25.2654 4.44495 23.6433 4.44495 21.0772V5.59281C4.44495 3.02669 7.26124 1.40465 9.55293 2.65087L23.7903 10.3931Z" fill="#F4F0F9"/></svg>`;

export default function MediaCard({
	title,
	artist,
	label,
	coverUrl = null,
	onPlay,
	onAddToQueue,
}) {
	console.log(`musicNoteIcon cargada: ${typeof musicNoteIcon !== "undefined"}`);
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
					<Image
						source={musicNoteIcon}
						style={MEDIA_CARD_STYLES.coverFallback}
						resizeMode="contain"
					/>
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
					<Pressable
						onPress={onAddToQueue}
						style={MEDIA_CARD_STYLES.queueButton}
						hitSlop={8}
					>
						<Text style={{ color: colors.textPrimary, fontSize: 16 }}>+</Text>
					</Pressable>
				)}

				<Pressable
					onPress={onPlay}
					style={MEDIA_CARD_STYLES.playButton}
					hitSlop={8}
				>
					<SvgXml xml={PLAY_ICON} width={16} height={16} />
				</Pressable>
			</View>
		</Pressable>
	);
}
