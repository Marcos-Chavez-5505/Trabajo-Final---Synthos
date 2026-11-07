import { StyleSheet } from "react-native";
import {
	colors,
	radius,
	shadows,
	spacing,
	text,
} from "../../../theme";

export const GENERAL_ROW_STYLES = StyleSheet.create({
	row: {
		alignItems: "center",
		backgroundColor: colors.surfaceLight,
		borderRadius: radius.card,
		flexDirection: "row",
		gap: spacing.md,
		padding: spacing.md,
		...shadows.elevation1,
	},
	content: {
		alignItems: "center",
		flex: 1,
		flexDirection: "row",
		gap: spacing.md,
		minWidth: 0,
	},
	text: {
		flex: 1,
		minWidth: 0,
	},
	title: {
		...text.regular,
		color: colors.textPrimary,
	},
	subtitle: {
		...text.medium,
		color: colors.textMuted,
		marginTop: 2,
	},
	label: {
		...text.tiny,
		color: colors.fucsia,
		marginTop: 2,
		textTransform: "uppercase",
	},
	action: {
		alignItems: "flex-end",
	},
	pressed: {
		opacity: 0.7,
	},
});
