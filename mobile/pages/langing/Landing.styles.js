import { StyleSheet } from "react-native";
import {
	colors,
	spacing,
	fontSize,
	lineHeight,
	fontWeight,
	radius,
	sizes,
	shadows,
} from "../../theme";

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
		color: colors.textPrimary,
		fontSize: fontSize.header3,      // Header3 en la web
		fontWeight: fontWeight.bold,
		lineHeight: lineHeight.header3,
	},

	// Hero
	hero: {
		paddingHorizontal: spacing.lg,
		paddingTop: spacing.xl,
		paddingBottom: spacing.xxl,
	},
	heroTitle: {
		color: colors.textPrimary,
		fontSize: fontSize.header1,      // Header1 en la web (56px)
		lineHeight: lineHeight.header1,  // 64px
		fontWeight: fontWeight.bold,
	},
	heroText: {
		color: colors.textMuted,
		fontSize: fontSize.large,        // TextLarge en la web (18px)
		lineHeight: lineHeight.large,    // 24px
		fontWeight: fontWeight.regular,
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
		color: colors.textPrimary,
		fontSize: fontSize.regular,      // TextRegluar en la web
		lineHeight: lineHeight.regular,
		fontWeight: fontWeight.regular,
	},

	// Sección "Cómo funciona" (web: Wall)
	section: {
		backgroundColor: colors.wall,    // Wall en la web
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.xl,
	},
	sectionTitle: {
		color: colors.textPrimary,
		fontSize: fontSize.header3,      // Header3 en la web
		lineHeight: lineHeight.header3,
		fontWeight: fontWeight.bold,
		marginBottom: spacing.lg,
	},
	stepItem: {
		marginBottom: spacing.lg,
	},
	stepNumber: {
		color: colors.textPrimary,
		fontSize: fontSize.header3,      // Header3 en la web
		lineHeight: lineHeight.header3,
		fontWeight: fontWeight.bold,
	},
	stepTitle: {
		color: colors.textPrimary,
		fontSize: fontSize.large,        // TextLarge en la web
		lineHeight: lineHeight.large,
		fontWeight: fontWeight.regular,
		marginTop: spacing.xs,
	},
	stepText: {
		color: colors.textMuted,
		fontSize: fontSize.regular,      // TextRegluar en la web
		lineHeight: lineHeight.regular,
		marginTop: spacing.xs,
	},

	// Sección "Features"
	featureCard: {
		backgroundColor: colors.surfaceLight,  // SurfaceLight en la web
		borderRadius: radius.lg,
		padding: spacing.lg,
		marginBottom: spacing.md,
	},
	featureTitle: {
		color: colors.textPrimary,
		fontSize: fontSize.large,        // TextLarge en la web
		lineHeight: lineHeight.large,
		fontWeight: fontWeight.regular,
	},
	featureText: {
		color: colors.textMuted,
		fontSize: fontSize.regular,      // TextRegluar en la web
		lineHeight: lineHeight.regular,
		marginTop: spacing.sm,
	},

	// Footer
	footer: {
		paddingHorizontal: spacing.lg,
		paddingVertical: spacing.xl,
		alignItems: "center",
	},
	footerText: {
		color: colors.textMuted,
		fontSize: fontSize.tiny,         // TextTiny en la web
		lineHeight: lineHeight.tiny,
	},
});