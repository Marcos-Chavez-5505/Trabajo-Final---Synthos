import { StyleSheet } from "react-native";
import {
	colors,
	fontSize,
	fontWeight,
	radius,
	spacing,
} from "../../../theme";

export const HOME_PILLS_STYLES = StyleSheet.create({
	content: {
		alignItems: "center",
		gap: spacing.sm,
		paddingRight: spacing.sm,
	},
	pill: {
		backgroundColor: colors.surfaceLight,
		paddingVertical: spacing.xs,
		paddingHorizontal: spacing.lg,
		borderRadius: radius.full,
	},
	pillText: {
		color: colors.textPrimary,
		fontSize: fontSize.sm,
		fontWeight: fontWeight.medium,
	},
});
