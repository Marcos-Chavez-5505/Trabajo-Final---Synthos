import { StyleSheet } from "react-native";
import {
	colors,
	spacing,
	fontSize,
	lineHeight,
	fontWeight,
	radius,
} from "../../theme";

export const PROFILE_STYLES = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.surface,
		paddingTop: 60,
		paddingHorizontal: spacing.lg,
	},
	loadingContainer: {
		flex: 1,
		backgroundColor: colors.surface,
		justifyContent: "center",
		alignItems: "center",
	},
	card: {
		backgroundColor: colors.surfaceLight,
		borderRadius: radius.card,
		padding: spacing.lg,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.lg,
	},
	headerText: {
		flex: 1,
	},
	username: {
		color: colors.textPrimary,
		fontSize: fontSize.header3,
		lineHeight: lineHeight.header3,
		fontWeight: fontWeight.bold,
	},
	email: {
		color: colors.textMuted,
		fontSize: fontSize.medium,
		lineHeight: lineHeight.medium,
		marginTop: spacing.xs,
	},
	bio: {
		color: colors.textPrimary,
		fontSize: fontSize.regular,
		lineHeight: lineHeight.regular,
		marginTop: spacing.lg,
	},
	editButton: {
		marginTop: spacing.xl,
		backgroundColor: colors.fucsia,
		paddingVertical: spacing.md,
		paddingHorizontal: spacing.lg,
		borderRadius: 8,
		alignSelf: "flex-start",
	},
	editButtonText: {
		color: colors.textPrimary,
		fontSize: fontSize.regular,
		fontWeight: fontWeight.medium,
	},
	recommendationsTitle: {
		color: colors.textPrimary,
		fontSize: fontSize.header3,
		lineHeight: lineHeight.header3,
		fontWeight: fontWeight.bold,
		marginTop: spacing.xl,
		marginBottom: spacing.md,
	},
	emptyText: {
		color: colors.textMuted,
		fontSize: fontSize.regular,
		lineHeight: lineHeight.regular,
	},
});