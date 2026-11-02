import { Image, Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePlayer } from "@synthos/shared";
import { colors, spacing } from "../../../theme";
import { ChevronDownIcon, LibraryIcon } from "../../icons";
import ActionControls from "../ActionControls/ActionControls";
import AddToPlaylistPanel from "../AddToPlaylistPanel/AddToPlaylistPanel";
import FavoriteButton from "../FavoriteButton/FavoriteButton";
import TransportControls from "../TransportControls/TransportControls";
import TimeRow from "../TimeRow/TimeRow";
import UpNext from "../UpNext/UpNext";
import WavyProgressBar from "../WavyProgressBar/WavyProgressBar";
import { EXPANDED_PLAYER_STYLES as styles } from "./ExpandedPlayer.styles";

const MAX_CONTENT_WIDTH = 600; // web: min(600px, 100% - 32px)

// Equivalente a CSS clamp(min, pct * alto de pantalla, max), como en la web.
const clampByHeight = (height, min, pct, max) => Math.min(Math.max(height * pct, min), max);

/**
 * Reproductor expandido (mobile). Overlay montado una sola vez: lee el estado
 * global del PlayerContext, así sobrevive a la navegación. Compone las mismas
 * piezas que la web (progreso, transporte, acciones, "A continuación").
 *
 * `isExpanded` lo abre el mini reproductor y lo cierra el botón de minimizar o
 * el gesto de volver.
 */
export default function ExpandedPlayer() {
	const { song, isExpanded, isPlaying, roomMode, seek, collapse } = usePlayer();

	// `usePlayer()` no expone un alias del origen; la web lee `song.source`.
	const sourceName = song?.source ?? null;

	const insets = useSafeAreaInsets();
	const { width, height } = useWindowDimensions();

	const contentWidth = Math.min(MAX_CONTENT_WIDTH, width - spacing.lg * 2);

	return (
		<Modal
			visible={isExpanded}
			animationType="slide"
			statusBarTranslucent
			onRequestClose={collapse}
		>
			<View style={styles.screen}>
				<View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
					<Pressable
						onPress={collapse}
						style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
						accessibilityRole="button"
						accessibilityLabel="Minimizar reproductor"
						hitSlop={8}
					>
						<ChevronDownIcon size={20} color={colors.lighter} />
					</Pressable>

					<Text style={styles.headerTitle}>Reproduciendo</Text>

					<View style={styles.headerSpacer} />
				</View>

				<ScrollView
					contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + spacing.xl }]}
					showsVerticalScrollIndicator={false}
				>
					<View style={[styles.content, { width: contentWidth }]}>
						<View style={styles.cover}>
							{song?.coverUrl ? (
								<Image
									source={{ uri: song.coverUrl }}
									style={styles.coverImage}
									resizeMode="cover"
									accessibilityLabel={`Carátula de ${song.title}`}
								/>
							) : (
								<LibraryIcon size={64} color={colors.lighter} />
							)}
						</View>

						<View style={styles.infos}>
							<Text style={styles.title} numberOfLines={1}>
								{song?.title ?? "Nada reproduciendo"}
							</Text>
							<Text style={styles.artist} numberOfLines={1}>
								{song?.artist ?? "—"}
							</Text>
						</View>

						{sourceName ? (
							<Text style={styles.playingFrom}>
								Reproduciendo desde: <Text style={styles.playingFromName}>{sourceName}</Text>
							</Text>
						) : null}

						<View style={{ paddingTop: clampByHeight(height, 12, 0.03, 28) }}>
							<View style={styles.progress}>
								<WavyProgressBar
									onSeek={seek}
									isPlaying={isPlaying}
									disabled={roomMode}
								/>
							</View>

							<TimeRow />
						</View>

						<View style={{ marginTop: clampByHeight(height, 12, 0.04, 40) }}>
							<TransportControls />
						</View>

						<View style={{ marginVertical: clampByHeight(height, 12, 0.04, 32) }}>
							<ActionControls
								songId={song?.id}
								favoriteSlot={<FavoriteButton songId={song?.id} />}
								addToPlaylistSlot={<AddToPlaylistPanel songId={song?.id} />}
							/>
						</View>

						<UpNext />
					</View>
				</ScrollView>
			</View>
		</Modal>
	);
}