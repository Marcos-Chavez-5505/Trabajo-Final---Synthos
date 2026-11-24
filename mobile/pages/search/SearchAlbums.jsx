import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useSearchAlbums } from "@synthos/shared";
import { colors } from "../../theme";
import AlbumRow from "../../components/cards/AlbumRow/AlbumRow";
import Pagination from "../../components/ui/Pagination/Pagination";
import SearchTabs from "./SearchTabs";
import { SEARCH_TABS } from "./constants";
import { showActionError } from "../../lib/toastMessages";

export default function SearchAlbums(props) {
	const [retryKey, setRetryKey] = useState(0);
	const retry = useCallback(() => setRetryKey((value) => value + 1), []);

	return <SearchAlbumsContent key={retryKey} {...props} retry={retry} />;
}

function SearchAlbumsContent({ query, onChangeTab, retry }) {
	const [page, setPage] = useState(1);
	const { isLoading, error, results } = useSearchAlbums(query || "", page);

	useEffect(() => {
		if (error) showActionError(error, "search:albums", { retry });
	}, [error, retry]);

	const goToPage = (nextPage) => {
		if (nextPage < 1 || nextPage > results.totalPages) return;
		setPage(nextPage);
	};

	return (
		<View style={{ flex: 1 }}>
			<SearchTabs active={SEARCH_TABS.ALBUMS} onChange={onChangeTab} />
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
						results.items.map((album) => (
							<AlbumRow key={album.id} album={album} />
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
