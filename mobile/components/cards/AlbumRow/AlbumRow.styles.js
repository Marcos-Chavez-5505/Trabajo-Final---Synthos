import { StyleSheet } from "react-native";
import {
	colors,
	radius,
	shadows,
	spacing,
	text,
} from "../../../theme";

export const ALBUM_ROW_STYLES = StyleSheet.create({
	row: {
		alignItems: "center",
		backgroundColor: colors.surfaceLight,
		borderRadius: radius.card,
		flexDirection: "row",
		gap: spacing.md,
		padding: spacing.md,
		...shadows.elevation1,
	},
	cover: {
		alignItems: "center",
		backgroundColor: colors.light,
		borderRadius: radius.sm,
		height: 56,
		justifyContent: "center",
		overflow: "hidden",
		width: 56,
	},
	coverImage: {
		height: "100%",
		width: "100%",
	},
	coverFallback: {
		opacity: 0.6,
	},
	text: {
		flex: 1,
		minWidth: 0,
	},
	title: {
		...text.regular,
		color: colors.textPrimary,
	},
	artist: {
		...text.medium,
		color: colors.textMuted,
		marginTop: 2,
	},
	label: {
		...text.tiny,
		color: colors.fucsia,
		marginTop: 2,
		textTransform: "uppercase",
	},
	pressed: {
		opacity: 0.7,
	},
});
