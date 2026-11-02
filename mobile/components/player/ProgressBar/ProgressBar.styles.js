import { StyleSheet } from "react-native";
import { colors, opacity, radius } from "../../../theme";

// Área táctil de 16px con un track de 4px centrado: el track solo no alcanza
// como objetivo táctil.
export const PROGRESS_BAR_STYLES = StyleSheet.create({
	touchArea: {
		height: 16,
		justifyContent: "center",
	},
	track: {
		height: 6,
		borderRadius: radius.full,
		// Mismo `Wall` (#605468) que el track de ProgressBar web.
		backgroundColor: colors.wall,
		overflow: "hidden",
	},
	fill: {
		height: "100%",
		backgroundColor: colors.fucsia,
	},
	thumb: {
		position: "absolute",
		top: 3,
		width: 10,
		height: 10,
		marginLeft: -5,
		borderRadius: 5,
		backgroundColor: colors.lighter,
	},
	disabled: {
		opacity: opacity.disabled,
	},
});
