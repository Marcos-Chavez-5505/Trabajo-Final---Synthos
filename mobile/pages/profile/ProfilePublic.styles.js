import { StyleSheet } from "react-native";
import {
	colors,
	spacing,
	fontSize,
	lineHeight,
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
	rating: {
		...text.medium,
		color: colors.textMuted,
		marginTop: spacing.md,
	},
	followButton: {
		marginTop: spacing.lg,
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
