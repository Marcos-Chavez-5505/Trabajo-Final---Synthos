import { StyleSheet } from "react-native";
import { colors, opacity, text } from "../../../theme";

// Fila de tiempos del reproductor expandido (web: justify-between px-[18px]).
export const TIME_ROW_STYLES = StyleSheet.create({
	row: {
		flexDirection: "row",
		justifyContent: "space-between",
		paddingHorizontal: 18,
	},
	time: {
		...text.tiny,
		color: colors.lighter,
		opacity: opacity.muted,
	},
});
