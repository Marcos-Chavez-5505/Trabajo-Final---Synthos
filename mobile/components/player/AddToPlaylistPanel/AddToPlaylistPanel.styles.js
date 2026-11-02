import { StyleSheet } from "react-native";
import { colors, opacity, radius, spacing, text } from "../../../theme";

export const ADD_TO_PLAYLIST_STYLES = StyleSheet.create({
	// Base transparente: el color lo pone el segmento de ActionControls.
	trigger: {
		flex: 1,
		alignSelf: "stretch",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "transparent",
	},
	// Mismo criterio que la web: el "+" se pinta Fucsia con el menú abierto o si
	// la canción ya está en alguna playlist.
	triggerActive: {
		backgroundColor: colors.fucsia,
	},
	pressed: {
		opacity: 0.8,
	},
	overlay: {
		flex: 1,
		justifyContent: "flex-end",
	},
	backdrop: {
		...StyleSheet.absoluteFillObject,
		backgroundColor: "rgba(0, 0, 0, 0.55)", // web: overlay de idle bg-black/55
	},
	sheet: {
		backgroundColor: colors.surfaceLight,
		borderTopLeftRadius: radius.lg,
		borderTopRightRadius: radius.lg,
		paddingTop: spacing.lg,
		paddingHorizontal: spacing.lg,
		maxHeight: "70%",
	},
	title: {
		...text.regular,
		color: colors.textPrimary,
		marginBottom: spacing.md,
	},
	message: {
		...text.medium,
		color: colors.textMuted,
		paddingVertical: spacing.md,
	},
	error: {
		...text.medium,
		color: colors.danger,
		paddingVertical: spacing.md,
	},
	list: {
		flexGrow: 0,
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.md,
		paddingHorizontal: spacing.sm,
		paddingVertical: spacing.sm,
		borderRadius: radius.sm,
	},
	rowActive: {
		backgroundColor: colors.volume,
	},
	rowPressed: {
		opacity: 0.8,
	},
	rowDisabled: {
		opacity: opacity.disabled,
	},
	name: {
		...text.regular,
		color: colors.textPrimary,
		flex: 1,
	},
	check: {
		...text.regular,
		color: colors.fucsia,
	},
});
