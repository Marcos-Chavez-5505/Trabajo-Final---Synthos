import {
	ActivityIndicator,
	Image,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import { usePlayer, useSearchSongs } from "@synthos/shared";
import { colors } from "../../theme";
import SearchTabs from "./SearchTabs";
import { SEARCH_TABS } from "./constants";
import Pagination from "../../components/ui/Pagination/Pagination";
import { useState } from "react";

export default function SearchSongs({ query, onChangeTab }) {
	const { playSongs, addToQueue } = usePlayer();
	const [page, setPage] = useState(1);
	const { isLoading, error, results } = useSearchSongs(query || "", page);

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
			) : error ? (
				<Text style={{ color: colors.textPrimary, opacity: 0.7 }}>
					Error al buscar
				</Text>
			) : (
				<ScrollView
					showsVerticalScrollIndicator={false}
					contentContainerStyle={{ gap: 10, paddingBottom: 120 }}
				>
					{results.items?.length ? (
						results.items.map((song, index) => (
							<Pressable
								key={song.id}
								onPress={() => playSongs(results.items, index)}
								style={{
									flexDirection: "row",
									gap: 12,
									backgroundColor: colors.surfaceLight,
									borderRadius: 8,
									padding: 10,
									alignItems: "center",
								}}
							>
								{song.coverUrl ? (
									<Image
										source={{ uri: song.coverUrl }}
										style={{ width: 56, height: 56, borderRadius: 6 }}
									/>
								) : (
									<View
										style={{
											width: 56,
											height: 56,
											borderRadius: 6,
											backgroundColor: colors.border,
											alignItems: "center",
											justifyContent: "center",
										}}
									>
										<Text style={{ color: colors.textPrimary }}>♪</Text>
									</View>
								)}
								<View style={{ flex: 1 }}>
									<Text style={{ color: colors.textPrimary }} numberOfLines={1}>
										{song.title}
									</Text>
									<Text
										style={{ color: colors.textPrimary, opacity: 0.7 }}
										numberOfLines={1}
									>
										{song.artist}
									</Text>
								</View>
								<Pressable
									onPress={(e) => {
										e.stopPropagation();
										addToQueue(song);
									}}
									style={{
										paddingHorizontal: 12,
										paddingVertical: 6,
										backgroundColor: colors.primary,
										borderRadius: 16,
									}}
								>
									<Text style={{ color: colors.textPrimary }}>+</Text>
								</Pressable>
							</Pressable>
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
