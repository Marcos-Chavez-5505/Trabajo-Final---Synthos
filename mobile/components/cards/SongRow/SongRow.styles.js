import { StyleSheet } from "react-native";
import { colors } from "../../../theme";

export const SONG_ROW_STYLES = StyleSheet.create({
	addButton: {
		backgroundColor: colors.primary,
		borderRadius: 16,
		paddingHorizontal: 12,
		paddingVertical: 6,
	},
	addLabel: {
		color: colors.textPrimary,
	},
});
