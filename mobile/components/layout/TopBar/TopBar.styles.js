import { StyleSheet } from "react-native";
import { colors, spacing } from "../../../theme";

export const TOP_BAR_STYLES = StyleSheet.create({
	container: {
		alignItems: "center",
		flexDirection: "row",
		marginBottom: spacing.lg,
	},
	identity: {
		alignItems: "center",
		flex: 1,
		flexDirection: "row",
		gap: spacing.md,
	},
	actions: {
		alignItems: "center",
		flexDirection: "row",
		gap: 10,
		marginLeft: 24,
	},
	actionButton: {
		alignItems: "center",
		backgroundColor: colors.border,
		borderRadius: 20,
		height: 40,
		justifyContent: "center",
		width: 40,
	},
	badge: {
		alignItems: "center",
		backgroundColor: colors.fucsia,
		borderRadius: 7,
		height: 14,
		justifyContent: "center",
		minWidth: 14,
		paddingHorizontal: 2,
		position: "absolute",
		right: -4,
		top: -4,
	},
	badgeText: {
		color: "#fff",
		fontSize: 9,
		fontWeight: "700",
	},
});
