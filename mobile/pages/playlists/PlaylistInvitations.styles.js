import { StyleSheet } from "react-native";
import {
	colors,
	fontWeight,
	radius,
	shadows,
	spacing,
	text,
} from "../../theme";

export const PLAYLIST_INVITATIONS_STYLES = StyleSheet.create({
	fill: {
		flex: 1,
	},
	list: {
		paddingTop: spacing.lg,
		paddingBottom: spacing.xxl,
		gap: spacing.md,
	},
	state: {
		alignItems: "center",
		paddingVertical: spacing.xxl,
	},
	emptyTitle: {
		...text.header4,
		color: colors.textPrimary,
		marginTop: spacing.md,
	},
	message: {
		...text.regular,
		color: colors.textMuted,
		textAlign: "center",
		marginTop: spacing.xs,
	},
	error: {
		...text.medium,
		color: colors.red,
		backgroundColor: colors.dangerBg,
		borderRadius: radius.card,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
	},
	retryButton: {
		marginTop: spacing.md,
		backgroundColor: colors.volume,
		borderRadius: 8,
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.sm,
	},
	retryText: {
		...text.button,
		color: colors.textPrimary,
	},
	card: {
		flexDirection: "row",
		flexWrap: "wrap",
		alignItems: "center",
		gap: spacing.md,
		backgroundColor: colors.surfaceLight,
		borderRadius: radius.card,
		padding: spacing.md,
		...shadows.elevation1,
	},
	cover: {
		width: 56,
		height: 56,
		borderRadius: radius.card,
		backgroundColor: colors.light,
		alignItems: "center",
		justifyContent: "center",
	},
	info: {
		flex: 1,
		minWidth: 140,
	},
	name: {
		...text.regular,
		color: colors.textPrimary,
	},
	senderRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.xs,
		marginTop: 4,
	},
	sender: {
		...text.medium,
		color: colors.textMuted,
		flexShrink: 1,
	},
	actions: {
		flexDirection: "row",
		gap: spacing.sm,
	},
	primaryButton: {
		backgroundColor: colors.fucsia,
		borderRadius: 8,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
	},
	secondaryButton: {
		backgroundColor: colors.volume,
		borderRadius: 8,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
	},
	buttonText: {
		...text.button,
		color: colors.textPrimary,
		fontWeight: fontWeight.medium,
	},
	pressed: { opacity: 0.85 },
	disabled: { opacity: 0.5 },
});
