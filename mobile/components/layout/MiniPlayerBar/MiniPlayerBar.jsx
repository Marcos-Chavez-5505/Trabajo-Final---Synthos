import { Image, Pressable, Text, View } from "react-native";
import { usePlayer } from "@synthos/shared";
import { colors } from "../../../theme";
import { ChevronUpIcon, LibraryIcon, NextIcon, PauseIcon, PlayIcon } from "../../icons";
import ProgressBar from "../../player/ProgressBar/ProgressBar";
import { MINI_PLAYER_STYLES as styles } from "./MiniPlayerBar.styles";

/**
 * Mini reproductor mobile, apoyado sobre el BottomNav.
 *
 * Es presentacional: consume el PlayerContext global (el mismo estado que el
 * reproductor de desktop) y no guarda estado propio. En idle no se renderiza,
 * así no reserva espacio vacío sobre la navegación.
 */
export default function MiniPlayerBar() {
	const {
		song,
		isPlaying,
		isIdle,
		roomMode,
		playBlocked,
		hasQueue,
		togglePlay,
		next,
		seek,
		expand,
	} = usePlayer();

	if (isIdle) return null;

	const playDisabled = !hasQueue || (roomMode && playBlocked);
	const nextDisabled = !hasQueue || roomMode;

	return (
		<View style={styles.bar}>
			<View style={styles.row}>
				<Pressable
					onPress={() => expand()}
					style={({ pressed }) => [styles.info, pressed && styles.infoPressed]}
					accessibilityRole="button"
					accessibilityLabel="Expandir reproductor"
				>
					<View style={styles.cover}>
						{song?.coverUrl ? (
							<Image
								source={{ uri: song.coverUrl }}
								style={styles.coverImage}
								resizeMode="cover"
							/>
						) : (
							<LibraryIcon size={20} color={colors.textMuted} />
						)}
					</View>

					<View style={styles.titles}>
						<Text style={styles.title} numberOfLines={1}>
							{song?.title ?? "Nada reproduciendo"}
						</Text>
						<Text style={styles.artist} numberOfLines={1}>
							{song?.artist ?? "—"}
						</Text>
					</View>
				</Pressable>

				<Pressable
					onPress={togglePlay}
					disabled={playDisabled}
					style={({ pressed }) => [
						styles.button,
						styles.playButton,
						pressed && styles.infoPressed,
						playDisabled && styles.disabled,
					]}
					accessibilityRole="button"
					accessibilityLabel={isPlaying ? "Pausar" : "Reproducir"}
					accessibilityState={{ disabled: playDisabled }}
					hitSlop={8}
				>
					{isPlaying ? (
						<PauseIcon size={20} color={colors.surface} />
					) : (
						<PlayIcon size={20} color={colors.surface} />
					)}
				</Pressable>

				{/* En una sala la cola la manda el servidor: "siguiente" queda a la
				    vista pero inerte, igual que en la barra de desktop. */}
				<Pressable
					onPress={next}
					disabled={nextDisabled}
					style={({ pressed }) => [
						styles.button,
						styles.nextButton,
						pressed && styles.infoPressed,
						nextDisabled && styles.disabled,
					]}
					accessibilityRole="button"
					accessibilityLabel="Siguiente"
					accessibilityState={{ disabled: nextDisabled }}
					hitSlop={8}
				>
					<NextIcon size={20} color={colors.surface} />
				</Pressable>

				<Pressable
					onPress={() => expand()}
					style={({ pressed }) => [styles.expandButton, pressed && styles.infoPressed]}
					accessibilityRole="button"
					accessibilityLabel="Expandir reproductor"
					hitSlop={8}
				>
					<ChevronUpIcon size={20} color={colors.textMuted} />
				</Pressable>
			</View>

			{/* Seek por toque/arrastre; en una sala la posición la manda el servidor. */}
			<ProgressBar onSeek={seek} disabled={roomMode} style={styles.progress} />
		</View>
	);
}
