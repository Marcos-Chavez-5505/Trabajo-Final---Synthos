import { StyleSheet } from "react-native";
import { colors, radius, spacing, text } from "../../../theme";

export const ARTIST_DETAIL_STYLES = StyleSheet.create({
	container: {
		backgroundColor: colors.background,
		flex: 1,
	},
	content: {
		paddingHorizontal: spacing.lg,
		paddingTop: spacing.sm,
	},
	topBar: {
		alignItems: "center",
		flexDirection: "row",
		marginBottom: spacing.sm,
	},
	iconButton: {
		alignItems: "center",
		height: 40,
		justifyContent: "center",
		width: 40,
	},
	hero: {
		alignItems: "center",
		flexDirection: "row",
		gap: spacing.md,
		marginTop: spacing.md,
	},
	heroText: {
		flex: 1,
		minWidth: 0,
	},
	kicker: {
		...text.tiny,
		color: colors.fucsia,
		textTransform: "uppercase",
	},
	name: {
		...text.header3,
		color: colors.textPrimary,
		marginTop: spacing.xs,
	},
	meta: {
		...text.regular,
		color: colors.textMuted,
		marginTop: spacing.xs,
	},
	sectionTitle: {
		...text.header4,
		color: colors.textPrimary,
		marginBottom: spacing.md,
		marginTop: spacing.xl,
	},
	column: {
		gap: spacing.md,
	},
	itemWrapper: {
		flex: 1,
		paddingBottom: spacing.lg,
	},

	errorPill: {
		backgroundColor: colors.salmon,
		borderRadius: radius.md,
		marginTop: spacing.xl,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
	},
	errorText: {
		...text.medium,
		color: colors.textPrimary,
	},
	backButton: {
		alignSelf: "flex-start",
		backgroundColor: colors.surfaceLight,
		borderRadius: radius.full,
		marginTop: spacing.lg,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
	},
	backButtonText: {
		...text.button,
		color: colors.textPrimary,
	},

	loadingContainer: {
		alignItems: "center",
		gap: spacing.sm,
		paddingVertical: spacing.xxl,
	},
	loadingText: {
		...text.regular,
		color: colors.textMuted,
	},

	pressed: {
		opacity: 0.7,
	},
});
