import { StyleSheet } from "react-native";
import { colors, spacing, text } from "../../../theme";

export const SCREEN_HEADER_STYLES = StyleSheet.create({
	container: {
		paddingHorizontal: spacing.lg,
		paddingBottom: spacing.sm,
	},
	titleRow: {
		alignItems: "center",
		flexDirection: "row",
		justifyContent: "space-between",
	},
	title: {
		...text.header3,
		color: colors.textPrimary,
	},
	subtitle: {
		...text.regular,
		color: colors.textMuted,
		marginTop: spacing.xs,
	},
});
