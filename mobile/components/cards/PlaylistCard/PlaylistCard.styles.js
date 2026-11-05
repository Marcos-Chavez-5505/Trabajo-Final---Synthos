import { StyleSheet } from "react-native";
import {
	colors,
	fontWeight,
	radius,
	shadows,
	spacing,
	text,
} from "../../../theme";

export const PLAYLIST_CARD_STYLES = StyleSheet.create({
	card: {
		flex: 1,
		backgroundColor: colors.surfaceLight,
		borderRadius: radius.card,
		padding: spacing.md,
		...shadows.elevation1,
	},
	pressed: { opacity: 0.9 },
	cover: {
		aspectRatio: 1,
		width: "100%",
		borderRadius: radius.card,
		backgroundColor: colors.light,
		alignItems: "center",
		justifyContent: "center",
		overflow: "hidden",
	},
	coverImage: {
		width: "100%",
		height: "100%",
	},
	name: {
		...text.regular,
		color: colors.textPrimary,
		marginTop: spacing.sm,
	},
	meta: {
		...text.medium,
		color: colors.textMuted,
		marginTop: 2,
	},
	collaborative: {
		...text.tiny,
		color: colors.fucsia,
		fontWeight: fontWeight.bold,
		marginTop: 4,
	},
});
