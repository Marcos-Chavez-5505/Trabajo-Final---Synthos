import { ActivityIndicator, FlatList, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePopularSongs } from "@synthos/shared";
import { ScreenHeader } from "../../components/ui/ScreenHeader/ScreenHeader";
import { EmptyState } from "../../components/ui/EmptyState/EmptyState";
import SongRow from "../../components/cards/SongRow/SongRow";
import { HeartIcon } from "../../components/icons";
import { colors } from "../../theme";
import { POPULAR_STYLES as styles } from "./Popular.styles";

export default function PopularScreen() {
	const insets = useSafeAreaInsets();
	const { data, error, songs, minimumFavorites, playSongs, addToQueue } =
		usePopularSongs();

	return (
		<View
			style={[
				styles.container,
				{ paddingTop: insets.top, paddingBottom: insets.bottom },
			]}
		>
			<ScreenHeader
				title="Populares"
				subtitle={`Las canciones que más personas distintas marcaron como favoritas esta semana. Entran las que reúnen al menos ${minimumFavorites} favoritos.`}
			>
				{data?.week ? (
					<Text style={styles.week}>{formatWeek(data.week)}</Text>
				) : null}
			</ScreenHeader>

			<FlatList
				data={songs}
				keyExtractor={(item) => String(item.id)}
				renderItem={({ item, index }) => (
					<SongRow
						song={item}
						label={`#${index + 1} · ${item.favoriteCount} ${
							item.favoriteCount === 1 ? "favorito" : "favoritos"
						}`}
						onPress={() => playSongs(songs, index)}
						onAddToQueue={addToQueue}
					/>
				)}
				contentContainerStyle={styles.content}
				showsVerticalScrollIndicator={false}
				ListEmptyComponent={
					<PopularEmptyState
						error={error}
						isLoading={!data}
						minimumFavorites={minimumFavorites}
					/>
				}
			/>
		</View>
	);
}

function PopularEmptyState({ error, isLoading, minimumFavorites }) {
	if (error) {
		return (
			<EmptyState title="No pudimos cargar los populares" message={error} />
		);
	}

	if (isLoading) {
		return (
			<View style={styles.emptyContainer}>
				<ActivityIndicator color={colors.textMuted} />
				<Text style={styles.emptyMessage}>Cargando populares…</Text>
			</View>
		);
	}

	return (
		<EmptyState
			icon={<HeartIcon size={40} color={colors.textMuted} />}
			title="Todavía no hay populares esta semana"
			message={`Una canción entra cuando al menos ${minimumFavorites} personas distintas la marcan como favorita dentro de la misma semana.`}
		/>
	);
}

function formatWeek({ from, to }) {
	const start = new Date(from);
	const end = new Date(new Date(to).getTime() - 24 * 60 * 60 * 1000);
	const format = new Intl.DateTimeFormat("es", {
		day: "numeric",
		month: "long",
		timeZone: "UTC",
	});

	return `Semana del ${format.format(start)} al ${format.format(end)}`;
}
