import { StyleSheet } from "react-native";
import { borderWidth, colors, radius, spacing, text } from "../../theme";

export const ARTISTS_PAGE_STYLES = StyleSheet.create({
	container: {
		backgroundColor: colors.background,
		flex: 1,
	},
	header: {
		paddingHorizontal: spacing.lg,
		paddingTop: spacing.md,
		paddingBottom: spacing.sm,
	},
	title: {
		...text.header3,
		color: colors.textPrimary,
	},
	subtitle: {
		...text.regular,
		color: colors.textMuted,
		marginTop: spacing.xs,
	},
	searchPill: {
		alignItems: "center",
		backgroundColor: colors.volume,
		borderRadius: radius.full,
		flexDirection: "row",
		gap: spacing.sm,
		marginTop: spacing.md,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
	},
	searchInput: {
		...text.regular,
		color: colors.textPrimary,
		flex: 1,
		padding: 0, // neutraliza el padding vertical por defecto de RN
	},
	placeholderColor: {
		// RN no admite `placeholderTextColor` desde StyleSheet; expuesto acá
		// para no duplicar el literal en el componente.
		color: colors.placeholder,
	},
	content: {
		paddingBottom: spacing.xxl,
		paddingHorizontal: spacing.lg,
		paddingTop: spacing.md,
	},
	column: {
		gap: spacing.md,
	},
	itemWrapper: {
		flex: 1,
		paddingBottom: spacing.lg,
	},

	// ── Estado vacío / carga / error ───────────────────────────────────
	emptyContainer: {
		alignItems: "center",
		gap: spacing.sm,
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.xxl,
	},
	emptyTitle: {
		...text.header4,
		color: colors.textPrimary,
		marginTop: spacing.md,
		textAlign: "center",
	},
	emptyMessage: {
		...text.regular,
		color: colors.textMuted,
		textAlign: "center",
	},

	// ── Paginación ─────────────────────────────────────────────────────
	pagination: {
		alignItems: "center",
		flexDirection: "row",
		justifyContent: "space-between",
		marginTop: spacing.lg,
	},
	pageButton: {
		backgroundColor: colors.surfaceLight,
		borderRadius: radius.full,
		borderWidth: borderWidth.sm,
		borderColor: colors.border,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
	},
	pageButtonPressed: {
		opacity: 0.7,
	},
	pageButtonDisabled: {
		opacity: 0.4,
	},
	pageButtonText: {
		...text.button,
		color: colors.textPrimary,
	},
	pageInfo: {
		...text.medium,
		color: colors.textMuted,
	},
});
