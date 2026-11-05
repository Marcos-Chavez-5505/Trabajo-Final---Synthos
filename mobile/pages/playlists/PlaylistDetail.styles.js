import { StyleSheet } from "react-native";
import {
	colors,
	fontWeight,
	radius,
	spacing,
	text,
} from "../../theme";

export const PLAYLIST_DETAIL_STYLES = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: colors.surface,
	},
	flex: {
		flex: 1,
	},
	centered: {
		flex: 1,
		backgroundColor: colors.surface,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: spacing.xl,
		gap: spacing.md,
	},
	headerWrapper: {
		marginHorizontal: spacing.lg,
		marginBottom: spacing.lg,
	},
	// El glow de la cabecera llega a los bordes de la pantalla: el contenedor
	// tiene margen lateral, así que la capa lo compensa y se dibuja fuera de
	// sus límites (la cabecera ya no recorta).
	headerGlow: {
		position: "absolute",
		top: 0,
		left: -spacing.lg,
		right: -spacing.lg,
		bottom: 0,
	},
	header: {
		padding: spacing.lg,
		alignItems: "center",
		gap: spacing.lg,
	},
	coverWrapper: {
		marginTop: spacing.lg,
	},
	infoBlock: {
		width: "100%",
		gap: spacing.sm,
	},
	nameRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		gap: spacing.sm,
	},
	name: {
		...text.header2,
		color: colors.textPrimary,
		flexShrink: 1,
		lineHeight: 38,
	},
	pencil: {
		padding: 4,
		marginTop: 2,
		opacity: 0.5,
	},
	metaRow: {
		flexDirection: "row",
		alignItems: "center",
		flexWrap: "wrap",
		gap: spacing.sm,
	},
	bullet: {
		...text.medium,
		color: colors.textMuted,
	},
	count: {
		...text.medium,
		color: colors.textMuted,
		fontWeight: fontWeight.bold,
	},
	description: {
		...text.regular,
		color: colors.textMuted,
	},
	actionsRow: {
		flexDirection: "row",
		alignItems: "center",
		flexWrap: "wrap",
		gap: spacing.sm,
		marginTop: spacing.xs,
	},
	playButton: {
		width: 48,
		height: 48,
		borderRadius: radius.full,
		backgroundColor: colors.fucsia,
		alignItems: "center",
		justifyContent: "center",
	},
	inviteButton: {
		width: 36,
		height: 36,
		borderRadius: radius.full,
		backgroundColor: colors.volume,
		alignItems: "center",
		justifyContent: "center",
	},
	inviteButtonText: {
		...text.regular,
		color: colors.textPrimary,
	},
	deleteButton: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.xs,
		backgroundColor: colors.volume,
		borderRadius: 8,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
	},
	deleteText: {
		...text.medium,
		color: colors.textPrimary,
	},
	editBlock: {
		width: "100%",
		gap: spacing.sm,
	},
	nameInput: {
		backgroundColor: colors.volume,
		borderRadius: 8,
		paddingHorizontal: spacing.sm,
		paddingVertical: spacing.xs,
		color: colors.textPrimary,
		...text.header4,
	},
	descriptionInput: {
		backgroundColor: colors.volume,
		borderRadius: 8,
		paddingHorizontal: spacing.sm,
		paddingVertical: spacing.sm,
		minHeight: 72,
		textAlignVertical: "top",
		color: colors.textPrimary,
		...text.regular,
	},
	formError: {
		...text.medium,
		color: colors.red,
		backgroundColor: colors.dangerBg,
		borderRadius: 8,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
	},
	editButtons: {
		flexDirection: "row",
		gap: spacing.sm,
	},
	primaryButton: {
		backgroundColor: colors.fucsia,
		borderRadius: 8,
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.sm,
	},
	secondaryButton: {
		backgroundColor: colors.volume,
		borderRadius: 8,
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.sm,
	},
	buttonText: {
		...text.button,
		color: colors.textPrimary,
		fontWeight: fontWeight.medium,
	},
	pressed: { opacity: 0.8 },
	disabled: { opacity: 0.5 },
	favoritesNote: {
		...text.medium,
		color: colors.textMuted,
		marginHorizontal: spacing.lg,
		marginBottom: spacing.md,
	},
	stateRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		gap: spacing.sm,
		paddingVertical: spacing.lg,
	},
	mutedMessage: {
		...text.regular,
		color: colors.textMuted,
		textAlign: "center",
	},
	emptyState: {
		alignItems: "center",
		paddingVertical: spacing.xxl,
		paddingHorizontal: spacing.xl,
		gap: spacing.xs,
	},
	emptyTitle: {
		...text.header4,
		color: colors.textPrimary,
		marginTop: spacing.sm,
	},
	songList: {
		position: "relative",
		marginHorizontal: spacing.lg,
		marginTop: spacing.sm,
	},
	unavailableRow: {
		backgroundColor: colors.surfaceLight,
		borderRadius: radius.card,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.md,
		marginVertical: 2,
	},
	indicator: {
		position: "absolute",
		left: 0,
		right: 0,
		height: 2,
		borderRadius: 1,
		backgroundColor: colors.fucsia,
	},
	missingNote: {
		...text.medium,
		color: colors.textMuted,
		marginHorizontal: spacing.lg,
		marginTop: spacing.md,
	},
	membersSection: {
		marginHorizontal: spacing.lg,
		marginTop: spacing.xl,
		gap: spacing.sm,
	},
	sectionTitle: {
		...text.header4,
		color: colors.textPrimary,
		marginBottom: spacing.xs,
	},
	error: {
		...text.medium,
		color: colors.red,
		backgroundColor: colors.dangerBg,
		borderRadius: radius.card,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		textAlign: "center",
	},
});
