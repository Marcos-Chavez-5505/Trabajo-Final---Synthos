import { StyleSheet } from "react-native";
import { colors, fontWeight, radius, text } from "../../../theme";

export const AVATAR_STACK_STYLES = StyleSheet.create({
	button: { alignSelf: "flex-start" },
	pressed: { opacity: 0.75 },
	group: {
		flexDirection: "row",
		alignItems: "center",
	},
	item: {},
	overlap: { marginLeft: -20 },
	remaining: {
		width: 24,
		height: 24,
		borderRadius: radius.full,
		backgroundColor: colors.volume,
		alignItems: "center",
		justifyContent: "center",
		zIndex: 0,
		marginLeft: -8,
	},
	remainingText: {
		...text.tiny,
		color: colors.lighter,
		fontWeight: fontWeight.bold,
	},
});
