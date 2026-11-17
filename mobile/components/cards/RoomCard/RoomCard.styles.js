import { StyleSheet } from "react-native";
import {
	colors,
	spacing,
	radius,
	borderWidth,
	lineHeight,
	text,
	fontWeight,
	roomCard,
} from "../../../theme";

// Cinco corazones: se repite acá y en el componente a través del export.
const HEARTS = 5;
export const ROOM_CARD_HEARTS = HEARTS;

export const ROOM_CARD_STYLES = StyleSheet.create({
	// Sin sombra de elevación: se quitó en el rediseño de web.
	container: {
		backgroundColor: colors.surfaceLight,
		borderRadius: radius.xl,
		padding: roomCard.padding,
		gap: spacing.md,
		justifyContent: "space-between",
	},

	// ── Fila superior ────────────────────────────────────────────────────────
	topRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		justifyContent: "space-between",
		gap: spacing.md,
	},
	chips: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		flexShrink: 1,
		minWidth: 0,
	},
	chip: {
		height: roomCard.chipHeight,
		paddingHorizontal: spacing.md,
		borderRadius: radius.lg,
		backgroundColor: colors.surface,
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.sm,
		flexShrink: 0,
	},
	liveDot: {
		width: roomCard.dot,
		height: roomCard.dot,
		borderRadius: radius.full,
		borderWidth: borderWidth.md,
		borderColor: colors.fucsia,
	},
	liveDotOn: {
		backgroundColor: colors.fucsia,
	},
	chipText: {
		...text.tiny,
		color: colors.fucsia,
		fontWeight: fontWeight.bold,
	},
	// El chip de géneros es el único que cede espacio.
	genresChip: {
		flexShrink: 1,
		minWidth: 0,
	},
	genresText: {
		...text.tiny,
		color: colors.fucsia,
		fontWeight: fontWeight.bold,
		flexShrink: 1,
	},
	privateText: {
		...text.medium,
		color: colors.textMuted,
	},
	action: {
		flexShrink: 0,
	},

	// ── Título y descripción ─────────────────────────────────────────────────
	titleBlock: {
		minWidth: 0,
	},
	title: {
		...text.header3,
		color: colors.textPrimary,
	},
	// Reserva siempre dos líneas para que todas las tarjetas midan lo mismo.
	description: {
		...text.regular,
		color: colors.textMuted,
		marginTop: spacing.xs,
		minHeight: lineHeight.regular * 2,
	},

	// ── Fila inferior ────────────────────────────────────────────────────────
	footer: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: spacing.md,
	},

	// Bandeja de invitados
	tray: {
		backgroundColor: colors.volume,
		borderRadius: radius.full,
		padding: spacing.sm,
		flexDirection: "row",
		alignItems: "center",
		flexShrink: 0,
	},
	overlap: {
		marginLeft: -roomCard.guestOverlap,
	},
	// Entre el último avatar y el primer hueco el solape se reduce 4px.
	emptyFirstGap: {
		marginLeft: -(roomCard.guestOverlap - spacing.xs),
	},
	guestAvatar: {
		borderWidth: borderWidth.md,
		borderColor: colors.volume,
	},
	emptySlot: {
		width: roomCard.guest,
		height: roomCard.guest,
		borderRadius: radius.full,
		backgroundColor: colors.wall,
		borderWidth: borderWidth.md,
		borderColor: colors.volume,
	},

	// Anfitriona + corazones
	host: {
		flexDirection: "row",
		alignItems: "center",
		gap: spacing.md,
		flexShrink: 1,
		minWidth: 0,
	},
	hostAvatar: {
		flexShrink: 0,
	},
	badge: {
		position: "absolute",
		top: -spacing.xs,
		right: -spacing.xs,
		width: roomCard.badge,
		height: roomCard.badge,
		borderRadius: radius.full,
		backgroundColor: colors.salmon,
		borderWidth: borderWidth.md,
		borderColor: colors.surfaceLight,
		alignItems: "center",
		justifyContent: "center",
	},
	hostText: {
		flexShrink: 1,
		minWidth: 0,
	},
	hostName: {
		...text.medium,
		color: colors.textPrimary,
	},
	hearts: {
		// Ancho preferido: 5 corazones con 4 separaciones. maxWidth lo encoge
		// con la columna y onLayout mide el ancho real.
		width: roomCard.heart * HEARTS + roomCard.heartGap * (HEARTS - 1),
		maxWidth: "100%",
		height: roomCard.heart,
		flexDirection: "row",
		alignItems: "center",
		alignSelf: "flex-start",
	},
});
