import Svg, { Path } from "react-native-svg";

// Contrato de todo ícono de la app: <Icon size={number} color={string} />.
// Cualquier componente que cumpla ese contrato sirve (SVG propio, librería de
// íconos, etc.), así BottomNav y el resto no dependen de cómo se dibuja.
//
// Para agregar un ícono SVG (viewBox 24x24, relleno sólido):
//   export const PlayIcon = makeIcon("M8 5v14l11-7z");
export const makeIcon = (d) =>
	function Icon({ size, color }) {
		return (
			<Svg width={size} height={size} viewBox="0 0 24 24">
				<Path d={d} fill={color} />
			</Svg>
		);
	};

// Navegación (tomados del prototipo)
export const HomeIcon = makeIcon("M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z");
export const LibraryIcon = makeIcon("M12 3v10.55A4 4 0 1 0 14 17V7h4V3z");
export const SearchIcon = makeIcon(
	"M15.5 14h-.79l-.28-.27a6.5 6.5 0 1 0-.7.7l.27.28v.79l5 4.99L20.49 19zm-6 0A4.5 4.5 0 1 1 14 9.5 4.5 4.5 0 0 1 9.5 14z",
);

// TEMPORAL: círculo neutro para pestañas cuyo ícono aún no se importó.
// Reemplazar por el SVG real y borrar este.
export const PlaceholderIcon = makeIcon("M12 4a8 8 0 1 0 0 16 8 8 0 0 0 0-16z");