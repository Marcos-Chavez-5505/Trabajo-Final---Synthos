import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
	addSongToPlaylist,
	removeSongFromPlaylist,
	useAuth,
	useSongPlaylists,
} from "@synthos/shared";
import { colors, spacing } from "../../../theme";
import { AddToPlaylistIcon, PlaylistIcon } from "../../icons";
import { ADD_TO_PLAYLIST_STYLES as styles } from "./AddToPlaylistPanel.styles";

/**
 * "Agregar a playlist" del reproductor expandido (port de `AddToPlaylistPanel`
 * web, como bottom sheet). Usa `useSongPlaylists` para listar y marcar
 * pertenencia; cada fila alterna add/remove igual que los checkboxes web.
 *
 * "Mis Favoritos" se excluye: se marca con el corazón del reproductor.
 */
export default function AddToPlaylistPanel({ songId }) {
	const { user } = useAuth();
	const userId = user?.id ?? null;
	const { playlists: allPlaylists, loading, error, contains, inAnyPlaylist } =
		useSongPlaylists(songId);
	const [open, setOpen] = useState(false);
	const [pendingId, setPendingId] = useState(null);
	const insets = useSafeAreaInsets();

	if (!songId) return null;

	const playlists = allPlaylists.filter((playlist) => !playlist.isFavorites);
	const close = () => setOpen(false);

	async function handleToggle(playlist) {
		// El toggle no debe correr dos veces seguidas y anularse.
		if (pendingId || !userId) return;

		setPendingId(playlist.id);

		try {
			if (contains(playlist)) {
				await removeSongFromPlaylist(userId, playlist.id, songId);
			} else {
				await addSongToPlaylist(userId, playlist.id, songId);
			}
		} finally {
			setPendingId(null);
		}
	}

	return (
		<>
			<Pressable
				onPress={() => setOpen(true)}
				style={({ pressed }) => [
					styles.trigger,
					(open || inAnyPlaylist) && styles.triggerActive,
					pressed && styles.pressed,
				]}
				accessibilityRole="button"
				accessibilityLabel="Agregar a playlist"
				accessibilityState={{ selected: open || inAnyPlaylist }}
			>
				<AddToPlaylistIcon size={20} color={colors.lighter} />
			</Pressable>

			<Modal
				visible={open}
				transparent
				animationType="slide"
				statusBarTranslucent
				onRequestClose={close}
			>
				<View style={styles.overlay}>
					<Pressable
						style={styles.backdrop}
						onPress={close}
						accessibilityRole="button"
						accessibilityLabel="Cerrar"
					/>

					<View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.lg }]}>
						<Text style={styles.title}>Agregar a playlist</Text>

						{loading ? (
							<Text style={styles.message}>Cargando…</Text>
						) : error ? (
							<Text style={styles.error}>{error}</Text>
						) : playlists.length === 0 ? (
							<Text style={styles.message}>Todavía no tenés playlists.</Text>
						) : (
							<ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
								{playlists.map((playlist) => {
									const already = contains(playlist);
									const pending = pendingId === playlist.id;

									return (
										<Pressable
											key={playlist.id}
											onPress={() => handleToggle(playlist)}
											disabled={pending}
											style={({ pressed }) => [
												styles.row,
												already && styles.rowActive,
												pressed && styles.rowPressed,
												pending && styles.rowDisabled,
											]}
											accessibilityRole="checkbox"
											accessibilityLabel={playlist.name}
											accessibilityState={{ checked: already, disabled: pending }}
										>
											<PlaylistIcon size={18} color={colors.textPrimary} />

											<Text style={styles.name} numberOfLines={1}>
												{playlist.name}
											</Text>

											{already ? <Text style={styles.check}>✓</Text> : null}
										</Pressable>
									);
								})}
							</ScrollView>
						)}
					</View>
				</View>
			</Modal>
		</>
	);
}
