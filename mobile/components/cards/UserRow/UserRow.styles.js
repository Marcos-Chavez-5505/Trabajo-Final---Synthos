import { StyleSheet } from "react-native";
import {
	colors,
	spacing,
	radius,
	shadows,
	text,
} from "../../../theme";

export const USER_ROW_STYLES = StyleSheet.create({
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.md,
		backgroundColor: colors.surfaceLight,
		borderRadius: radius.card,
		padding: spacing.md,
		...shadows.elevation1,
	},
	person: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.md,
		minWidth: 0,
	},
	text: {
		flex: 1,
		minWidth: 0,
	},
	name: {
		...text.regular,
		color: colors.textPrimary,
	},
	bio: {
		...text.medium,
		color: colors.textMuted,
		marginTop: 2,
	},
	action: {
		alignItems: "flex-end",
	},
	pressed: {
		opacity: 0.7,
	},
});
