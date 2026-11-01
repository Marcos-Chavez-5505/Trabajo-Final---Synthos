import { StyleSheet } from "react-native";
import {
	colors,
	spacing,
	fontSize,
	lineHeight,
	fontWeight,
} from "../../theme";

export const HOME_STYLES = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.surface,
		paddingTop: 60,
		paddingHorizontal: spacing.lg,
	},
	greeting: {
		color: colors.textPrimary,
		fontSize: fontSize.header2,
		lineHeight: lineHeight.header2,
		fontWeight: fontWeight.bold,
	},
	sectionTitle: {
		color: colors.textPrimary,
		fontSize: fontSize.header4,
		lineHeight: lineHeight.header4,
		fontWeight: fontWeight.bold,
		marginTop: spacing.xl,
		marginBottom: spacing.md,
	},
	errorText: {
		color: colors.textMuted,
		fontSize: fontSize.regular,
		lineHeight: lineHeight.regular,
	},
	carousel: {
		paddingBottom: spacing.sm,
	},
	carouselContent: {
		gap: spacing.md,
		paddingRight: spacing.lg,
	},
	profileButton: {
		marginTop: spacing.xl,
		backgroundColor: colors.surfaceLight,
		paddingVertical: spacing.md,
		paddingHorizontal: spacing.lg,
		borderRadius: 8,
		alignSelf: "flex-start",
	},
	profileButtonText: {
		color: colors.textPrimary,
		fontSize: fontSize.regular,
		fontWeight: fontWeight.medium,
	},
});