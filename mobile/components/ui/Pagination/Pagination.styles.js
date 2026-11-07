import { StyleSheet } from "react-native";
import { colors, opacity, radius, spacing, text } from "../../../theme";

export const PAGINATION_STYLES = StyleSheet.create({
	container: {
		alignItems: "center",
		flexDirection: "row",
		gap: spacing.sm,
		justifyContent: "center",
		marginTop: spacing.lg,
	},
	button: {
		alignItems: "center",
		backgroundColor: colors.surfaceLight,
		borderRadius: radius.full,
		flexDirection: "row",
		gap: spacing.xs,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
	},
	buttonLabel: {
		...text.button,
		color: colors.textPrimary,
	},
	pageLabel: {
		...text.medium,
		color: colors.textPrimary,
		opacity: opacity.muted,
	},
	pressed: {
		opacity: 0.85,
	},
	disabled: {
		opacity: opacity.disabled,
	},
});
