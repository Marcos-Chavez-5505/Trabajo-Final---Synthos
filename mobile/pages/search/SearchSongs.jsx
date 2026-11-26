import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { usePlayer, useSearchSongs } from "@synthos/shared";
import { colors } from "../../theme";
import SongRow from "../../components/cards/SongRow/SongRow";
import Pagination from "../../components/ui/Pagination/Pagination";
import SearchTabs from "./SearchTabs";
import { SEARCH_TABS } from "./constants";
import { showActionError } from "../../lib/toastMessages";

export default function SearchSongs(props) {
	const [retryKey, setRetryKey] = useState(0);
	const retry = useCallback(() => setRetryKey((value) => value + 1), []);

	return <SearchSongsContent key={retryKey} {...props} retry={retry} />;
}

function SearchSongsContent({ query, onChangeTab, retry }) {
	const { playSongs, addToQueue } = usePlayer();
	const [page, setPage] = useState(1);
	const { isLoading, error, results } = useSearchSongs(query || "", page);

	useEffect(() => {
		if (error) showActionError(error, "search:songs", { retry });
	}, [error, retry]);

	const goToPage = (nextPage) => {
		if (nextPage < 1 || nextPage > results.totalPages) return;
		setPage(nextPage);
	};

	return (
		<View style={{ flex: 1 }}>
			<SearchTabs active={SEARCH_TABS.SONGS} onChange={onChangeTab} />
			{query ? (
				<Text
					style={{ color: colors.textPrimary, opacity: 0.7, marginBottom: 16 }}
				>
					{`Resultados para "${query}"`}
				</Text>
			) : null}

			{!query ? (
				<Text style={{ color: colors.textPrimary, opacity: 0.5 }}>
					Sin búsqueda
				</Text>
			) : isLoading ? (
				<ActivityIndicator
					color={colors.textPrimary}
					style={{ marginTop: 24 }}
				/>
			) : (
				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{ gap: 10, paddingBottom: 120 }}
				>
					{results.items?.length ? (
						results.items.map((song, index) => (
							<SongRow
								key={song.id}
								song={song}
								onPress={() => playSongs(results.items, index)}
								onAddToQueue={addToQueue}
							/>
						))
					) : (
						<Text style={{ color: colors.textPrimary, opacity: 0.5 }}>
							Sin resultados
						</Text>
					)}

					{results.totalPages > 1 ? (
						<Pagination
							page={results.page}
							totalPages={results.totalPages}
							onPageChange={goToPage}
						/>
					) : null}
				</ScrollView>
			)}
		</View>
	);
}
