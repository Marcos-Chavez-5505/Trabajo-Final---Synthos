import Svg, { Path } from "react-native-svg";

// Solo los cuatro glifos que usa el Toast de beUI Native
// (Check, Exclaim, Info y Ring), sin el catálogo `agent-icons` completo.

function Glyph({ size = 16, color, strokeWidth = 2, children }) {
	return (
		<Svg
			width={size}
			height={size}
			viewBox="0 0 24 24"
			fill="none"
			stroke={color}
			strokeWidth={strokeWidth}
			strokeLinecap="round"
			strokeLinejoin="round"
		>
			{children}
		</Svg>
	);
}

export function CheckGlyph(props) {
	return (
		<Glyph {...props}>
			<Path d="M5 12.5l4.5 4.5L19 7" />
		</Glyph>
	);
}

/** Signo de exclamación solo, para el badge relleno de error. */
export function ExclaimGlyph(props) {
	return (
		<Glyph {...props}>
			<Path d="M12 6.5v7M12 17.5h.01" />
		</Glyph>
	);
}

/** Una "i" sola, para el badge relleno de información. */
export function InfoGlyph(props) {
	return (
		<Glyph {...props}>
			<Path d="M12 11v6.5M12 6.5h.01" />
		</Glyph>
	);
}

/** Anillo abierto que gira con `SpinGlyph`. */
export function RingGlyph(props) {
	return (
		<Glyph {...props}>
			<Path d="M20.5 12a8.5 8.5 0 1 1-6-8.1" />
		</Glyph>
	);
}
