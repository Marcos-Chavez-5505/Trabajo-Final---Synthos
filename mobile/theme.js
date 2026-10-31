// Tema de React Native. NO contiene valores propios: todo se lee de
// shared/src/tokens/tokens.js (la misma fuente que genera frontend/src/styles/tokens.css).
// Acá solo se decide qué nombre recibe cada token en mobile y se convierte
// '16px' -> 16, que es lo que React Native necesita.
//
// Import profundo: shared/package.json no define "exports", así que se puede
// importar el archivo directamente sin cargar src/index.js (socket.io, hooks).
import { getToken } from "@synthos/shared/src/tokens/tokens.js";

const str = (name) => {
	const value = getToken(name);
	if (value === undefined) throw new Error(`Token no definido en tokens.js: ${name}`);
	return value;
};
const num = (name) => parseFloat(str(name)); // '16px' -> 16, '0.7' -> 0.7

// ── Colores ────────────────────────────────────────────────────────────────
export const colors = {
	// Paleta base
	red: str("--ds-red"),
	salmon: str("--ds-salmon"),
	lighter: str("--ds-lighter"),
	pink: str("--ds-pink"),
	light: str("--ds-light"),
	shadow: str("--ds-shadow"),
	plaster: str("--ds-plaster"),
	volume: str("--ds-volume"),
	wall: str("--ds-wall"),
	surface: str("--ds-surface"),
	surfaceLight: str("--ds-surface-light"),
	lighterMuted: str("--ds-lighter-muted"),
	lightMuted: str("--ds-light-muted"),
	fucsia: str("--ds-fucsia"),
	placeholder: str("--ds-placeholder"),
	warning: str("--ds-warning"),

	// Alias semánticos (mismo criterio que el puente shadcn de frontend/src/index.css)
	background: str("--ds-surface"),
	textPrimary: str("--ds-lighter"),
	textMuted: str("--ds-light-muted"),
	border: str("--ds-volume"),
	primary: str("--ds-fucsia"),
	danger: str("--ds-red"),
	dangerBg: str("--ds-danger-bg"),
};

// ── Tipografía ─────────────────────────────────────────────────────────────
// clave mobile -> sufijo del token (el token web se llama "regluar", con typo)
const TYPE_SCALE = {
	tiny: "tiny",
	medium: "medium",
	regular: "regluar",
	button: "button",
	large: "large",
	header4: "header4",
	header3: "header3",
	header2: "header2",
	header1: "header1",
};
const fromScale = (prefix) =>
	Object.fromEntries(
		Object.entries(TYPE_SCALE).map(([key, suffix]) => [key, num(`${prefix}${suffix}`)]),
	);

export const fontSize = fromScale("--ds-size-");
export const lineHeight = fromScale("--ds-lh-");

export const fontWeight = {
	regular: str("--ds-weight-regular"),
	medium: str("--ds-weight-medium"),
	bold: str("--ds-weight-bold"),
};

export const fontFamily = {
	// React Native no admite listas de fallback: se toma solo la primera familia.
	base: str("--ds-font").split(",")[0].trim(),
};

// ── Espaciado, formas y opacidad ───────────────────────────────────────────
export const spacing = {
	xs: num("--ds-space-xs"),
	sm: num("--ds-space-sm"),
	md: num("--ds-space-md"),
	lg: num("--ds-space-lg"),
	xl: num("--ds-space-xl"),
	xxl: num("--ds-space-xxl"),
};

export const radius = {
	card: num("--ds-radius-card"),
	sm: num("--ds-radius-sm"),
	md: num("--ds-radius-md"),
	lg: num("--ds-radius-lg"),
	full: num("--ds-radius-full"),
};

export const borderWidth = {
	sm: num("--ds-border-width-sm"),
};

export const opacity = {
	subtle: num("--ds-opacity-subtle"),
	muted: num("--ds-opacity-muted"),
	disabled: num("--ds-opacity-disabled"),
};

// ── Tamaños de componentes ─────────────────────────────────────────────────
export const sizes = {
	buttonHeight: num("--ds-height-button"),
	cardMaxWidth: num("--ds-width-card-max"),
	avatar: num("--ds-size-avatar"),
	navIndicatorWidth: num("--ds-width-nav-indicator"),
	navIndicatorHeight: num("--ds-height-nav-indicator"),
	navIcon: num("--ds-size-nav-icon"),
	mediaCard: num("--ds-size-media-card"),
	miniMediaCard: num("--ds-size-mini-media-card"),
	mediaCardPlay: num("--ds-size-media-card-play"),
};

// ── Sombras ────────────────────────────────────────────────────────────────
export const shadows = {
	elevation1: {
		shadowColor: str("--ds-wall"),
		shadowOffset: { width: 0, height: num("--ds-elevation-1-y") },
		shadowOpacity: num("--ds-elevation-1-opacity"),
		shadowRadius: num("--ds-elevation-1-blur"),
		elevation: num("--ds-elevation-1-android"),
	},
};

// ── Presets de tipografía ──────────────────────────────────────────────────
// Equivalen a las clases de frontend/src/styles/utilities.css (.Header3,
// .TextMedium, .Button, ...): misma combinación de tamaño, interlineado y
// peso. Se usan con spread: { ...text.header3, color: colors.textPrimary }
const preset = (key, weight) => ({
	fontFamily: fontFamily.base,
	fontSize: fontSize[key],
	lineHeight: lineHeight[key],
	fontWeight: fontWeight[weight],
});

export const text = {
	button: preset("button", "medium"), //   .Button
	regular: preset("regular", "regular"), // .TextRegluar
	large: preset("large", "regular"), //    .TextLarge
	medium: preset("medium", "regular"), //  .TextMedium
	tiny: preset("tiny", "regular"), //      .TextTiny
	header4: preset("header4", "bold"), //   .Header4
	header3: preset("header3", "bold"), //   .Header3
	header2: preset("header2", "bold"), //   .Header2
	header1: preset("header1", "bold"), //   .Header1
};