import { ScrollView, Text, View, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { useAuth, useHomeSongs } from "@synthos/shared";
import MediaCard from "../../components/cards/MediaCard/MediaCard";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "../../components/ui/Avatar/Avatar";
import { HOME_STYLES } from "./Home.styles";

export default function HomeScreen() {
	const navigation = useNavigation();
	const { user } = useAuth();
	const { songs, error, playSongs, addToQueue } = useHomeSongs();

	return (
		<View style={HOME_STYLES.container}>
			<ScrollView showsVerticalScrollIndicator={false}>
				<View style={HOME_STYLES.header}>
					<Text style={HOME_STYLES.greeting}>Hola, {user?.username}</Text>
					<View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
						<Pressable onPress={() => navigation.navigate("Profile")}>
							<Avatar size={48}>
								<AvatarImage uri={user?.avatarUrl} name={user?.username} />
								<AvatarFallback name={user?.username} />
							</Avatar>
						</Pressable>
					</View>
				</View>

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
