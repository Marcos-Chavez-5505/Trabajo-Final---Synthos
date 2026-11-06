import { StyleSheet } from "react-native";
import {
	colors,
	spacing,
	radius,
	fontWeight,
	text,
} from "../../../theme";

export const FOLLOW_BUTTON_STYLES = StyleSheet.create({
	button: {
		alignSelf: "flex-start",
		backgroundColor: colors.fucsia,
		borderRadius: radius.sm,
		paddingVertical: spacing.sm,
		paddingHorizontal: spacing.md,
	},
	compactButton: {
		paddingVertical: spacing.xs,
		paddingHorizontal: spacing.sm,
	},
	followingButton: {
		backgroundColor: colors.volume,
	},
	label: {
		...text.button,
		color: colors.textPrimary,
		fontWeight: fontWeight.medium,
	},
	compactLabel: {
		...text.tiny,
		fontWeight: fontWeight.medium,
	},
	pressed: {
		opacity: 0.85,
	},
	disabled: {
		opacity: 0.5,
	},
});
