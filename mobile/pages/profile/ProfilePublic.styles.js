import { StyleSheet } from "react-native";
import {
	colors,
	spacing,
	fontSize,
	lineHeight,
	fontWeight,
	radius,
	text,
} from "../../theme";

export const PROFILE_PUBLIC_STYLES = StyleSheet.create({
	scroll: {
		paddingBottom: spacing.xxl,
	},
	backButton: {
		alignSelf: "flex-start",
		marginBottom: spacing.md,
	},
	backButtonText: {
		color: colors.textMuted,
		fontSize: fontSize.medium,
		lineHeight: lineHeight.medium,
	},
	selfLabel: {
		...text.medium,
		color: colors.textMuted,
		marginTop: spacing.xs,
	},
	statsRow: {
		flexDirection: "row",
		gap: spacing.xl,
		marginTop: spacing.lg,
	},
	statValue: {
		...text.regular,
		color: colors.textPrimary,
		fontWeight: fontWeight.medium,
	},
	statLabel: {
		...text.tiny,
		color: colors.textMuted,
		marginTop: 2,
	},
	rating: {
		...text.medium,
		color: colors.textMuted,
		marginTop: spacing.md,
	},
	followButton: {
		alignSelf: "flex-start",
		marginTop: spacing.lg,
		backgroundColor: colors.fucsia,
		borderRadius: 8,
		paddingVertical: spacing.md,
		paddingHorizontal: spacing.lg,
	},
	followingButton: {
		backgroundColor: colors.volume,
	},
	followButtonText: {
		...text.button,
		color: colors.textPrimary,
		fontWeight: fontWeight.medium,
	},
	pressed: {
		opacity: 0.85,
	},
	disabled: {
		opacity: 0.5,
	},
	message: {
		...text.regular,
		color: colors.textMuted,
	},
	error: {
		...text.medium,
		color: colors.red,
		backgroundColor: colors.dangerBg,
		borderRadius: radius.card,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		marginTop: spacing.md,
	},
});
