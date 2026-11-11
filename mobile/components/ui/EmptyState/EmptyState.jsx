import { Text, View } from "react-native";
import { EMPTY_STATE_STYLES as styles } from "./EmptyState.styles";

// icon es un icono ya renderizado
// Por ejemplo <EmptyState icon={<PlaylistIcon size={40} color={colors.textMuted} />} ... />
export function EmptyState({ icon, title, message, style }) {
	return (
		<View style={[styles.container, style]}>
			{icon ? icon : null}
			{title ? <Text style={styles.title}>{title}</Text> : null}
			{message ? <Text style={styles.message}>{message}</Text> : null}
		</View>
	);
}
