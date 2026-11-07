import { Pressable, Text } from "react-native";
import { FOLLOW_BUTTON_STYLES as styles } from "./FollowButton.styles";

/**
 * Botón seguir / dejar de seguir.
 *
 * Es presentacional: el estado y la mutación viven en `useFollow` (perfil) o
 * en la fila de búsqueda. Devuelve `null` cuando no corresponde mostrarlo
 * (sin sesión o el perfil es el propio).
 */
export default function FollowButton({
	canFollow,
	isFollowing,
	onToggle,
	pending = false,
	loading = false,
	compact = false,
	style,
}) {
	if (!canFollow) return null;

	const disabled = pending || loading;

	return (
		<Pressable
			onPress={onToggle}
			disabled={disabled}
			style={({ pressed }) => [
				styles.button,
				compact && styles.compactButton,
				isFollowing && styles.followingButton,
				pressed && styles.pressed,
				disabled && styles.disabled,
				style,
			]}
			accessibilityRole="button"
			accessibilityLabel={isFollowing ? "Dejar de seguir" : "Seguir"}
			accessibilityState={{
				selected: isFollowing,
				disabled,
				busy: disabled,
			}}
		>
			<Text style={[styles.label, compact && styles.compactLabel]}>
				{loading ? "Cargando…" : isFollowing ? "Siguiendo" : "Seguir"}
			</Text>
		</Pressable>
	);
}
