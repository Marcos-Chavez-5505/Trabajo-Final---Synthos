import { Text, View } from "react-native";
import { formatDuration, usePlayerTime } from "@synthos/shared";
import { TIME_ROW_STYLES as styles } from "./TimeRow.styles";

/**
 * Fila de tiempos del reproductor expandido. Es la única pieza (junto con
 * `WavyProgressBar`) que se suscribe a `usePlayerTime()`, así el tick de
 * `currentTime` no re-renderiza al `ExpandedPlayer` completo.
 */
export default function TimeRow() {
	const { currentTime, duration } = usePlayerTime();
	const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;

	return (
		<View style={styles.row}>
			<Text style={styles.time}>{formatDuration(currentTime)}</Text>
			<Text style={styles.time}>{formatDuration(safeDuration)}</Text>
		</View>
	);
}
