import { StyleSheet } from "react-native";
import { colors, fontSize, fontWeight } from "../../../theme";

export const AVATAR_STYLES = StyleSheet.create({
	container: {
		width: 32,
		height: 32,
		borderRadius: 9999,
		overflow: "hidden",
		backgroundColor: colors.surfaceLight,
		alignItems: "center",
		justifyContent: "center",
		position: "relative",
	},
	image: {
		width: "100%",
		height: "100%",
	},
	absoluteFill: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		zIndex: 2,
	},
	fallback: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: colors.border,
		zIndex: 1,
	},
	fallbackText: {
		color: colors.textPrimary,
		fontSize: fontSize.xs,
		fontWeight: fontWeight.medium,
		textTransform: "uppercase",
	},
});
