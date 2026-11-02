import { StyleSheet } from "react-native";
import { opacity } from "../../../theme";

export const WAVY_PROGRESS_STYLES = StyleSheet.create({
	touchArea: {
		height: 40,
		justifyContent: "center",
	},
	disabled: {
		opacity: opacity.disabled,
	},
});
