import { StyleSheet } from "react-native";
import { colors, spacing, fontSize, lineHeight, fontWeight, radius } from "../../theme";

export const PROFILE_EDIT_STYLES = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.surface,
		paddingTop: 60,
		paddingHorizontal: spacing.lg,
	},
	card: {
		backgroundColor: colors.surfaceLight,
		borderRadius: radius.card,
		padding: spacing.lg,
	},
	title: {
		color: colors.textPrimary,
		fontSize: fontSize.header4,
		lineHeight: lineHeight.header4,
		fontWeight: fontWeight.bold,
		marginBottom: spacing.lg,
	},
	avatarRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.lg,
		marginBottom: spacing.md,
	},
	avatarButtons: {
		flex: 1,
		gap: spacing.sm,
	},
	smallButton: {
		backgroundColor: colors.volume,
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.md,
		borderRadius: 8,
		alignItems: "center",
	},
	smallButtonText: {
		color: colors.textPrimary,
		fontSize: fontSize.regular,
		fontWeight: fontWeight.medium,
	},
	hint: {
		color: colors.textMuted,
		fontSize: fontSize.tiny,
		lineHeight: lineHeight.tiny,
		marginBottom: spacing.lg,
	},
	label: {
		color: colors.textPrimary,
		fontSize: fontSize.regular,
		marginBottom: spacing.xs,
	},
	input: {
		backgroundColor: colors.volume,
		color: colors.textPrimary,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.md,
		borderRadius: 8,
		fontSize: fontSize.regular,
		marginBottom: spacing.lg,
	},
	textarea: {
		minHeight: 80,
		textAlignVertical: "top",
	},
	error: {
		color: colors.red,
		backgroundColor: colors.dangerBg,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		borderRadius: 8,
		fontSize: fontSize.medium,
		marginBottom: spacing.md,
	},
	buttonsRow: {
		flexDirection: "row",
		gap: spacing.sm,
	},
	buttonPrimary: {
		flex: 1,
		backgroundColor: colors.fucsia,
		paddingVertical: spacing.md,
		borderRadius: 8,
		alignItems: "center",
	},
	buttonSecondary: {
		flex: 1,
		backgroundColor: colors.volume,
		paddingVertical: spacing.md,
		borderRadius: 8,
		alignItems: "center",
	},
	buttonText: {
		color: colors.textPrimary,
		fontSize: fontSize.regular,
		fontWeight: fontWeight.medium,
	},
	buttonDisabled: {
		opacity: 0.5,
	},
});