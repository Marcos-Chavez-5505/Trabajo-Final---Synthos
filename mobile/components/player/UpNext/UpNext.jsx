import { Image, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { usePlayer } from "@synthos/shared";
import { colors } from "../../../theme";
import { LibraryIcon } from "../../icons";
import { UP_NEXT_STYLES as styles } from "./UpNext.styles";

/**
 * Lista "A continuación" del reproductor expandido (port de UpNext web).
 *
 * Muestra lo que viene después de la canción actual y marca con una píldora las
 * encoladas por el usuario. Tocar una fila salta a esa posición (`jumpTo`). En
 * modo sala se oculta: la cola la maneja el servidor.
 */
export default function UpNext() {
	const { queue, index, roomMode, jumpTo } = usePlayer();
	const { height } = useWindowDimensions();

	if (roomMode) return null;

	const upcoming = queue.slice(index + 1);

	if (upcoming.length === 0) return null;

	return (
		<View style={[styles.section, { paddingTop: Math.min(Math.max(height * 0.02, 8), 20) }]}>
			<View style={styles.header}>
				<Text style={styles.heading}>A continuación</Text>
				<Text style={styles.count}>
					{upcoming.length} {upcoming.length === 1 ? "canción" : "canciones"}
				</Text>
			</View>

			{/* Web: max-h-[38vh] con scroll propio. */}
			<ScrollView style={[styles.list, { maxHeight: height * 0.38 }]} nestedScrollEnabled>
				{upcoming.map((song, offset) => {
					const position = index + 1 + offset;

					return (
						<Pressable
							key={`${song.id}-${position}`}
							onPress={() => jumpTo(position)}
							style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
							accessibilityRole="button"
							accessibilityLabel={`Reproducir ${song.title}`}
						>
							<View style={styles.cover}>
								{song.coverUrl ? (
									<Image
										source={{ uri: song.coverUrl }}
										style={styles.coverImage}
										resizeMode="cover"
									/>
								) : (
									<View style={styles.coverPlaceholder}>
										<LibraryIcon size={16} color={colors.surface} />
									</View>
								)}
							</View>

							<View style={styles.titles}>
								<Text style={styles.title} numberOfLines={1}>
									{song.title}
								</Text>
								<Text style={styles.artist} numberOfLines={1}>
									{song.artist}
								</Text>
							</View>

							{song.queued ? (
								<View style={styles.queuedPill}>
									<Text style={styles.queuedText}>En cola</Text>
								</View>
							) : null}
						</Pressable>
					);
				})}
			</ScrollView>
		</View>
	);
}
