import { useNavigation, useRoute } from "@react-navigation/native";
import { useAlbumDetail, usePlayer } from "@synthos/shared";
import {
	ActivityIndicator,
	FlatList,
	Image,
	Pressable,
	Text,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ALBUM_DETAIL_STYLES as styles } from "./AlbumDetail.styles";
import { colors } from "../../../theme";
import {
	ArrowLeftIcon,
	MusicNoteIcon,
	PlayIcon,
} from "../../../components/icons";
import { EmptyState } from "../../../components/ui/EmptyState/EmptyState";

export default function AlbumDetailPage() {
	const route = useRoute();
	const navigation = useNavigation();
	const insets = useSafeAreaInsets();
	const { playSongs } = usePlayer();
	const { id } = route.params ?? {};
	const { album, songs, error, loading, resolving, retry } = useAlbumDetail(id);
	console.log(songs);
	if (loading) {
		return (
			<View style={[styles.container, { paddingTop: insets.top }]}>
				<View style={styles.loadingContainer}>
					<ActivityIndicator color={colors.textMuted} />
					<Text style={styles.loadingText}>Cargando álbum…</Text>
				</View>
			</View>
		);
	}

	if (error) {
		return (
			<View style={[styles.container, { paddingTop: insets.top }]}>
				<View style={styles.content}>
					<View style={styles.errorPill}>
						<Text style={styles.errorText}>{error}</Text>
					</View>
					<Pressable
						onPress={retry}
						style={({ pressed }) => [
							styles.backButton,
							pressed && styles.pressed,
						]}
						accessibilityRole="button"
					>
						<Text style={styles.backButtonText}>Reintentar</Text>
					</Pressable>
				</View>
			</View>
		);
	}

	if (!album) {
		return (
			<View style={[styles.container, { paddingTop: insets.top }]}>
				<View style={styles.content}>
					<Text style={styles.emptyTitle}>No encontramos ese álbum</Text>
					<Pressable
						onPress={() => navigation.goBack()}
						style={({ pressed }) => [
							styles.backButton,
							pressed && styles.pressed,
						]}
						accessibilityRole="button"
					>
						<Text style={styles.backButtonText}>Volver</Text>
					</Pressable>
				</View>
			</View>
		);
	}

	const songsLabel = `${songs.length} ${
		songs.length === 1 ? "canción" : "canciones"
	}`;

	const handlePlay = () => {
		if (songs.length === 0) return;
		playSongs(songs, 0, { albumId: album.id });
	};

	const header = (
		<View>
			<View style={styles.topBar}>
				<Pressable
					onPress={() => navigation.goBack()}
					style={({ pressed }) => [
						styles.iconButton,
						pressed && styles.pressed,
					]}
					accessibilityRole="button"
					accessibilityLabel="Volver"
				>
					<ArrowLeftIcon size={22} color={colors.textPrimary} />
				</Pressable>
			</View>

			<View style={styles.coverWrapper}>
				{album.coverUrl ? (
					<Image
						source={{ uri: album.coverUrl }}
						style={styles.cover}
						resizeMode="cover"
					/>
				) : (
					<View style={styles.coverFallback}>
						<MusicNoteIcon size={64} color={colors.textMuted} />
					</View>
				)}
			</View>

			<Text style={styles.kicker}>Álbum</Text>
			<Text style={styles.name} numberOfLines={3}>
				{album.name}
			</Text>

			{album.artistName ? (
				<Pressable
					onPress={() =>
						album.artistId
							? navigation.navigate("ArtistDetail", {
									id: album.artistId,
								})
							: null
					}
					disabled={!album.artistId}
					style={({ pressed }) => [
						styles.artistRow,
						pressed && album.artistId && styles.pressed,
					]}
					accessibilityRole="button"
				>
					<Text style={styles.artistName}>{album.artistName}</Text>
				</Pressable>
			) : null}

			<Text style={styles.meta}>
				{album.releaseYear ? `${album.releaseYear} · ` : ""}
				{songsLabel}
			</Text>

			<Pressable
				onPress={handlePlay}
				disabled={songs.length === 0}
				style={({ pressed }) => [
					styles.playButton,
					songs.length === 0 && styles.disabled,
					pressed && styles.pressed,
				]}
				accessibilityRole="button"
				accessibilityLabel={`Reproducir ${album.name}`}
			>
				<PlayIcon size={22} color={colors.lighter} />
				<Text style={styles.playButtonText}>Reproducir</Text>
			</Pressable>
		</View>
	);

	if (resolving) {
		return (
			<View style={[styles.container, { paddingTop: insets.top }]}>
				<View style={styles.content}>
					{header}
					<View style={styles.loadingContainer}>
						<ActivityIndicator color={colors.textMuted} />
						<Text style={styles.loadingText}>Buscando canciones…</Text>
					</View>
				</View>
			</View>
		);
	}

	if (songs.length === 0) {
		return (
			<View style={[styles.container, { paddingTop: insets.top }]}>
				<View style={styles.content}>
					{header}
					<EmptyState
						icon={<MusicNoteIcon size={40} color={colors.textMuted} />}
						title="Este álbum todavía no tiene canciones"
						message="Cuando se carguen las pistas, aparecen acá."
					/>
				</View>
			</View>
		);
	}

	return (
		<View style={[styles.container, { paddingTop: insets.top }]}>
			<FlatList
				data={songs}
				keyExtractor={(item) => String(item.id)}
				ListHeaderComponent={header}
				contentContainerStyle={[
					styles.content,
					{ paddingBottom: insets.bottom + 32 },
				]}
				showsVerticalScrollIndicator={false}
				renderItem={({ item, index }) => (
					<Pressable
						onPress={() => playSongs(songs, index, { albumId: album.id })}
						style={({ pressed }) => [
							styles.trackRow,
							pressed && styles.pressed,
						]}
						accessibilityRole="button"
					>
						<Text style={styles.trackNumber}>
							{String(index + 1).padStart(2, "0")}
						</Text>

						<View style={styles.trackText}>
							<Text style={styles.trackTitle} numberOfLines={1}>
								{item.title}
							</Text>
							{item.artistName && item.artistName !== album.artistName ? (
								<Text style={styles.trackArtist} numberOfLines={1}>
									{item.artistName}
								</Text>
							) : null}
						</View>

						{item.duration ? (
							<Text style={styles.trackDuration}>
								{formatDuration(item.duration)}
							</Text>
						) : null}
					</Pressable>
				)}
			/>
		</View>
	);
}

function formatDuration(seconds) {
	if (!Number.isFinite(seconds)) return "";
	const total = Math.round(seconds);
	const m = Math.floor(total / 60);
	const s = total % 60;
	return `${m}:${String(s).padStart(2, "0")}`;
}
