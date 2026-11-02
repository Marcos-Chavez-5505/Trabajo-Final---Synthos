import { ActivityIndicator, Image, ScrollView, Text, View } from "react-native";
import { useSearchAlbums } from "@synthos/shared";
import { colors } from "../../theme";
import SearchTabs from "./SearchTabs";
import { SEARCH_TABS } from "./constants";

export default function SearchAlbums({ query, onChangeTab }) {
	const { isLoading, error, results } = useSearchAlbums(query || "", 1);

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
						results.items.map((album) => (
							<View
								key={album.id}
								style={{
									flexDirection: "row",
									gap: 12,
									backgroundColor: colors.surfaceLight,
									borderRadius: 8,
									padding: 10,
									alignItems: "center",
								}}
							>
								{album.coverUrl ? (
									<Image
										source={{ uri: album.coverUrl }}
										style={{ width: 56, height: 56, borderRadius: 6 }}
									/>
								) : (
									<View
										style={{
											width: 56,
											height: 56,
											borderRadius: 6,
											backgroundColor: colors.border,
										}}
									/>
								)}
								<View style={{ flex: 1 }}>
									<Text style={{ color: colors.textPrimary }} numberOfLines={1}>
										{album.title}
									</Text>
									<Text
										style={{ color: colors.textPrimary, opacity: 0.7 }}
										numberOfLines={1}
									>
										{album.artistName}
									</Text>
								</View>
							</View>
						))
					) : (
						<Text style={{ color: colors.textPrimary, opacity: 0.5 }}>
							Sin resultados
						</Text>
					)}
				</ScrollView>
			)}
		</View>
	);
}
