import { StyleSheet } from "react-native";
import {
	colors,
	fontWeight,
	radius,
	spacing,
	text,
} from "../../theme";

export const PLAYLISTS_STYLES = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.surface,
	},
	topBar: {
		paddingHorizontal: spacing.lg,
	},
	header: {
		paddingHorizontal: spacing.lg,
	},
	titleRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: spacing.md,
	},
	title: {
		...text.header3,
		color: colors.textPrimary,
	},
	createButton: {
		backgroundColor: colors.fucsia,
		borderRadius: 8,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
	},
	createButtonText: {
		...text.button,
		color: colors.textPrimary,
		fontWeight: fontWeight.medium,
	},
	pressed: { opacity: 0.85 },
	tabs: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: spacing.sm,
		marginTop: spacing.md,
	},
	tab: {
		backgroundColor: colors.volume,
		borderRadius: 8,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
	},
	tabActive: {
		backgroundColor: colors.fucsia,
	},
	tabText: {
		...text.button,
		color: colors.textPrimary,
	},
	formWrapper: {
		marginTop: spacing.lg,
	},
	error: {
		...text.medium,
		color: colors.red,
		backgroundColor: colors.dangerBg,
		borderRadius: radius.card,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		marginTop: spacing.md,
	},
	list: {
		paddingHorizontal: spacing.lg,
		paddingTop: spacing.lg,
		paddingBottom: spacing.xxl,
		gap: spacing.md,
	},
	listFlex: {
		flex: 1,
	},
	gridRow: {
		gap: spacing.md,
	},
	cardCell: {
		flexBasis: "48%",
		flexGrow: 0,
		minWidth: 0,
	},
	state: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: spacing.xl,
	},
	emptyTitle: {
		...text.header4,
		color: colors.textPrimary,
		marginTop: spacing.md,
	},
	message: {
		...text.regular,
		color: colors.textMuted,
		textAlign: "center",
		marginTop: spacing.xs,
	},
});
