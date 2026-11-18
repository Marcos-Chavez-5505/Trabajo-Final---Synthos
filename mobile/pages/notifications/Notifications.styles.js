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

// `header` y `empty` solo neutralizan el padding horizontal que ya da `scroll`,
// porque ScreenHeader y EmptyState lo traen propio.
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
	header: {
		paddingHorizontal: 0,
		marginBottom: spacing.lg,
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
	loading: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	empty: {
		paddingHorizontal: 0,
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
});
