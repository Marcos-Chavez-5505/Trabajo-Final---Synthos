import { StyleSheet } from "react-native";
import {
	colors,
	fontWeight,
	radius,
	shadows,
	spacing,
	text,
} from "../../../theme";

export const INVITE_USER_SHEET_STYLES = StyleSheet.create({
	overlay: {
		flex: 1,
		justifyContent: "flex-end",
	},
	backdrop: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: `${colors.wall}CC`,
	},
	sheet: {
		backgroundColor: colors.surfaceLight,
		borderTopLeftRadius: radius.card * 2,
		borderTopRightRadius: radius.card * 2,
		paddingHorizontal: spacing.lg,
		paddingTop: spacing.lg,
		maxHeight: "86%",
		...shadows.elevation1,
	},
	dragArea: {
		alignSelf: "stretch",
		paddingBottom: spacing.sm,
	},
	grabber: {
		alignSelf: "center",
		width: 40,
		height: 4,
		borderRadius: radius.full,
		backgroundColor: colors.border,
		marginBottom: spacing.md,
	},
	title: {
		...text.header4,
		color: colors.textPrimary,
		flexShrink: 1,
	},
	description: {
		...text.tiny,
		color: colors.textMuted,
		marginTop: spacing.xs,
	},
	searchWrapper: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		backgroundColor: colors.volume,
		borderRadius: radius.full,
		paddingHorizontal: spacing.md,
		marginTop: spacing.md,
	},
	searchInput: {
		flex: 1,
		paddingVertical: spacing.sm,
		color: colors.textPrimary,
		...text.regular,
	},
	error: {
		...text.medium,
		color: colors.red,
		backgroundColor: colors.dangerBg,
		borderRadius: radius.card,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		marginTop: spacing.sm,
	},
	results: {
		marginTop: spacing.sm,
	},
	message: {
		...text.medium,
		color: colors.textMuted,
		textAlign: "center",
		paddingVertical: spacing.xl,
	},
	personRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		paddingVertical: spacing.sm,
	},
	pressed: {
		opacity: 0.7,
	},
	disabled: {
		opacity: 0.6,
	},
	personText: {
		flex: 1,
		minWidth: 0,
	},
	personName: {
		...text.regular,
		color: colors.textPrimary,
	},
	personEmail: {
		...text.medium,
		color: colors.textMuted,
	},
	pending: {
		...text.medium,
		color: colors.textMuted,
	},
	sentSection: {
		borderTopWidth: 1,
		borderTopColor: colors.border,
		marginTop: spacing.md,
		paddingTop: spacing.sm,
	},
	sentTitle: {
		...text.regular,
		color: colors.textPrimary,
		fontWeight: fontWeight.medium,
		marginBottom: spacing.xs,
	},
	sentRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		paddingVertical: 4,
	},
	sentName: {
		...text.regular,
		color: colors.textPrimary,
		flex: 1,
		minWidth: 0,
	},
	sentStatus: {
		...text.tiny,
		color: colors.textMuted,
	},
});
