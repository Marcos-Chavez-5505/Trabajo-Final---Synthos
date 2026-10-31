import { StyleSheet } from "react-native";
import { colors, spacing } from "../../theme";
import { AUTH_STYLES, AUTH_COLORS } from "../auth/Auth.styles";

// Mantiene la misma API que antes (LOGIN_STYLES.xxx), pero reutiliza los
// estilos comunes de Auth.styles.js. Solo se define lo exclusivo de Login.
export const LOGIN_STYLES = {
	...AUTH_STYLES,
	...StyleSheet.create({
		inputPlaceholder: {
			color: colors.placeholder,
		},
		loadingContainer: {
			flex: 1,
			backgroundColor: colors.wall,
			alignItems: "center",
			justifyContent: "center",
		},
		// Estado "ya logueado": variantes centradas de main/card/header/subtitle.
		loggedContainer: {
			...AUTH_STYLES.main,
		},
		loggedCard: {
			...AUTH_STYLES.card,
			alignItems: "center",
		},
		loggedTitle: {
			...AUTH_STYLES.header,
			textAlign: "center",
		},
		loggedSubtitle: {
			...AUTH_STYLES.subtitle,
			textAlign: "center",
		},
		logoutButton: {
			marginTop: spacing.xl,
			backgroundColor: colors.border,
		},
	}),
	// No son estilos: se exponen fuera de StyleSheet.create.
	...AUTH_COLORS,
};