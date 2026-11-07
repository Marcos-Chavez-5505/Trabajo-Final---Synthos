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
		backgroundColor: colors.surfaceLight,
		borderRadius: radius.full,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
	},
	buttonLabel: {
		...text.large,
		color: colors.textPrimary,
	},
	pageLabel: {
		...text.large,
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
