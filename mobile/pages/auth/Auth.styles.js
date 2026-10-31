import { StyleSheet } from "react-native";
import {
	colors,
	spacing,
	text,
	radius,
	borderWidth,
	opacity,
	sizes,
	shadows,
} from "../../theme";

// Estilos comunes a Login y Register (antes duplicados en cada archivo).
// Cada pantalla importa AUTH_STYLES y agrega solo lo que le es propio.
// Tipografía: mismas clases que Login.jsx en la web (Header3, TextMedium,
// TextRegluar, Button).
export const AUTH_STYLES = StyleSheet.create({
	main: {
		flex: 1,
		backgroundColor: colors.wall, // clase Wall en la web
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: spacing.lg,
	},
	card: {
		width: "100%",
		maxWidth: sizes.cardMaxWidth,
		backgroundColor: colors.surfaceLight,
		borderRadius: radius.lg,
		padding: spacing.xxl,
		...shadows.elevation1,
	},
	header: {
		...text.header3,
		color: colors.textPrimary,
	},
	subtitle: {
		...text.medium,
		color: colors.textPrimary,
		opacity: opacity.muted,
		marginTop: spacing.xs,
	},
	form: {
		marginTop: spacing.xl,
	},
	field: {
		marginBottom: spacing.lg,
	},
	labelText: {
		...text.medium,
		color: colors.textPrimary,
		opacity: opacity.subtle,
	},
	input: {
		...text.regular,
		marginTop: spacing.xs,
		width: "100%",
		borderWidth: borderWidth.sm,
		borderColor: colors.border,
		borderRadius: radius.md,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm + 2, // TODO: pasar a token (ej. sizes.inputPaddingY)
		color: colors.textPrimary,
		backgroundColor: "transparent",
	},
	errorContainer: {
		backgroundColor: colors.dangerBg,
		borderRadius: radius.sm,
		paddingHorizontal: spacing.md,
		paddingVertical: spacing.sm,
		marginBottom: spacing.lg,
	},
	errorText: {
		...text.medium,
		color: colors.danger,
	},
	button: {
		height: sizes.buttonHeight,
		backgroundColor: colors.primary,
		borderRadius: radius.md,
		alignItems: "center",
		justifyContent: "center",
		width: "100%",
	},
	buttonDisabled: {
		opacity: opacity.disabled,
	},
	buttonText: {
		...text.button,
		color: colors.textPrimary,
	},
	linkContainer: {
		marginTop: spacing.xl,
		alignItems: "center",
		justifyContent: "center",
		flexDirection: "row",
	},
	linkText: {
		...text.medium,
		color: colors.textPrimary,
		opacity: opacity.muted,
	},
	linkAction: {
		...text.medium,
		color: colors.textPrimary,
		textDecorationLine: "underline",
		marginLeft: spacing.xs,
	},
});

// Valores sueltos (no son estilos): props como placeholderTextColor o color
// del ActivityIndicator. Van fuera de StyleSheet.create.
export const AUTH_COLORS = {
	placeholderTextColor: colors.placeholder,
	indicatorColor: colors.textPrimary,
};