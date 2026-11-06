import { StyleSheet } from "react-native";
import {
	colors,
	fontWeight,
	radius,
	shadows,
	spacing,
	text,
} from "../../theme";

export const CREATE_PLAYLIST_FORM_STYLES = StyleSheet.create({
	card: {
		backgroundColor: colors.surfaceLight,
		borderRadius: radius.card,
		padding: spacing.lg,
		gap: spacing.sm,
		...shadows.elevation1,
	},
	title: {
		...text.header4,
		color: colors.textPrimary,
		marginBottom: spacing.xs,
	},
	input: {
		backgroundColor: colors.volume,
		borderRadius: 8,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		color: colors.textPrimary,
		...text.regular,
	},
	textarea: {
		minHeight: 64,
		textAlignVertical: "top",
	},
	error: {
		...text.medium,
		color: colors.red,
		backgroundColor: colors.dangerBg,
		borderRadius: 8,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
	},
	buttonsRow: {
		flexDirection: "row",
		gap: spacing.sm,
		marginTop: spacing.xs,
	},
	primaryButton: {
		backgroundColor: colors.fucsia,
		borderRadius: 8,
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.sm,
	},
	secondaryButton: {
		backgroundColor: colors.volume,
		borderRadius: 8,
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.sm,
	},
	buttonText: {
		...text.button,
		color: colors.textPrimary,
		fontWeight: fontWeight.medium,
	},
	pressed: { opacity: 0.85 },
	disabled: { opacity: 0.5 },
});
