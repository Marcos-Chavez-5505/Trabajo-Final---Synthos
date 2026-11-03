import { StyleSheet } from "react-native";
import {
	colors,
	spacing,
	fontSize,
	lineHeight,
	fontWeight,
	radius,
} from "../../theme";

export const CREATE_ROOM_STYLES = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.surface,
		paddingTop: 60,
	},
	scroll: {
		paddingHorizontal: spacing.lg,
		paddingBottom: spacing.xxl,
	},
	title: {
		color: colors.textPrimary,
		fontSize: fontSize.header3,
		lineHeight: lineHeight.header3,
		fontWeight: fontWeight.bold,
	},
	subtitle: {
		color: colors.textMuted,
		fontSize: fontSize.medium,
		lineHeight: lineHeight.medium,
		marginTop: spacing.xs,
		marginBottom: spacing.xl,
	},
	label: {
		color: colors.textMuted,
		fontSize: fontSize.medium,
		lineHeight: lineHeight.medium,
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
	visibilityRow: {
		flexDirection: "row",
		gap: spacing.sm,
		marginBottom: spacing.sm,
	},
	visibilityButton: {
		flex: 1,
		paddingVertical: spacing.md,
		borderRadius: 8,
		alignItems: "center",
	},
	visibilityButtonActive: {
		backgroundColor: colors.fucsia,
	},
	visibilityButtonInactive: {
		backgroundColor: colors.volume,
	},
	visibilityButtonText: {
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
	playlistItem: {
		backgroundColor: colors.volume,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.md,
		borderRadius: 8,
		marginBottom: spacing.sm,
	},
	playlistItemActive: {
		borderWidth: 2,
		borderColor: colors.fucsia,
	},
	playlistName: {
		color: colors.textPrimary,
		fontSize: fontSize.regular,
	},
	playlistMeta: {
		color: colors.textMuted,
		fontSize: fontSize.tiny,
		marginTop: 2,
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
		marginTop: spacing.md,
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
	loadingText: {
		color: colors.textMuted,
		fontSize: fontSize.regular,
		textAlign: "center",
		marginTop: spacing.xxl,
	},
	emptyContainer: {
		backgroundColor: colors.surfaceLight,
		borderRadius: radius.card,
		padding: spacing.lg,
	},
	emptyTitle: {
		color: colors.textPrimary,
		fontSize: fontSize.header4,
		lineHeight: lineHeight.header4,
		fontWeight: fontWeight.bold,
	},
	emptyText: {
		color: colors.textMuted,
		fontSize: fontSize.regular,
		lineHeight: lineHeight.regular,
		marginTop: spacing.xs,
	},
});