import { StyleSheet } from "react-native";
import { colors, radius } from "../../../theme";

export const PLAYLIST_COVER_STYLES = StyleSheet.create({
	wrapper: {
		position: "relative",
	},
	glow: {
		position: "absolute",
	},
	cover: {
		flex: 1,
		borderRadius: radius.card,
		backgroundColor: colors.light,
		alignItems: "center",
		justifyContent: "center",
		overflow: "hidden",
	},
	menu: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		borderRadius: radius.card,
		backgroundColor: `${colors.surface}CC`,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: 12,
	},
	menuButton: {
		padding: 10,
		borderRadius: radius.full,
	},
	pressed: {
		backgroundColor: `${colors.lighter}1F`,
	},
	busy: {
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		borderRadius: radius.card,
		backgroundColor: `${colors.surface}CC`,
		alignItems: "center",
		justifyContent: "center",
	},
});