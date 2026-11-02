import { StyleSheet } from "react-native";
import { colors } from "../../../theme";

// Píldora contenedora (web: w-[320px] max-w-full gap-1.5 rounded-full bg-surface/70 p-1.5)
// con segmentos iguales de 48px: Fucsia activo, Volume inactivo.
export const ACTION_CONTROLS_STYLES = StyleSheet.create({
	pill: {
		flexDirection: "row",
		width: "100%",
		maxWidth: 320,
		alignSelf: "center",
		gap: 6,
		padding: 6,
		borderRadius: 9999,
		backgroundColor: "rgba(30, 30, 30, 0.7)", // --ds-surface al 70%
	},
	segment: {
		flex: 1,
		height: 48,
		borderRadius: 9999,
		alignItems: "center",
		justifyContent: "center",
		overflow: "hidden",
		backgroundColor: colors.volume,
	},
	segmentActive: {
		backgroundColor: colors.fucsia,
	},
	hit: {
		flex: 1,
		alignSelf: "stretch",
		alignItems: "center",
		justifyContent: "center",
	},
	iconIdle: {
		opacity: 0.55,
	},
	pressed: {
		opacity: 0.8,
	},
	disabled: {
		opacity: 0.4,
	},
});
