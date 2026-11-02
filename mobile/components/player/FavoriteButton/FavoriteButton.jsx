import { useState } from "react";
import { Pressable } from "react-native";
import { useFavorites, usePlayer } from "@synthos/shared";
import { colors } from "../../../theme";
import { HeartIcon, HeartOutlineIcon } from "../../icons";
import { FAVORITE_BUTTON_STYLES as styles } from "./FavoriteButton.styles";

/**
 * Corazón de favorito de la canción actual (port de `FavoriteButton` web).
 *
 * Presenta el estado de `useFavorites` y alterna el favorito; si se desmarca y
 * la cola actual es "Mis Favoritos", la saca de la cola con
 * `removeFromFavoritesQueue`, igual que la web. El segmento que lo contiene
 * (ActionControls) pinta el fondo cuando está activo.
 */
export default function FavoriteButton({ songId }) {
	const { isFavorite, toggleFavorite } = useFavorites();
	const { removeFromFavoritesQueue } = usePlayer();
	const [pending, setPending] = useState(false);

	if (!songId) return null;

	const active = isFavorite(songId);
	const label = active ? "Quitar de favoritos" : "Marcar como favorita";

	async function handlePress() {
		// El toggle no debe correr dos veces seguidas y anularse.
		if (pending) return;

		setPending(true);

		try {
			const nowFavorite = await toggleFavorite(songId);

			if (!nowFavorite) removeFromFavoritesQueue(songId);
		} finally {
			setPending(false);
		}
	}

	return (
		<Pressable
			onPress={handlePress}
			disabled={pending}
			style={({ pressed }) => [
				styles.button,
				pressed && styles.pressed,
				pending && styles.disabled,
			]}
			accessibilityRole="button"
			accessibilityLabel={label}
			accessibilityState={{ selected: active, disabled: pending }}
		>
			{active ? (
				<HeartIcon size={20} color={colors.lighter} />
			) : (
				<HeartOutlineIcon size={20} color={colors.lighter} />
			)}
		</Pressable>
	);
}
