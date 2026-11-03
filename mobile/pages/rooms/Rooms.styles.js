import { StyleSheet } from "react-native";
import {
	colors,
	spacing,
	fontSize,
	lineHeight,
	fontWeight,
	radius,
} from "../../theme";

export const ROOMS_STYLES = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.surface,
		paddingTop: 60,
	},
	listContainer: {
		paddingHorizontal: spacing.lg,
		paddingBottom: spacing.xxl,
	},
	header: {
		marginBottom: spacing.lg,
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
	},
	searchWrapper: {
		backgroundColor: colors.volume,
		borderRadius: 999,
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.sm,
		marginBottom: spacing.lg,
	},
	searchInput: {
		color: colors.textPrimary,
		fontSize: fontSize.regular,
	},
	errorText: {
		color: colors.red,
		fontSize: fontSize.medium,
		marginBottom: spacing.md,
	},
	loadingText: {
		color: colors.textMuted,
		fontSize: fontSize.regular,
		textAlign: "center",
		marginTop: spacing.xxl,
	},
	emptyContainer: {
		alignItems: "center",
		paddingVertical: spacing.xxl,
	},
	emptyTitle: {
		color: colors.textPrimary,
		fontSize: fontSize.header4,
		lineHeight: lineHeight.header4,
		fontWeight: fontWeight.bold,
		marginTop: spacing.md,
	},
	emptyText: {
		color: colors.textMuted,
		fontSize: fontSize.regular,
		lineHeight: lineHeight.regular,
		textAlign: "center",
		marginTop: spacing.xs,
	},
	cardWrapper: {
		marginBottom: spacing.md,
	},
	joinButton: {
		backgroundColor: colors.fucsia,
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.lg,
		borderRadius: 8,
		alignItems: "center",
	},
	joinButtonText: {
		color: colors.textPrimary,
		fontSize: fontSize.regular,
		fontWeight: fontWeight.medium,
	},
	joinButtonDisabled: {
		opacity: 0.5,
	},
	joinError: {
		color: colors.textMuted,
		fontSize: fontSize.tiny,
		marginTop: spacing.xs,
	},
    createButton: {
        backgroundColor: colors.fucsia,
        paddingVertical: spacing.md,
        borderRadius: 8,
        alignItems: "center",
        marginBottom: spacing.lg,
    },
    createButtonText: {
        color: colors.textPrimary,
        fontSize: fontSize.regular,
        fontWeight: fontWeight.medium,
    },
});