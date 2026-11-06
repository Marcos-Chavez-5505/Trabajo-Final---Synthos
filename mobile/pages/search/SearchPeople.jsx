import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSearchPeople } from "@synthos/shared";
import { colors } from "../../theme";
import SearchTabs from "./SearchTabs";
import { SEARCH_TABS } from "./constants";
import SearchPersonRow from "./SearchPersonRow";

export default function SearchPeople({ query, onChangeTab }) {
	const navigation = useNavigation();
	const { isLoading, error, results } = useSearchPeople(query || "", 1);

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
						results.items.map((person) => (
							<SearchPersonRow
								key={person.id}
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
				</ScrollView>
			)}
		</View>
	);
}
