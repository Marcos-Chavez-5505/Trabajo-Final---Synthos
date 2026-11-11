import { ScrollView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useHomeSongs } from "@synthos/shared";
import MediaCard from "../../components/cards/MediaCard/MediaCard";
import TopBar from "../../components/layout/TopBar/TopBar";
import { HOME_STYLES } from "./Home.styles";

export default function HomeScreen() {
	const { songs, error, playSongs, addToQueue } = useHomeSongs();

	return (
		<View style={HOME_STYLES.container}>
			<ScrollView showsVerticalScrollIndicator={false}>
				<TopBar />

				<Text style={HOME_STYLES.sectionTitle}>Novedades</Text>

				{error ? (
					<Text style={HOME_STYLES.errorText}>
						No pudimos cargar las novedades.
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
