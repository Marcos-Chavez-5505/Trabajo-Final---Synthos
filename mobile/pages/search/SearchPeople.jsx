import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSearchPeople } from "@synthos/shared";
import { colors } from "../../theme";
import Pagination from "../../components/ui/Pagination/Pagination";
import SearchTabs from "./SearchTabs";
import { SEARCH_TABS } from "./constants";
import SearchPersonRow from "./SearchPersonRow";
import { showActionError } from "../../lib/toastMessages";

export default function SearchPeople(props) {
	const [retryKey, setRetryKey] = useState(0);
	const retry = useCallback(() => setRetryKey((value) => value + 1), []);

	return <SearchPeopleContent key={retryKey} {...props} retry={retry} />;
}

function SearchPeopleContent({ query, onChangeTab, retry }) {
	const navigation = useNavigation();
	const [page, setPage] = useState(1);
	const { isLoading, error, results } = useSearchPeople(query || "", page);

	useEffect(() => {
		if (error) showActionError(error, "search:people", { retry });
	}, [error, retry]);

	const goToPage = (nextPage) => {
		if (nextPage < 1 || nextPage > results.totalPages) return;
		setPage(nextPage);
	};

	return (
		<View style={{ flex: 1 }}>
			<SearchTabs active={SEARCH_TABS.PEOPLE} onChange={onChangeTab} />
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
						results.items.map((person) => (
							<SearchPersonRow
								key={`${results.page}-${person.id}`}
								person={person}
								onPress={() =>
									navigation.navigate("ProfilePublic", {
										userId: person.id,
									})
								}
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
