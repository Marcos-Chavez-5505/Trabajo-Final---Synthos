import { useCallback, useEffect, useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useHomeSongs } from "@synthos/shared";
import MediaCard from "../../components/cards/MediaCard/MediaCard";
import TopBar from "../../components/layout/TopBar/TopBar";
import { showActionError } from "../../lib/toastMessages";
import { HOME_STYLES } from "./Home.styles";

export default function HomeScreen() {
	const [retryVersion, setRetryVersion] = useState(0);
	const handleRetry = useCallback(() => setRetryVersion((prev) => prev + 1), []);

	return <HomeScreenContent key={retryVersion} onRetry={handleRetry} />;
}

function HomeScreenContent({ onRetry }) {
	const { songs, error, playSongs, addToQueue } = useHomeSongs();

	useEffect(() => {
		if (error) showActionError(error, "home:songs:load", { retry: onRetry });
	}, [error, onRetry]);

	return (
		<View style={HOME_STYLES.container}>
			<ScrollView showsVerticalScrollIndicator={false}>
				<TopBar />

				<Text style={HOME_STYLES.sectionTitle}>Novedades</Text>

				{error ? (
					<Text style={HOME_STYLES.errorText}>
						No hay novedades por ahora.
					</Text>
				) : (
					<ScrollView
						horizontal
						showsHorizontalScrollIndicator={false}
						contentContainerStyle={HOME_STYLES.carouselContent}
						style={HOME_STYLES.carousel}
					>
						{songs.map((song, index) => (
							<MediaCard
								key={song.id}
								title={song.title}
								artist={song.artist}
								label={song.genre}
								coverUrl={song.coverUrl}
								onPlay={() => playSongs(songs, index)}
								onAddToQueue={() => addToQueue(song)}
							/>
						))}
					</ScrollView>
				)}
			</ScrollView>

			<StatusBar style="light" />
		</View>
	);
}
