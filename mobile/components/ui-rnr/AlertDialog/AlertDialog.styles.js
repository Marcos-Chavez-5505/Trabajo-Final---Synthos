import { Platform, StyleSheet } from "react-native";
import {
	borderWidth,
	colors,
	opacity,
	radius,
	sizes,
	spacing,
	text,
} from "../../../theme";

export const ALERT_DIALOG_OVERLAY_Z_INDEX = 50;
export const ALERT_DIALOG_OVERLAY_ELEVATION = 100;
export const ALERT_DIALOG_SMALL_MAX_WIDTH = 320;
const WEB_BLUR_PX = 8;

export const ALERT_DIALOG_MOTION = { enter: 200, exit: 150, delay: 50 };

export const ALERT_DIALOG_STYLES = StyleSheet.create({
	overlay: {
		position: "absolute",
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
		alignItems: "center",
		justifyContent: "center",
		padding: spacing.sm,
		zIndex: ALERT_DIALOG_OVERLAY_Z_INDEX,
		elevation: ALERT_DIALOG_OVERLAY_ELEVATION,
		...Platform.select({
			web: {
				position: "fixed",
			},
		}),
	},
	scrim: {
		position: "absolute",
		top: 0,
		right: 0,
		bottom: 0,
		left: 0,
		backgroundColor: colors.scrimDark,
		...Platform.select({
			web: { backdropFilter: `blur(${WEB_BLUR_PX}px)` },
		}),
	},
	content: {
		width: "100%",
		maxWidth: sizes.cardMaxWidth,
		flexDirection: "column",
		gap: spacing.lg,
		padding: spacing.xl,
		borderRadius: radius.lg,
		borderWidth: borderWidth.sm,
		borderColor: colors.border,
		backgroundColor: colors.background,
	},
	contentSmall: {
		maxWidth: ALERT_DIALOG_SMALL_MAX_WIDTH,
	},
	header: {
		gap: spacing.sm,
	},
	footer: {
		flexDirection: "column-reverse",
		gap: spacing.sm,
	},
	title: {
		...text.header4,
		color: colors.textPrimary,
	},
	description: {
		...text.medium,
		color: colors.textMuted,
	},
	closeButton: {
		position: "absolute",
		top: spacing.lg,
		right: spacing.lg,
		borderRadius: radius.sm,
		opacity: opacity.muted,
	},
	closeButtonPressed: {
		opacity: 1,
	},
	media: {
		alignItems: "center",
		justifyContent: "center",
		gap: spacing.sm,
		paddingVertical: spacing.sm,
	},
	action: {
		height: sizes.buttonHeight,
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.sm,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: radius.md,
		backgroundColor: colors.primary,
	},
	actionPressed: {
		opacity: opacity.subtle,
	},
	actionText: {
		...text.button,
		color: colors.textPrimary,
	},
	cancel: {
		height: sizes.buttonHeight,
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.sm,
		alignItems: "center",
		justifyContent: "center",
		borderRadius: radius.md,
		borderWidth: borderWidth.sm,
		borderColor: colors.border,
	},
	cancelPressed: {
		opacity: opacity.subtle,
	},
	cancelText: {
		...text.button,
		color: colors.textPrimary,
	},
});