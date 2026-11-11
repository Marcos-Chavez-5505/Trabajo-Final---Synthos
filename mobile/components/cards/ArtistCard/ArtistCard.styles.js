import { StyleSheet } from "react-native";
import { colors, radius, sizes, spacing, text } from "../../../theme";

export const ARTIST_CARD_STYLES = StyleSheet.create({
	card: {
		flexShrink: 0,
		width: sizes.miniMediaCard,
	},
	link: {
		borderRadius: radius.card,
		width: "100%",
	},
	avatar: {
		alignSelf: "center",
	},
	name: {
		...text.regular,
		color: colors.textPrimary,
		marginTop: spacing.sm,
		width: "100%",
	},
	albums: {
		...text.medium,
		color: colors.textMuted,
		marginTop: 2,
		width: "100%",
	},
	pressed: {
		opacity: 0.9,
	},
});
