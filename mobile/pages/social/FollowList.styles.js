import { StyleSheet } from "react-native";
import { colors, spacing, radius, text } from "../../theme";

export const FOLLOW_LIST_STYLES = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.surface,
		paddingTop: 60,
		paddingHorizontal: spacing.lg,
	},
	scroll: {
		paddingBottom: spacing.xxl,
	},
	backButton: {
		alignSelf: "flex-start",
		marginBottom: spacing.md,
	},
	backButtonText: {
		...text.medium,
		color: colors.textMuted,
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.md,
		marginBottom: spacing.lg,
	},
	headerText: {
		flex: 1,
		minWidth: 0,
	},
	title: {
		...text.header3,
		color: colors.textPrimary,
	},
	personName: {
		...text.medium,
		color: colors.textMuted,
		marginTop: spacing.xs,
	},
	list: {
		gap: spacing.sm,
	},
	state: {
		alignItems: "center",
		paddingVertical: spacing.xxl,
	},
	emptyTitle: {
		...text.header4,
		color: colors.textPrimary,
		marginBottom: spacing.xs,
	},
	emptyText: {
		...text.regular,
		color: colors.textMuted,
	},
	error: {
		...text.medium,
		color: colors.textMuted,
		marginTop: spacing.lg,
	},
	backToProfileButton: {
		alignSelf: "flex-start",
		backgroundColor: colors.volume,
		borderRadius: radius.sm,
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.md,
		marginTop: spacing.xl,
	},
	backToProfileText: {
		...text.button,
		color: colors.textPrimary,
	},
});
