import { StyleSheet } from "react-native";
import { colors, opacity, radius, shadows, sizes, spacing, text } from "../../../theme";

// Composición: cabecera (minimizar + título), carátula cuadrada a todo el ancho,
// título/artista alineados a la izquierda, barra ondulada con tiempos,
// transporte, píldora de acciones y "A continuación".
export const EXPANDED_PLAYER_STYLES = StyleSheet.create({
	screen: {
		flex: 1,
		backgroundColor: colors.volume, // web: clase `Volume` (#373038)
	},
	header: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		paddingHorizontal: spacing.lg,
		paddingBottom: spacing.sm,
	},
	closeButton: {
		width: sizes.buttonHeight,
		height: sizes.buttonHeight,
		borderRadius: radius.full,
		backgroundColor: "rgba(30, 30, 30, 0.3)", // web: bg-background/30
		alignItems: "center",
		justifyContent: "center",
	},
	headerTitle: {
		...text.medium,
		color: colors.lighter,
	},
	headerSpacer: {
		width: sizes.buttonHeight,
	},
	scroll: {
		flexGrow: 1,
		alignItems: "center",
		paddingTop: spacing.sm,
	},
	content: {
		flexGrow: 1,
	},
	cover: {
		width: "100%",
		aspectRatio: 1,
		borderRadius: radius.lg,
		backgroundColor: colors.surfaceLight,
		alignItems: "center",
		justifyContent: "center",
		overflow: "hidden",
		...shadows.elevation1,
	},
	coverImage: {
		width: "100%",
		height: "100%",
	},
	infos: {
		paddingTop: spacing.lg,
		gap: spacing.xs,
	},
	title: {
		...text.header3,
		color: colors.lighter,
	},
	artist: {
		...text.large,
		color: colors.textMuted,
	},
	playingFrom: {
		...text.medium,
		color: colors.textMuted,
		textAlign: "center",
		paddingTop: spacing.lg,
	},
	playingFromName: {
		color: colors.lighter,
	},
	// El track del wavy ya trae 8px de margen interno; con 10 + 8 queda en los
	// 18px laterales de la web.
	progress: {
		paddingHorizontal: 10,
	},
	pressed: {
		opacity: opacity.subtle,
	},
});