import { StyleSheet } from "react-native";
import { colors, radius, spacing, text } from "../../../theme";

export const ALBUM_DETAIL_STYLES = StyleSheet.create({
	container: {
		backgroundColor: colors.background,
		flex: 1,
	},
	content: {
		paddingHorizontal: spacing.lg,
		paddingTop: spacing.sm,
	},
	listContent: {
		paddingHorizontal: spacing.lg,
		paddingTop: spacing.sm,
	},

	// ── Top bar / back ─────────────────────────────────────────────────
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

	// ── Cover ──────────────────────────────────────────────────────────
	coverWrapper: {
		alignSelf: "center",
		aspectRatio: 1,
		borderRadius: radius.card,
		marginBottom: spacing.lg,
		marginTop: spacing.sm,
		overflow: "hidden",
		width: "70%",
	},
	cover: {
		height: "100%",
		width: "100%",
	},
	coverFallback: {
		alignItems: "center",
		backgroundColor: colors.surfaceLight,
		flex: 1,
		justifyContent: "center",
	},

	// ── Meta del álbum ─────────────────────────────────────────────────
	kicker: {
		...text.tiny,
		color: colors.fucsia,
		textAlign: "center",
		textTransform: "uppercase",
	},
	name: {
		...text.header3,
		color: colors.textPrimary,
		marginTop: spacing.xs,
		textAlign: "center",
	},
	artistRow: {
		alignSelf: "center",
		marginTop: spacing.xs,
	},
	artistName: {
		...text.regular,
		color: colors.textMuted,
		textAlign: "center",
	},
	meta: {
		...text.medium,
		color: colors.textMuted,
		marginTop: spacing.xs,
		textAlign: "center",
	},
	playButton: {
		alignItems: "center",
		alignSelf: "center",
		backgroundColor: colors.fucsia,
		borderRadius: radius.full,
		flexDirection: "row",
		gap: spacing.sm,
		marginTop: spacing.lg,
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.sm,
	},
	playButtonText: {
		...text.button,
		color: colors.lighter,
	},

	// ── Track list ─────────────────────────────────────────────────────
	trackRow: {
		alignItems: "center",
		borderBottomColor: colors.border,
		borderBottomWidth: 1,
		flexDirection: "row",
		gap: spacing.md,
		paddingVertical: spacing.md,
	},
	trackNumber: {
		...text.medium,
		color: colors.textMuted,
		minWidth: 24,
		textAlign: "right",
	},
	trackText: {
		flex: 1,
		minWidth: 0,
	},
	trackTitle: {
		...text.regular,
		color: colors.textPrimary,
	},
	trackArtist: {
		...text.medium,
		color: colors.textMuted,
		marginTop: 2,
	},
	trackDuration: {
		...text.medium,
		color: colors.textMuted,
	},

	// ── Estados ────────────────────────────────────────────────────────
	loadingContainer: {
		alignItems: "center",
		gap: spacing.sm,
		paddingVertical: spacing.xxl,
	},
	loadingText: {
		...text.regular,
		color: colors.textMuted,
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

	pressed: {
		opacity: 0.7,
	},
	disabled: {
		opacity: 0.4,
	},
});
