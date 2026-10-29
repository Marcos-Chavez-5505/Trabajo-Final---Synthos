// Design tokens para React Native (puro). Solo valores atómicos.
// No contiene objetos de estilos compuestos ni lógica.

// Colores agrupados por rol
export const colors = {
	background: "#605468", // Wall
	surface: "#1e1e1e",
	surfaceLight: "#2a2a2c",
	textPrimary: "#f4f0f9", // Lighter
	textMuted: "#b0a4b5", // LightMuted
	border: "#373038", // Volume
	primary: "#ef2f62", // Fucsia
	danger: "#d51639", // Red
	dangerBg: "rgba(213, 22, 57, 0.16)",
	placeholder: "#b0a4b5",
};

// Escala de espaciados (múltiplos coherentes)
export const spacing = {
	xs: 4,
	sm: 8,
	md: 12,
	lg: 16,
	xl: 24,
	xxl: 32,
};

// Tipografía
export const fontSize = {
	xs: 12, // TextMedium
	md: 16, // TextRegular / Button
	xl: 24, // Header3
};

export const lineHeight = {
	xs: 18,
	md: 24,
	xl: 40,
};

export const fontWeight = {
	regular: "400",
	medium: "500",
	bold: "700",
};

export const fontFamily = {
	base: "Roboto",
};

// Bordes
export const radius = {
	sm: 6,
	md: 8,
	lg: 12,
};

export const borderWidth = {
	sm: 1,
};

// Opacidades semánticas
export const opacity = {
	subtle: 0.8,
	muted: 0.7,
	disabled: 0.6,
};

// Tamaños atómicos
export const sizes = {
	buttonHeight: 40,
	cardMaxWidth: 448,
};

// Sombras / Elevación (valores atómicos)
export const shadows = {
	elevation1: {
		shadowColor: colors.background,
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.6,
		shadowRadius: 8,
		elevation: 8,
	},
};
