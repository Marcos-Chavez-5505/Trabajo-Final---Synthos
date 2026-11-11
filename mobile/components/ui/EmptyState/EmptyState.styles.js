import { StyleSheet } from "react-native";
import { colors, spacing, text } from "../../../theme";

export const EMPTY_STATE_STYLES = StyleSheet.create({
	container: {
		alignItems: "center",
		gap: spacing.sm,
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.xxl,
	},
	title: {
		...text.header4,
		color: colors.textPrimary,
		marginTop: spacing.md,
		textAlign: "center",
	},
	message: {
		...text.regular,
		color: colors.textMuted,
		textAlign: "center",
	},
});
