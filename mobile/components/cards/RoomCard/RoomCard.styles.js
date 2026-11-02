import { StyleSheet } from "react-native";
import {
	colors,
	spacing,
	fontSize,
	lineHeight,
	fontWeight,
	radius,
	shadows,
} from "../../../theme";

export const ROOM_CARD_STYLES = StyleSheet.create({
	container: {
		backgroundColor: colors.surfaceLight,
		borderRadius: radius.card,
		padding: spacing.lg,
		...shadows.elevation1,
	},
	header: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: spacing.md,
	},
	iconWrapper: {
		width: 48,
		height: 48,
		borderRadius: radius.card,
		backgroundColor: colors.light,
		alignItems: "center",
		justifyContent: "center",
		flexShrink: 0,
	},
	headerText: {
		flex: 1,
		minWidth: 0,
	},
	name: {
		color: colors.textPrimary,
		fontSize: fontSize.regular,
		lineHeight: lineHeight.regular,
		fontWeight: fontWeight.regular,
	},
	host: {
		color: colors.textMuted,
		fontSize: fontSize.medium,
		lineHeight: lineHeight.medium,
		marginTop: 2,
	},
	description: {
		color: colors.textMuted,
		fontSize: fontSize.medium,
		lineHeight: lineHeight.medium,
		marginTop: spacing.md,
	},
	ratingRow: {
		marginTop: spacing.lg,
	},
	ratingText: {
		color: colors.textPrimary,
		fontSize: fontSize.medium,
		lineHeight: lineHeight.medium,
	},
	ratingMuted: {
		color: colors.textMuted,
	},
	metaRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: spacing.md,
		marginTop: spacing.lg,
	},
	metaText: {
		color: colors.textMuted,
		fontSize: fontSize.tiny,
		lineHeight: lineHeight.tiny,
	},
	actionRow: {
		flexDirection: "row",
		gap: spacing.sm,
		marginTop: spacing.md,
	},
});