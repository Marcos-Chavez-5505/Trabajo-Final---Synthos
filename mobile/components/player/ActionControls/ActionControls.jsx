import { Pressable, View } from "react-native";
import { useFavorites, usePlayer } from "@synthos/shared";
import { colors } from "../../../theme";
import { RepeatIcon, RepeatOneIcon, ShuffleIcon } from "../../icons";
import { ACTION_CONTROLS_STYLES as styles } from "./ActionControls.styles";

const REPEAT_LABELS = {
	off: "Repetir desactivado",
	track: "Repetir canción",
	list: "Repetir lista",
};

/**
 * Acciones del reproductor expandido dentro de una píldora, igual que la web:
 * aleatorio, repetir, favorito y añadir a playlist, en segmentos iguales.
 *
 * Favorito y playlist entran por slots (`favoriteSlot`, `addToPlaylistSlot`)
 * porque su lógica vive en componentes propios, como en la web. El slot debe
 * ocupar todo el segmento (`flex: 1`). Si un slot no se pasa, ese segmento no
 * se muestra.
 */
export default function ActionControls({ songId, favoriteSlot, addToPlaylistSlot }) {
	const { shuffle, repeat, roomMode, toggleShuffle, cycleRepeat, hasQueue } = usePlayer();
	const { isFavorite } = useFavorites();

	const inertDisabled = !hasQueue || roomMode;
	const shuffleOn = shuffle && !roomMode;
	const repeatOn = repeat !== "off" && !roomMode;
	const favorite = isFavorite(songId);
	const RepeatGlyph = repeat === "track" ? RepeatOneIcon : RepeatIcon;

	return (
		<View style={styles.pill}>
			{/* En modo sala la cola la manda el servidor: quedan a la vista pero inertes. */}
			<View style={[styles.segment, shuffleOn && styles.segmentActive, inertDisabled && styles.disabled]}>
				<Pressable
					style={({ pressed }) => [styles.hit, pressed && styles.pressed]}
					onPress={toggleShuffle}
					disabled={inertDisabled}
					accessibilityRole="button"
					accessibilityLabel="Aleatorio"
					accessibilityState={{ selected: shuffle, disabled: inertDisabled }}
				>
					<View style={!shuffleOn && styles.iconIdle}>
						<ShuffleIcon size={20} color={colors.lighter} />
					</View>
				</Pressable>
			</View>

			<View style={[styles.segment, repeatOn && styles.segmentActive, inertDisabled && styles.disabled]}>
				<Pressable
					style={({ pressed }) => [styles.hit, pressed && styles.pressed]}
					onPress={cycleRepeat}
					disabled={inertDisabled}
					accessibilityRole="button"
					accessibilityLabel={REPEAT_LABELS[repeat]}
					accessibilityState={{ selected: repeat !== "off", disabled: inertDisabled }}
				>
					<View style={!repeatOn && styles.iconIdle}>
						<RepeatGlyph size={20} color={colors.lighter} />
					</View>
				</Pressable>
			</View>

			{favoriteSlot ? (
				<View style={[styles.segment, favorite && styles.segmentActive]}>{favoriteSlot}</View>
			) : null}

			{addToPlaylistSlot ? <View style={styles.segment}>{addToPlaylistSlot}</View> : null}
		</View>
	);
}
