import { StyleSheet } from "react-native";
import { colors, radius, spacing, text } from "../../theme";

export const ALBUMS_STYLES = StyleSheet.create({
	container: {
		backgroundColor: colors.background,
		flex: 1,
	},
	topBar: {
		paddingHorizontal: spacing.lg,
	},
	content: {
		paddingBottom: spacing.xxl,
		paddingHorizontal: spacing.lg,
		paddingTop: spacing.md,
	},
	column: {
		gap: spacing.md,
	},
	itemWrapper: {
		flex: 1,
		paddingBottom: spacing.lg,
	},

	searchPill: {
		alignItems: "center",
		backgroundColor: colors.volume,
		borderRadius: radius.full,
		flexDirection: "row",
		gap: spacing.sm,
		marginTop: spacing.md,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
	},
	searchInput: {
		...text.regular,
		color: colors.textPrimary,
		flex: 1,
		padding: 0,
	},
	placeholderColor: {
		color: colors.placeholder,
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
