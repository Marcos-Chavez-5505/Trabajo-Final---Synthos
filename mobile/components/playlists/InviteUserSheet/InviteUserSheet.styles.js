import { StyleSheet } from "react-native";
import { colors, radius, sizes, spacing, text } from "../../../theme";

export const INVITE_USER_SHEET_STYLES = StyleSheet.create({
	content: {
		gap: spacing.md,
	},
	header: {
		gap: spacing.xs,
	},
	visibility: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
	},
	visibilityText: {
		...text.medium,
		color: colors.textMuted,
	},
	title: {
		...text.header3,
		color: colors.textPrimary,
	},
	close: {
		position: "absolute",
		top: 0,
		right: 0,
		padding: spacing.xs,
	},
	section: {
		gap: spacing.sm,
	},
	sectionTitle: {
		...text.header4,
		color: colors.textPrimary,
	},
	error: {
		...text.medium,
		color: colors.red,
		backgroundColor: colors.dangerBg,
		borderRadius: radius.card,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
	},
	searchWrapper: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		height: sizes.buttonHeight,
		backgroundColor: colors.volume,
		borderRadius: radius.full,
		paddingHorizontal: spacing.md,
	},
	searchInput: {
		flex: 1,
		borderWidth: 0,
		backgroundColor: "transparent",
		paddingHorizontal: 0,
		...text.regular,
		color: colors.textPrimary,
	},
	message: {
		...text.medium,
		color: colors.textMuted,
		textAlign: "center",
		paddingVertical: spacing.xl,
	},
	results: {
		gap: spacing.xs,
	},
	pressed: {
		opacity: 0.7,
	},
});
