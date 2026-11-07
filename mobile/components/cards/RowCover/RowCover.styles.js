import { StyleSheet } from "react-native";
import { colors, radius } from "../../../theme";

export const ROW_COVER_STYLES = StyleSheet.create({
	cover: {
		alignItems: "center",
		backgroundColor: colors.light,
		borderRadius: radius.sm,
		height: 56,
		justifyContent: "center",
		overflow: "hidden",
		width: 56,
	},
	image: {
		height: "100%",
		width: "100%",
	},
	fallback: {
		opacity: 0.6,
	},
});
