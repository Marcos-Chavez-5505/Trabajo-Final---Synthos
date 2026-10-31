// Design tokens para React Native (puro). Solo valores atómicos.
// Traducidos desde Frontend/src/styles/tokens.css

export const colors = {
	// Colores base
	red: "#d51639",
	salmon: "#c34b61",
	lighter: "#f4f0f9",
	pink: "#eb84a5",
	light: "#c6bed3",
	shadow: "#453a4a",
	plaster: "#8e7288",
	volume: "#373038",
	wall: "#605468",
	surface: "#1e1e1e",
	surfaceLight: "#2a2a2c",
	lighterMuted: "#f9e5ff",
	lightMuted: "#b0a4b5",
	fucsia: "#ef2f62",
	placeholder: "#b0a4b5",

	// Alias semánticos (para mantener compatibilidad con lo que ya existe)
	background: "#605468",
	textPrimary: "#f4f0f9",
	textMuted: "#b0a4b5",
	border: "#373038",
	primary: "#ef2f62",
	danger: "#d51639",
	dangerBg: "rgba(213, 22, 57, 0.16)",
};

export const fontSize = {
	tiny: 10,
	medium: 12,
	regular: 16,
	button: 16,
	large: 18,
	header4: 18,
	header3: 24,
	header2: 36,
	header1: 56,
};

export const lineHeight = {
	tiny: 14,
	medium: 18,
	regular: 24,
	button: 24,
	large: 24,
	header4: 24,
	header3: 40,
	header2: 48,
	header1: 64,
};

export const fontWeight = {
	regular: "400",
	medium: "500",
	bold: "700",
};

export const fontFamily = {
	base: "Roboto",
};

export const spacing = {
	xs: 4,
	sm: 8,
	md: 12,
	lg: 16,
	xl: 24,
	xxl: 32,
};

export const radius = {
	card: 6,
	sm: 6,
	md: 8,
	lg: 12,
};

export const borderWidth = {
	sm: 1,
};

export const opacity = {
	subtle: 0.8,
	muted: 0.7,
	disabled: 0.6,
};

export const sizes = {
	buttonHeight: 40,
	mediaCard: 180,
	miniMediaCard: 150,
	mediaCardPlay: 36,
};

export const shadows = {
	elevation1: {
		shadowColor: "#605468",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.6,
		shadowRadius: 8,
		elevation: 8,
	},
};