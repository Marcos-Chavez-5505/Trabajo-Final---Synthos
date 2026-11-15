import { StyleSheet } from "react-native";
import {
	colors,
	spacing,
	fontSize,
	lineHeight,
	fontWeight,
	radius,
	shadows,
} from "../../theme";

export const NOTIFICATIONS_STYLES = StyleSheet.create({
	safe: {
		flex: 1,
		backgroundColor: colors.surface,
	},
	scroll: {
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.md,
		paddingBottom: spacing.xxl,
	},
	loading: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	header: {
		flexDirection: "row",
		alignItems: "flex-end",
		justifyContent: "space-between",
		gap: spacing.md,
		marginBottom: spacing.lg,
	},
	headerText: {
		flex: 1,
	},
	title: {
		color: colors.textPrimary,
		fontSize: fontSize.header3,
		lineHeight: lineHeight.header3,
		fontWeight: fontWeight.bold,
	},
	subtitle: {
		color: colors.textMuted,
		fontSize: fontSize.regular,
		lineHeight: lineHeight.regular,
		marginTop: spacing.xs,
	},
	markAllButton: {
		backgroundColor: colors.volume,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		borderRadius: 8,
	},
	markAllText: {
		color: colors.textPrimary,
		fontSize: fontSize.medium,
		fontWeight: fontWeight.medium,
	},
	list: {
		gap: spacing.sm,
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.md,
		borderRadius: radius.card,
		padding: spacing.md,
	},
	rowUnread: {
		backgroundColor: colors.surfaceLight,
		...shadows.elevation1,
	},
	rowRead: {
		backgroundColor: colors.surface,
	},
	unreadDot: {
		position: "absolute",
		right: spacing.sm,
		top: spacing.sm,
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: colors.fucsia,
	},
	avatarWrap: {
		position: "relative",
	},
	typeBadge: {
		position: "absolute",
		right: -4,
		bottom: -4,
		width: 20,
		height: 20,
		borderRadius: 10,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 2,
		borderColor: colors.surface,
	},
	badgeFollow: {
		backgroundColor: colors.fucsia,
	},
	badgeRecommendation: {
		backgroundColor: colors.plaster ?? colors.volume,
	},
	badgePlaylist: {
		backgroundColor: colors.volume,
	},
	textWrap: {
		flex: 1,
		minWidth: 0,
	},
	text: {
		color: colors.textPrimary,
		fontSize: fontSize.regular,
		lineHeight: lineHeight.regular,
	},
	bold: {
		color: colors.textPrimary,
		fontWeight: fontWeight.medium,
	},
	meta: {
		color: colors.textMuted,
		fontSize: fontSize.tiny,
		lineHeight: lineHeight.tiny,
		marginTop: spacing.xs,
	},
	empty: {
		alignItems: "center",
		paddingVertical: spacing.xxl,
		gap: spacing.sm,
	},
	emptyTitle: {
		color: colors.textPrimary,
		fontSize: fontSize.header4,
		fontWeight: fontWeight.bold,
		marginTop: spacing.md,
	},
	emptyText: {
		color: colors.textMuted,
		fontSize: fontSize.regular,
		lineHeight: lineHeight.regular,
		textAlign: "center",
		maxWidth: 320,
	},
});