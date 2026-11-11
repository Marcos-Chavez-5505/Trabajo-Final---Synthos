import { useCallback, useEffect, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	Pressable,
	Text,
	TextInput,
	View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAlbums } from "@synthos/shared";
import {
	SearchIcon,
	MicrophoneIcon,
	CloseIcon,
} from "../../components/icons/index";
import { ScreenHeader } from "../../components/ui/ScreenHeader/ScreenHeader";
import { EmptyState } from "../../components/ui/EmptyState/EmptyState";
import Pagination from "../../components/ui/Pagination/Pagination";
import AlbumCard from "../../components/cards/AlbumCard/AlbumCard";
import { colors } from "../../theme";
import { ALBUMS_STYLES as styles } from "./Albums.styles";

export default function AlbumsPage() {
	const navigation = useNavigation();
	const [query, setQuery] = useState("");
	const [page, setPage] = useState(1);
	const insets = useSafeAreaInsets();

	const { isCurrent, error, results } = useAlbums(page);

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
				<AlbumCard
					album={item}
					onPress={() => navigation.navigate("AlbumDetail", { id: item.id })}
				/>
			</View>
		),
		[navigation],
	);

	const keyExtractor = useCallback((item) => String(item.id), []);

	return (
		<View
			style={[
				styles.container,
				{ paddingTop: insets.top, paddingBottom: insets.bottom },
			]}
		>
			<ScreenHeader
				title="Álbumes"
				subtitle="El catálogo completo. Abrí un álbum para ver sus canciones."
			>
				<View style={styles.searchPill}>
					<SearchIcon size={16} color={colors.textMuted} />
					<TextInput
						value={query}
						onChangeText={handleQueryChange}
						placeholder="Buscar álbumes"
						placeholderTextColor={styles.placeholderColor.color}
						style={styles.searchInput}
						autoCorrect={false}
						autoCapitalize="none"
						returnKeyType="search"
						clearButtonMode="while-editing"
						accessibilityLabel="Buscar álbumes"
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
					<AlbumsEmptyState
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

function AlbumsEmptyState({ error, isLoading, query }) {
	if (error) {
		return <EmptyState title="No pudimos cargar los álbumes" message={error} />;
	}

	if (isLoading) {
		return (
			<View style={styles.emptyContainer}>
				<ActivityIndicator color={colors.textMuted} />
				<Text style={styles.emptyMessage}>Cargando álbumes</Text>
			</View>
		);
	}

	return (
		<EmptyState
			icon={<MicrophoneIcon size={40} color={colors.textMuted} />}
			title={query ? "Sin resultados" : "Todavía no hay álbumes"}
			message={
				query
					? `No encontramos álbumes para "${query}". Probá con otro término.`
					: "Cuando se cargue el catálogo, los álbumes aparecen acá."
			}
		/>
	);
}
