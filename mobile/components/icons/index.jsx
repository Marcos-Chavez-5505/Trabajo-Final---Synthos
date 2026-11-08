import Svg, { Path } from "react-native-svg";
// Import profundo (no el barrel de @synthos/shared: arrastraría servicios y socket.io).
import { icons } from "@synthos/shared/src/icons/icons.js";

// Contrato de todo ícono de la app: <Icon size={number} color={string} />.
// Cualquier componente que cumpla ese contrato sirve (SVG propio, librería de
// íconos, etc.), así BottomNav y el resto no dependen de cómo se dibuja.

// Ícono de un solo path de relleno (viewBox 24x24).
//   export const PlayIcon = makeIcon("M8 5v14l11-7z");
export const makeIcon = (d) =>
	function Icon({ size, color }) {
		return (
			<Svg width={size} height={size} viewBox="0 0 24 24">
				<Path d={d} fill={color} />
			</Svg>
		);
	};

// Dibuja un ícono del catálogo compartido (shared/src/icons/icons.js).
// Cada path es { d, fillRule? } (relleno), { d, stroke: true, strokeWidth,
// strokeLinecap?, strokeLinejoin? } (trazo) o ambos con `fill: true`.
// El color llega solo por `color`.
// Sin linecap/linejoin en el catálogo se aplican los valores por defecto de
// SVG (butt/miter), igual que en web.
export const makeSvgIcon = (paths, viewBox = "0 0 24 24") =>
	function Icon({ size, color }) {
		return (
			<Svg width={size} height={size} viewBox={viewBox}>
				{paths.map((path, index) =>
					path.stroke ? (
						<Path
							key={index}
							d={path.d}
							fill={path.fill ? color : "none"}
							fillRule={path.fill ? path.fillRule : undefined}
							stroke={color}
							strokeWidth={path.strokeWidth ?? 1}
							strokeLinecap={path.strokeLinecap}
							strokeLinejoin={path.strokeLinejoin}
						/>
					) : (
						<Path
							key={index}
							d={path.d}
							fill={color}
							fillRule={path.fillRule}
						/>
					),
				)}
			</Svg>
		);
	};

// Falla al cargar la app (no en silencio) si el nombre no existe en el catálogo.
const fromCatalog = (name) => {
	const icon = icons[name];
	if (!icon) {
		throw new Error(
			`Ícono "${name}" no existe en el catálogo compartido. Disponibles: ${Object.keys(icons).join(", ")}`,
		);
	}
	return makeSvgIcon(icon.paths, icon.viewBox);
};

// ── Desde el catálogo compartido (fuente: shared/assets/icons/<clave>.svg) ──
// La clave es el nombre del archivo .svg sin extensión en shared/assets/icons.
export const HomeIcon = fromCatalog("house");
export const SearchIcon = fromCatalog("search");
export const HeadphonesIcon = fromCatalog("headphones");
export const PlayIcon = fromCatalog("play");
export const PauseIcon = fromCatalog("pause");
export const PreviousIcon = fromCatalog("previous_track");
export const NextIcon = fromCatalog("next_track");
export const ChevronUpIcon = fromCatalog("expand");
export const ChevronDownIcon = fromCatalog("collapse");
export const ArrowLeftIcon = fromCatalog("left_arrow");
export const ArrowRightIcon = fromCatalog("right_arrow");
export const ShuffleIcon = fromCatalog("shuffle");
export const RepeatIcon = fromCatalog("repeat");
export const RepeatOneIcon = fromCatalog("repeat_only_one");
export const HeartIcon = fromCatalog("full_heart");
export const HeartOutlineIcon = fromCatalog("empty_heart");
export const AddToPlaylistIcon = fromCatalog("add_to_playlist");
export const PlaylistIcon = fromCatalog("playlist");
export const AddToQueueIcon = fromCatalog("add_to_queue");
export const CheckIcon = fromCatalog("check");
export const MusicNoteIcon = fromCatalog("music_note");
export const NotificationIcon = fromCatalog("notification");
export const BellIcon = fromCatalog("notification");
export const CameraAIIcon = fromCatalog("camera_ai");
export const CameraIcon = fromCatalog("camera");
export const PencilLineIcon = fromCatalog("pencil_line");
export const TrashIcon = fromCatalog("trash");
export const UserIcon = fromCatalog("user");
export const UserGroupIcon = fromCatalog("user_group");
export const HamburgerMenuIcon = fromCatalog("hamburger_menu");
export const EllipsisIcon = fromCatalog("ellipsis");
export const MicrophoneIcon = fromCatalog("microphone");
export const CloseIcon = fromCatalog("close");

// ── Pendiente de migrar al catálogo ────────────────────────────────────────
// `LibraryIcon` quedó como placeholder de carátula (MiniPlayerBar,
// ExpandedPlayer, UpNext): no tiene equivalente exacto en shared/assets/icons.
// La tab "Playlists" usa `PlaylistIcon` (playlist.svg).
export const LibraryIcon = makeIcon("M12 3v10.55A4 4 0 1 0 14 17V7h4V3z");
