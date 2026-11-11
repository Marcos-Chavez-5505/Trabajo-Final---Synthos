import { StyleSheet } from "react-native";
import { colors, spacing, text } from "../../theme";

export const POPULAR_STYLES = StyleSheet.create({
	container: {
		backgroundColor: colors.background,
		flex: 1,
	},
	week: {
		...text.medium,
		color: colors.textMuted,
		marginTop: spacing.sm,
	},
	content: {
		gap: spacing.sm,
		paddingBottom: spacing.xxl,
		paddingHorizontal: spacing.lg,
		paddingTop: spacing.md,
	},
	emptyContainer: {
		alignItems: "center",
		gap: spacing.sm,
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.xxl,
	},
	emptyMessage: {
		...text.regular,
		color: colors.textMuted,
		textAlign: "center",
	},
});
