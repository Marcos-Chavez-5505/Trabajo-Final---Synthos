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

export const ROOM_DETAIL_STYLES = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.surface,
		paddingTop: 60,
	},
	scroll: {
		paddingHorizontal: spacing.lg,
		paddingBottom: spacing.xxl,
	},
	loadingContainer: {
		flex: 1,
		backgroundColor: colors.surface,
		justifyContent: "center",
		alignItems: "center",
	},
	backButton: {
		marginBottom: spacing.md,
	},
	backButtonText: {
		color: colors.textMuted,
		fontSize: fontSize.medium,
	},
	errorBox: {
		backgroundColor: colors.dangerBg,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		borderRadius: 8,
		marginBottom: spacing.md,
	},
	errorText: {
		color: colors.red,
		fontSize: fontSize.medium,
	},
	header: {
		backgroundColor: colors.surfaceLight,
		borderRadius: radius.card,
		padding: spacing.lg,
		marginBottom: spacing.lg,
		...shadows.elevation1,
	},
	headerTop: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: spacing.md,
	},
	iconWrapper: {
		width: 48,
		height: 48,
		borderRadius: radius.card,
		backgroundColor: colors.light,
		alignItems: "center",
		justifyContent: "center",
	},
	headerText: {
		flex: 1,
	},
	roomName: {
		color: colors.textPrimary,
		fontSize: fontSize.header3,
		lineHeight: lineHeight.header3,
		fontWeight: fontWeight.bold,
	},
	roomCode: {
		color: colors.textMuted,
		fontSize: fontSize.medium,
		lineHeight: lineHeight.medium,
		marginTop: spacing.xs,
	},
	roomCodeHighlight: {
		color: colors.fucsia,
	},
	description: {
		color: colors.textMuted,
		fontSize: fontSize.regular,
		lineHeight: lineHeight.regular,
		marginTop: spacing.md,
	},
	metaGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: spacing.lg,
		marginTop: spacing.lg,
	},
	metaItem: {
		minWidth: 80,
	},
	metaLabel: {
		color: colors.textMuted,
		fontSize: fontSize.tiny,
		lineHeight: lineHeight.tiny,
	},
	metaValue: {
		color: colors.textPrimary,
		fontSize: fontSize.regular,
		lineHeight: lineHeight.regular,
		marginTop: 2,
	},
	section: {
		backgroundColor: colors.surfaceLight,
		borderRadius: radius.card,
		padding: spacing.lg,
		marginBottom: spacing.lg,
		...shadows.elevation1,
	},
	sectionTitle: {
		color: colors.textPrimary,
		fontSize: fontSize.header4,
		lineHeight: lineHeight.header4,
		fontWeight: fontWeight.bold,
		marginBottom: spacing.md,
	},
	playbackStatus: {
		color: colors.textPrimary,
		fontSize: fontSize.regular,
		lineHeight: lineHeight.regular,
	},
	playbackMuted: {
		color: colors.textMuted,
		fontSize: fontSize.medium,
		lineHeight: lineHeight.medium,
		marginTop: 2,
	},
	controlsRow: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: spacing.sm,
		marginTop: spacing.md,
	},
	controlButton: {
		backgroundColor: colors.volume,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		borderRadius: 8,
	},
	controlButtonPrimary: {
		backgroundColor: colors.fucsia,
	},
	controlButtonText: {
		color: colors.textPrimary,
		fontSize: fontSize.regular,
		fontWeight: fontWeight.medium,
	},
	controlButtonDisabled: {
		opacity: 0.5,
	},
	memberRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.md,
		paddingVertical: spacing.sm,
		borderBottomWidth: 1,
		borderBottomColor: colors.border,
	},
	memberInfo: {
		flex: 1,
	},
	memberName: {
		color: colors.textPrimary,
		fontSize: fontSize.regular,
	},
	memberRole: {
		color: colors.textMuted,
		fontSize: fontSize.tiny,
		marginTop: 2,
	},
	kickButton: {
		backgroundColor: colors.red,
		paddingHorizontal: spacing.md,
		paddingVertical: 6,
		borderRadius: 6,
	},
	kickButtonText: {
		color: colors.textPrimary,
		fontSize: fontSize.tiny,
		fontWeight: fontWeight.medium,
	},
	footer: {
		flexDirection: "row",
		gap: spacing.sm,
		marginTop: spacing.lg,
	},
	footerButton: {
		flex: 1,
		paddingVertical: spacing.md,
		borderRadius: 8,
		alignItems: "center",
	},
	footerButtonSecondary: {
		backgroundColor: colors.volume,
	},
	footerButtonDanger: {
		backgroundColor: colors.red,
	},
	footerButtonText: {
		color: colors.textPrimary,
		fontSize: fontSize.regular,
		fontWeight: fontWeight.medium,
	},
});