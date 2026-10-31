import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import {
	AuthProvider,
	PlayerProvider,
	useAuth,
	useHomeSongs,
} from "@synthos/shared";
import ComponentTest from "./ComponentTest";
import { colors, fontSize, fontWeight } from "../../theme";
import MediaCard from "../../components/cards/mediaCard/mediaCard";

const dummyMotor = {
	load: () => {},
	play: () => Promise.resolve(),
	pause: () => {},
	seek: () => {},
	getCurrentTime: () => 0,
	getDuration: () => 0,
	hasSource: () => false,
	setMuted: () => {},
	onTimeUpdate: () => () => {},
	onLoadedMetadata: () => () => {},
	onEnded: () => () => {},
	element: null,
	src: "",
};

function MediaCardTestContent() {
	const { user, loading: authLoading } = useAuth();
	const { songs, error, loading: songsLoading } = useHomeSongs();

	console.log("[MEDIACARD_TEST]", {
		authLoading,
		songsLoading,
		songsCount: songs?.length,
	});

	if (songsLoading && !songs?.length) {
		return (
			<ComponentTest>
				<ActivityIndicator color={colors.textPrimary} />
			</ComponentTest>
		);
	}

	return (
		<ComponentTest>
			<Text
				style={{
					color: colors.textPrimary,
					fontSize: fontSize.xl,
					fontWeight: fontWeight.bold,
					marginBottom: 24,
				}}
			>
				{user?.username ? `Hola, ${user.username}` : "Sin sesión"}
			</Text>

			{error ? (
				<Text style={{ color: colors.textPrimary, opacity: 0.7 }}>
					No pudimos cargar las novedades.
				</Text>
			) : (
				<ScrollView
					horizontal
					showsHorizontalScrollIndicator={false}
					contentContainerStyle={{ gap: 16, paddingHorizontal: 8 }}
				>
					{songs?.map((song) => (
						<View key={song.id} style={{ width: 180 }}>
							<MediaCard
								title={song.title}
								artist={song.artist}
								label={song.genre}
								coverUrl={song.coverUrl}
								onPlay={() => {}}
								onAddToQueue={() => {}}
							/>
						</View>
					))}
				</ScrollView>
			)}
		</ComponentTest>
	);
}

export default function MediaCardTest() {
	return (
		<AuthProvider>
			<PlayerProvider motor={dummyMotor}>
				<MediaCardTestContent />
			</PlayerProvider>
		</AuthProvider>
	);
}
