import { StyleSheet } from "react-native";
import { spacing } from "../../../theme";

export const HORIZONTAL_SCROLL_BAR_STYLES = StyleSheet.create({
	container: {
		flex: 1,
		position: "relative",
	},
	scroll: {
		flex: 1,
	},
	edge: {
		position: "absolute",
		top: 0,
		bottom: 0,
		width: spacing.xxl + spacing.lg,
		justifyContent: "center",
		zIndex: 1,
		// En Android `zIndex` solo no alcanza para quedar por encima de un
		// ScrollView; `elevation` fuerza el orden de dibujo.
		elevation: 1,
	},
	edgeLeft: {
		left: 0,
		alignItems: "flex-start",
	},
	edgeRight: {
		right: 0,
		alignItems: "flex-end",
	},
	gradient: {
		position: "absolute",
		top: 0,
		left: 0,
		width: "100%",
		height: "100%",
	},
	chevronLeft: {
		marginLeft: spacing.xs,
		transform: [{ rotate: "90deg" }],
	},
	chevronRight: {
		marginRight: spacing.xs,
		transform: [{ rotate: "-90deg" }],
	},
});
