import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
	ActivityIndicator,
	FlatList,
	Pressable,
	Text,
	View,
} from "react-native";
import { useArtistDetail } from "@synthos/shared";
import { ARTIST_DETAIL_STYLES as styles } from "./ArtistDetail.styles";
import { colors } from "../../../theme";
import { AlbumIcon, ArrowLeftIcon } from "../../../components/icons";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "../../../components/ui/Avatar/Avatar";
import { EmptyState } from "../../../components/ui/EmptyState/EmptyState";
import MiniAlbumCard from "../../../components/cards/MiniAlbumCard/MiniAlbumCard";

export default function ArtistDetailPage() {
	const route = useRoute();
	const navigation = useNavigation();
	const insets = useSafeAreaInsets();

	const { id } = route.params ?? {};
	const { artist, error } = useArtistDetail(id);

	if (error) {
		return (
			<View style={[styles.container, { paddingTop: insets.top }]}>
				<View style={styles.content}>
					<View style={styles.errorPill}>
						<Text style={styles.errorText}>{error}</Text>
					</View>
					<Pressable
						onPress={() => navigation.goBack()}
						style={({ pressed }) => [
							styles.backButton,
							pressed && styles.pressed,
						]}
					>
						<Text style={styles.backButtonText}>Volver a artistas</Text>
					</Pressable>
				</View>
			</View>
		);
	}

	if (!artist) {
		return (
			<View style={[styles.container, { paddingTop: insets.top }]}>
				<View style={styles.loadingContainer}>
					<ActivityIndicator color={colors.textMuted} />
					<Text style={styles.loadingText}>Cargando artista…</Text>
				</View>
			</View>
		);
	}

	const albumsLabel = `${artist.albumsCount} ${
		artist.albumsCount === 1 ? "álbum" : "álbumes"
	}`;
	const songsLabel = `${artist.songsCount} ${
		artist.songsCount === 1 ? "canción" : "canciones"
	}`;

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

			<View style={styles.hero}>
				<Avatar size={112}>
					<AvatarImage uri={artist.pictureUrl} name={artist.name} />
					<AvatarFallback name={artist.name} />
				</Avatar>

				<View style={styles.heroText}>
					<Text style={styles.kicker}>Artista</Text>
					<Text style={styles.name} numberOfLines={2}>
						{artist.name}
					</Text>
					<Text style={styles.meta}>
						{albumsLabel} · {songsLabel}
					</Text>
				</View>
			</View>

			<Text style={styles.sectionTitle}>Álbumes</Text>
		</View>
	);

	if (artist.albums.length === 0) {
		return (
			<View style={[styles.container, { paddingTop: insets.top }]}>
				<View style={styles.content}>
					{header}
					<EmptyState
						icon={<AlbumIcon size={40} color={colors.textMuted} />}
						message="Este artista todavía no tiene álbumes cargados."
					/>
				</View>
			</View>
		);
	}

	return (
		<View style={[styles.container, { paddingTop: insets.top }]}>
			<FlatList
				data={artist.albums}
				numColumns={2}
				keyExtractor={(item) => String(item.id)}
				ListHeaderComponent={header}
				columnWrapperStyle={styles.column}
				contentContainerStyle={[
					styles.content,
					{ paddingBottom: insets.bottom + 32 },
				]}
				showsVerticalScrollIndicator={false}
				renderItem={({ item: album }) => (
					<View style={styles.itemWrapper}>
						<MiniAlbumCard album={album} />
					</View>
				)}
			/>
		</View>
	);
}
