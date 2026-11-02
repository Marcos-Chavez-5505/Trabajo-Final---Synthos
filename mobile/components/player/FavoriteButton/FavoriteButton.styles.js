import { StyleSheet } from "react-native";

// Ocupa el segmento completo de ActionControls (48px): fondo transparente para
// que se vea el color del segmento, ícono centrado.
export const FAVORITE_BUTTON_STYLES = StyleSheet.create({
	button: {
		flex: 1,
		alignSelf: "stretch",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "transparent",
	},
	pressed: {
		opacity: 0.8,
	},
	disabled: {
		opacity: 0.5,
	},
});
