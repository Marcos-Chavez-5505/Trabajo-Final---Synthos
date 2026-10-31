import { StyleSheet } from "react-native";
import { colors, text, fontWeight, radius, sizes } from "../../../theme";

export const AVATAR_STYLES = StyleSheet.create({
	container: {
		width: sizes.avatar,
		height: sizes.avatar,
		borderRadius: radius.full,
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
		...text.medium,
		color: colors.textPrimary,
		fontWeight: fontWeight.medium,
		textTransform: "uppercase",
	},
});