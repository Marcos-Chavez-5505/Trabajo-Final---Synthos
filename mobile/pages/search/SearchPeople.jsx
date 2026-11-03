import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSearchPeople } from "@synthos/shared";
import { colors, fontSize, fontWeight } from "../../theme";
import SearchTabs from "./SearchTabs";
import { SEARCH_TABS } from "./constants";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/Avatar/Avatar";

export default function SearchPeople({ query, onChangeTab }) {
	const navigation = useNavigation();
	const { isLoading, error, results } = useSearchPeople(query || "", 1);

	return (
		<View style={{ flex: 1 }}>
			<SearchTabs active={SEARCH_TABS.PEOPLE} onChange={onChangeTab} />
			{query ? (
				<Text style={{ color: colors.textPrimary, opacity: 0.7, marginBottom: 16 }}>
					{`Resultados para "${query}"`}
				</Text>
			) : null}

			{!query ? (
				<Text style={{ color: colors.textPrimary, opacity: 0.5 }}>Sin búsqueda</Text>
			) : isLoading ? (
				<ActivityIndicator color={colors.textPrimary} style={{ marginTop: 24 }} />
			) : error ? (
				<Text style={{ color: colors.textPrimary, opacity: 0.7 }}>Error al buscar</Text>
			) : (
				<ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingBottom: 120 }}>
					{results.items?.length ? (
						results.items.map((person) => (
							<Pressable
								key={person.id}
								onPress={() => navigation.navigate("Profile", { userId: person.id })}
								style={{ flexDirection: "row", gap: 12, backgroundColor: colors.surfaceLight, borderRadius: 8, padding: 10, alignItems: "center" }}
							>
								<Avatar size={48}>
									<AvatarImage uri={person.avatarUrl} name={person.username} />
									<AvatarFallback name={person.username} />
								</Avatar>
								<View style={{ flex: 1 }}>
									<Text style={{ color: colors.textPrimary }} numberOfLines={1}>{person.username}</Text>
									<Text style={{ color: colors.textPrimary, opacity: 0.7 }} numberOfLines={1}>{person.bio || "Sin bio todavía."}</Text>
								</View>
							</Pressable>
						))
					) : (
						<Text style={{ color: colors.textPrimary, opacity: 0.5 }}>Sin resultados</Text>
					)}
				</ScrollView>
			)}
		</View>
	);
}