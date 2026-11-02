import { StyleSheet } from "react-native";

export function dynamicSize(size) {
	return {
		width: size,
		height: size,
		borderRadius: size / 2,
	};
}

export const QUEUE_ACTION_BUTTON_STYLES = StyleSheet.create({
	button: {
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "transparent",
	},
	iconWrapper: {
		alignItems: "center",
		justifyContent: "center",
	},
	added: {
		borderWidth: 2,
		borderColor: "rgba(255, 255, 255, 0.4)",
	},
	pressed: {
		transform: [{ scale: 0.9 }],
		opacity: 0.8,
	},
	disabled: {
		opacity: 0.4,
	},
});