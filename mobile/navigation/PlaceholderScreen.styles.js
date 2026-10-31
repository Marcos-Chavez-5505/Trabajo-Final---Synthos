import { StyleSheet } from "react-native";
import { colors, text } from "../theme";

export const PLACEHOLDER_STYLES = StyleSheet.create({
	main: {
		flex: 1,
		backgroundColor: colors.background,
		alignItems: "center",
		justifyContent: "center",
	},
	title: {
		...text.large,
		color: colors.textMuted,
	},
});