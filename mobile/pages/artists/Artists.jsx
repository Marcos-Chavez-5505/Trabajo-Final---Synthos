import { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	Pressable,
	Text,
	TextInput,
	View,
} from "react-native";
import { useArtists } from "@synthos/shared";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
	SearchIcon,
	MicrophoneIcon,
	CloseIcon,
} from "../../components/icons/index";
import { ScreenHeader } from "../../components/ui/ScreenHeader/ScreenHeader";
import { EmptyState } from "../../components/ui/EmptyState/EmptyState";
import Pagination from "../../components/ui/Pagination/Pagination";
import ArtistCard from "../../components/cards/ArtistCard/ArtistCard";
import { colors } from "../../theme";
import { ARTISTS_PAGE_STYLES as styles } from "./ArtistsPage.styles";

export default function ArtistsPage() {
	const [query, setQuery] = useState("");
	const [page, setPage] = useState(1);
	const insets = useSafeAreaInsets();

	const { isCurrent, error, results } = useArtists(query, page);

	useEffect(() => {
		if (results.total > 0 && results.page !== page) {
			setPage(results.page);
		}
	}, [results.page, results.total, page]);

	const handleQueryChange = (value) => {
		setQuery(value);
		setPage(1);
	};

	const goToPage = (next) => {
		if (next < 1 || next > results.totalPages) return;
		setPage(next);
	};

	const renderItem = useCallback(
		({ item }) => (
			<View style={styles.itemWrapper}>
				<ArtistCard artist={item} />
			</View>
		),
		[],
	);

	const keyExtractor = useCallback((item) => String(item.id), []);

	return (
		<View style={[styles.container, { paddingTop: insets.top }]}>
			<ScreenHeader
				title="Artistas"
				subtitle="El catálogo completo. Abrí un artista para ver sus álbumes."
			>
				<View style={styles.searchPill}>
					<SearchIcon size={16} color={colors.textMuted} />
					<TextInput
						value={query}
						onChangeText={handleQueryChange}
						placeholder="Buscar artistas"
						placeholderTextColor={styles.placeholderColor.color}
						style={styles.searchInput}
						autoCorrect={false}
						autoCapitalize="none"
						returnKeyType="search"
						clearButtonMode="while-editing"
						accessibilityLabel="Buscar artistas"
					/>
					{query ? (
						<Pressable onPress={() => handleQueryChange("")}>
							<CloseIcon size={16} color={colors.textMuted} />
						</Pressable>
					) : null}
				</View>
			</ScreenHeader>

			<FlatList
				data={results.items}
				numColumns={2}
				renderItem={renderItem}
				keyExtractor={keyExtractor}
				columnWrapperStyle={styles.column}
				contentContainerStyle={styles.content}
				keyboardShouldPersistTaps="handled"
				keyboardDismissMode="on-drag"
				ListEmptyComponent={
					<ArtistsEmptyState
						error={error}
						isLoading={!isCurrent}
						query={query}
					/>
				}
				ListFooterComponent={
					results.totalPages > 1 ? (
						<Pagination
							page={results.page}
							totalPages={results.totalPages}
							onPageChange={goToPage}
						/>
					) : null
				}
			/>
		</View>
	);
}

function ArtistsEmptyState({ error, isLoading, query }) {
	if (error) {
		return (
			<EmptyState title="No pudimos cargar los artistas" message={error} />
		);
	}

	if (isLoading) {
		return (
			<View style={styles.emptyContainer}>
				<ActivityIndicator color={colors.textMuted} />
				<Text style={styles.emptyMessage}>Cargando artistas…</Text>
			</View>
		);
	}

	return (
		<EmptyState
			icon={<MicrophoneIcon size={40} color={colors.textMuted} />}
			title={query ? "Sin resultados" : "Todavía no hay artistas"}
			message={
				query
					? `No encontramos artistas para "${query}". Probá con otro término.`
					: "Cuando se cargue el catálogo, los artistas aparecen acá."
			}
		/>
	);
}
