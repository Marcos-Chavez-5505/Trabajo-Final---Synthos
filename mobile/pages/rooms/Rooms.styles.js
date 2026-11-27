import { StyleSheet } from "react-native";
import {
	colors,
	spacing,
	fontSize,
	lineHeight,
	fontWeight,
	radius,
	opacity,
	sizes,
	text,
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
	topBar: {
		paddingHorizontal: spacing.lg,
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
		paddingVertical: sizes.buttonPaddingY,
		paddingHorizontal: spacing.xl,
		borderRadius: radius.full,
		alignItems: "center",
	},
	joinButtonText: {
		...text.button,
		color: colors.surface,
		fontWeight: fontWeight.bold,
	},
	joinButtonDisabled: {
		opacity: opacity.disabled,
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
	pagination: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: spacing.md,
		paddingVertical: spacing.lg,
	},
	pageButton: {
		backgroundColor: colors.volume,
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.lg,
		borderRadius: radius.full,
	},
	pageButtonDisabled: {
		opacity: opacity.disabled,
	},
	pageButtonText: {
		...text.button,
		color: colors.textPrimary,
	},
	pageLabel: {
		color: colors.textMuted,
		fontSize: fontSize.medium,
		lineHeight: lineHeight.medium,
	},
});