import { StyleSheet } from "react-native";
import { colors, fontWeight, radius, spacing, text } from "../../../theme";

export const INVITE_ROW_STYLES = StyleSheet.create({
	personRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		paddingVertical: spacing.xs,
	},
	personText: {
		flex: 1,
		minWidth: 0,
	},
	personName: {
		...text.regular,
		color: colors.textPrimary,
	},
	personHandle: {
		...text.medium,
		color: colors.textMuted,
	},
	action: {
		width: 72,
		alignItems: "flex-end",
	},
	status: {
		...text.medium,
		color: colors.textMuted,
	},
	inviteButton: {
		backgroundColor: colors.lighter,
		borderRadius: radius.full,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.xs,
	},
	inviteButtonText: {
		...text.medium,
		color: colors.surface,
		fontWeight: fontWeight.medium,
	},
	pressed: {
		opacity: 0.7,
	},
	disabled: {
		opacity: 0.5,
	},
});
