import { StyleSheet } from "react-native";
import { colors, spacing, text, sizes, borderWidth, fontWeight } from "../../../theme";

// Colores del navbar en un solo lugar. Mapeo desde el prototipo:
//   --primary / --on-primary         -> fucsia / surface  (mismo par que --primary
//                                       y --primary-foreground del puente shadcn)
//   --on-surface(-variant)           -> textPrimary / textMuted
//   --card                           -> surfaceLight
export const NAV_COLORS = {
	bar: colors.surfaceLight,
	barBorder: colors.border,
	indicator: colors.fucsia,
	iconSelected: colors.surface,
	iconDefault: colors.textMuted,
	labelSelected: colors.textPrimary,
	labelDefault: colors.textMuted,
};

export const BOTTOM_NAV_STYLES = StyleSheet.create({
	bar: {
		flexDirection: "row",
		backgroundColor: NAV_COLORS.bar,
		borderTopWidth: borderWidth.sm,
		borderTopColor: NAV_COLORS.barBorder,
	},
	item: {
		flex: 1,
		alignItems: "center",
		gap: spacing.xs,
		paddingVertical: spacing.sm, // el prototipo usa 6px; no hay token intermedio
	},
	indicatorSlot: {
		width: sizes.navIndicatorWidth,
		height: sizes.navIndicatorHeight,
		alignItems: "center",
		justifyContent: "center",
	},
	indicator: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		borderRadius: sizes.navIndicatorHeight / 2,
		backgroundColor: NAV_COLORS.indicator,
	},
	label: {
		...text.medium,
		color: NAV_COLORS.labelDefault,
	},
	labelSelected: {
		color: NAV_COLORS.labelSelected,
		fontWeight: fontWeight.medium,
	},
});