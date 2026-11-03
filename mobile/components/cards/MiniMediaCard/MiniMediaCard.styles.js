import { StyleSheet } from "react-native";
import {
	colors,
	spacing,
	fontSize,
	lineHeight,
	fontWeight,
	radius,
} from "../../../theme";

export const MINI_MEDIA_CARD_STYLES = StyleSheet.create({
	container: {
		width: 150,
		flexShrink: 0,
	},
	coverWrapper: {
		width: "100%",
		aspectRatio: 1,
		backgroundColor: colors.light,
		borderRadius: radius.sm,
		alignItems: "center",
		justifyContent: "center",
		overflow: "hidden",
		marginBottom: spacing.sm,
	},
	coverImage: {
		width: "100%",
		height: "100%",
	},
	coverFallback: {
		opacity: 0.6,
	},
	queueButtonWrapper: {
		position: "absolute",
		right: 6,
		top: 6,
	},
	queueButton: {
		backgroundColor: colors.volume,
	},
	title: {
		color: colors.textPrimary,
		fontSize: fontSize.regular,
		lineHeight: lineHeight.regular,
		fontWeight: fontWeight.regular,
	},
	artist: {
		color: colors.textMuted,
		fontSize: fontSize.medium,
		lineHeight: lineHeight.medium,
		marginTop: 2,
	},
	label: {
		color: colors.fucsia,
		fontSize: fontSize.tiny,
		lineHeight: lineHeight.tiny,
		marginTop: 2,
		textTransform: "uppercase",
	},
});