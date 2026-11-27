import { StyleSheet } from "react-native";
import { colors, radius, spacing, text } from "../../../theme";

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
	genres: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: spacing.xs,
		marginTop: 2,
	},
	genreChip: {
		backgroundColor: colors.border,
		borderRadius: radius.full,
		paddingHorizontal: spacing.sm,
		paddingVertical: 2,
	},
	genreText: {
		...text.tiny,
		color: colors.fucsia,
		textTransform: "uppercase",
	},
});
