import { StyleSheet } from "react-native";
import {
	borderWidth,
	colors,
	radius,
	shadows,
	sizes,
	spacing,
	text,
} from "../../../theme";

const HANDLE_WIDTH = spacing.xxl;
const HANDLE_HEIGHT = spacing.xs;

export const BOTTOM_SHEET_BACKDROP_OPACITY = 1.0;

export const BOTTOM_SHEET_STYLES = StyleSheet.create({
	background: {
		backgroundColor: colors.surfaceLight,
		borderTopLeftRadius: radius.lg,
		borderTopRightRadius: radius.lg,
		borderWidth: borderWidth.sm,
		borderColor: colors.border,
		...shadows.elevation1,
	},
	handle: {
		paddingTop: spacing.sm,
	},
	handleIndicator: {
		width: HANDLE_WIDTH,
		height: HANDLE_HEIGHT,
		borderRadius: radius.full,
		backgroundColor: colors.lightMuted,
	},
	backdrop: {
		backgroundColor: colors.scrimDark,
	},
	content: {
		padding: spacing.lg,
		gap: spacing.md,
	},
	scrollContent: {
		padding: spacing.lg,
		gap: spacing.md,
	},
	input: {
		height: sizes.buttonHeight,
		paddingHorizontal: spacing.md,
		borderRadius: radius.md,
		borderWidth: borderWidth.sm,
		borderColor: colors.border,
		backgroundColor: colors.surface,
		...text.regular,
		color: colors.textPrimary,
	},
});