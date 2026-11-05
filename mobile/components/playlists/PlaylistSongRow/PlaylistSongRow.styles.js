import { StyleSheet } from "react-native";
import {
	colors,
	radius,
	spacing,
	text,
} from "../../../theme";

const CARD_HEIGHT = 56;

export const PLAYLIST_SONG_ROW_STYLES = StyleSheet.create({
	wrapper: {
		position: "relative",
		marginVertical: 2,
		minHeight: CARD_HEIGHT,
	},
	wrapperDragging: {
		zIndex: 10,
	},
	rail: {
		position: "absolute",
		top: 0,
		bottom: 0,
		width: 96,
		borderRadius: radius.card,
		alignItems: "center",
		justifyContent: "center",
	},
	railLeft: {
		left: 0,
		backgroundColor: colors.volume,
	},
	railRight: {
		right: 0,
		backgroundColor: colors.red,
	},
	indexInput: {
		width: 68,
		height: 40,
		borderWidth: 1,
		borderColor: colors.border,
		borderRadius: 6,
		backgroundColor: "transparent",
		textAlign: "center",
		textAlignVertical: "center",
		paddingHorizontal: 0,
		paddingVertical: 0,
		color: colors.textPrimary,
		...text.regular,
		includeFontPadding: false,
	},
	removeButton: {
		flex: 1,
		alignSelf: "stretch",
		alignItems: "center",
		justifyContent: "center",
		paddingLeft: 12,
	},
	pressed: {
		opacity: 0.7,
	},
	card: {
		minHeight: CARD_HEIGHT,
		backgroundColor: colors.surfaceLight,
		borderRadius: radius.card,
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
		paddingHorizontal: 10,
		paddingVertical: 8,
	},
	dragHandle: {
		paddingHorizontal: 4,
		paddingVertical: 8,
	},
	playArea: {
		flex: 1,
		minWidth: 0,
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
	},
	cover: {
		width: 40,
		height: 40,
		borderRadius: radius.card,
		backgroundColor: colors.light,
		alignItems: "center",
		justifyContent: "center",
		overflow: "hidden",
	},
	coverImage: {
		width: "100%",
		height: "100%",
	},
	titles: {
		flex: 1,
		minWidth: 0,
	},
	title: {
		...text.regular,
		color: colors.textPrimary,
	},
	artist: {
		...text.medium,
		color: colors.textMuted,
	},
	ellipsis: {
		paddingHorizontal: 4,
		paddingVertical: 8,
	},
});
