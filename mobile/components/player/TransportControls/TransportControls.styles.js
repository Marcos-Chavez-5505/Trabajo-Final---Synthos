import { StyleSheet } from "react-native";
import { colors } from "../../../theme";

// Misma geometría que la web: h-20 (80), gap-1.5 (6), prev/next en píldora
// SurfaceLight y play en Fucsia con radio animado.
export const TRANSPORT_STYLES = StyleSheet.create({
	row: {
		flexDirection: "row",
		width: "100%",
		height: 80,
		gap: 6,
	},
	slot: {
		flexBasis: 0,
		flexShrink: 1,
		minWidth: 0,
		height: "100%",
		overflow: "hidden",
	},
	skipSlot: {
		borderRadius: 9999,
		backgroundColor: colors.surfaceLight,
	},
	playSlot: {
		backgroundColor: colors.fucsia,
	},
	hit: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	playIcons: {
		width: 36,
		height: 36,
	},
	playIcon: {
		position: "absolute",
		top: 0,
		left: 0,
	},
	disabled: {
		opacity: 0.4, // web: disabled:opacity-40
	},
});
