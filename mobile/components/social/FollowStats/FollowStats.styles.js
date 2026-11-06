import { StyleSheet } from "react-native";
import {
	colors,
	spacing,
	fontWeight,
	text,
} from "../../../theme";

export const FOLLOW_STATS_STYLES = StyleSheet.create({
	row: {
		flexDirection: "row",
		gap: spacing.xl,
		marginTop: spacing.lg,
	},
	stat: {
		alignItems: "flex-start",
	},
	value: {
		...text.regular,
		color: colors.textPrimary,
		fontWeight: fontWeight.medium,
	},
	label: {
		...text.tiny,
		color: colors.textMuted,
		marginTop: 2,
	},
	pressed: {
		opacity: 0.7,
	},
});
