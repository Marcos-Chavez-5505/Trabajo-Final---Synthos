import { StyleSheet } from "react-native";
import { colors, opacity, radius, shadows, sizes, spacing, text } from "../../../theme";

// Barra de reproducción flotante sobre el BottomNav. Replica el mini
// reproductor web (SurfaceLight, Elevation1, `px-4 py-2` / `px-4 pb-2`) pero con
// las cuatro esquinas redondeadas y separación con el nav y los bordes.
const BAR_RADIUS = 16; // rounded-2xl; radius.lg (12) quedaba más cuadrado que la web

export const MINI_PLAYER_STYLES = StyleSheet.create({
	bar: {
		backgroundColor: colors.surfaceLight,
		borderRadius: BAR_RADIUS,
		paddingHorizontal: spacing.lg,
		paddingTop: spacing.sm,
		paddingBottom: spacing.sm,
		marginHorizontal: spacing.md,
		marginBottom: spacing.lg,
		...shadows.elevation1,
	},
	row: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.md,
	},
	// Zona táctil que expande el reproductor: carátula + título/artista.
	info: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.md,
	},
	infoPressed: {
		opacity: opacity.subtle,
	},
	cover: {
		width: sizes.buttonHeight,
		height: sizes.buttonHeight,
		borderRadius: radius.sm,
		backgroundColor: colors.border,
		alignItems: "center",
		justifyContent: "center",
		overflow: "hidden",
	},
	coverImage: {
		width: "100%",
		height: "100%",
	},
	titles: {
		flex: 1,
	},
	title: {
		...text.regular,
		color: colors.textPrimary,
	},
	// Web: TextMedium + `opacity-70` sobre el color del texto principal
	// (no un color "muted" aparte).
	artist: {
		...text.medium,
		color: colors.textPrimary,
		opacity: opacity.muted,
	},
	button: {
		width: sizes.mediaCardPlay,
		height: sizes.mediaCardPlay,
		borderRadius: sizes.mediaCardPlay / 2,
		alignItems: "center",
		justifyContent: "center",
	},
	// tone="solid" del ControlButton web: fondo Lighter, ícono oscuro.
	playButton: {
		backgroundColor: colors.lighter,
	},
	// tone="soft" del ControlButton web: fondo Light, ícono oscuro.
	nextButton: {
		backgroundColor: colors.light,
	},
	expandButton: {
		width: sizes.mediaCardPlay,
		height: sizes.mediaCardPlay,
		alignItems: "center",
		justifyContent: "center",
	},
	disabled: {
		opacity: opacity.disabled,
	},
	// Web: la fila cierra con `py-2`, o sea 8px entre los botones y la barra.
	progress: {
		marginTop: spacing.sm,
	},
});