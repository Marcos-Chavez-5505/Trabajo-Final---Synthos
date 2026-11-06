import { StyleSheet } from "react-native";
import { colors, spacing, radius, text } from "../../theme";

export const SEARCH_PERSON_ROW_STYLES = StyleSheet.create({
	action: {
		alignItems: "flex-end",
		gap: spacing.xs,
		maxWidth: 120,
	},
	badge: {
		backgroundColor: colors.volume,
		borderRadius: radius.sm,
		paddingHorizontal: spacing.xs,
		paddingVertical: 2,
	},
	badgeText: {
		...text.tiny,
		color: colors.textPrimary,
	},
	error: {
		...text.tiny,
		color: colors.textMuted,
		textAlign: "right",
	},
});
