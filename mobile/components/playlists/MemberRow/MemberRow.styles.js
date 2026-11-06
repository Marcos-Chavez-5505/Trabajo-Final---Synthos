import { StyleSheet } from "react-native";
import {
	colors,
	fontWeight,
	radius,
	shadows,
	spacing,
	text,
} from "../../../theme";

export const MEMBER_ROW_STYLES = StyleSheet.create({
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		backgroundColor: colors.surfaceLight,
		borderRadius: radius.card,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		...shadows.elevation1,
	},
	person: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		minWidth: 0,
	},
	name: {
		...text.regular,
		color: colors.textPrimary,
		flex: 1,
		minWidth: 0,
	},
	role: {
		...text.tiny,
		color: colors.textMuted,
	},
	remove: {
		paddingHorizontal: 8,
		paddingVertical: 4,
	},
	pressed: {
		opacity: 0.7,
	},
	removeText: {
		...text.medium,
		color: colors.textPrimary,
		fontWeight: fontWeight.medium,
	},
});
