import { StyleSheet } from "react-native";
import { colors, spacing, text, radius } from "../../theme";

// Los presets de `text` equivalen a las clases de la web (Header1, Header3,
// TextLarge, TextRegluar, TextTiny).
export const LANDING_STYLES = StyleSheet.create({
	// Contenedor principal (web: Surface)
	main: {
		flex: 1,
		backgroundColor: colors.surface,
		paddingTop: 60,
	},
	scroll: {
		paddingBottom: spacing.xxl,
	},

	// Header
	header: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.md,
	},
	logo: {
		...text.header3,
		color: colors.textPrimary,
	},

	// Hero
	hero: {
		paddingHorizontal: spacing.lg,
		paddingTop: spacing.xl,
		paddingBottom: spacing.xxl,
	},
	heroTitle: {
		...text.header1,
		color: colors.textPrimary,
	},
	heroText: {
		...text.large,
		color: colors.textMuted,
		marginTop: spacing.md,
	},

	// Botones del hero
	heroButtons: {
		flexDirection: "row",
		gap: spacing.md,
		marginTop: spacing.xl,
	},
	buttonPrimary: {
		backgroundColor: colors.fucsia,
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.md,
		borderRadius: radius.lg,
	},
	buttonSecondary: {
		backgroundColor: colors.surfaceLight,
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.md,
		borderRadius: radius.lg,
	},
	buttonText: {
		...text.regular,
		color: colors.textPrimary,
	},

	// Sección "Cómo funciona" (web: Wall)
	section: {
		backgroundColor: colors.wall,
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.xl,
	},
	sectionTitle: {
		...text.header3,
		color: colors.textPrimary,
		marginBottom: spacing.lg,
	},
	stepItem: {
		marginBottom: spacing.lg,
	},
	stepNumber: {
		...text.header3,
		color: colors.textPrimary,
	},
	stepTitle: {
		...text.large,
		color: colors.textPrimary,
		marginTop: spacing.xs,
	},
	stepText: {
		...text.regular,
		color: colors.textMuted,
		marginTop: spacing.xs,
	},

	// Sección "Features"
	featureCard: {
		backgroundColor: colors.surfaceLight, // SurfaceLight en la web
		borderRadius: radius.lg,
		padding: spacing.lg,
		marginBottom: spacing.md,
	},
	featureTitle: {
		...text.large,
		color: colors.textPrimary,
	},
	featureText: {
		...text.regular,
		color: colors.textMuted,
		marginTop: spacing.sm,
	},

	// Footer
	footer: {
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.xl,
		alignItems: "center",
	},
	footerText: {
		...text.tiny,
		color: colors.textMuted,
	},
});