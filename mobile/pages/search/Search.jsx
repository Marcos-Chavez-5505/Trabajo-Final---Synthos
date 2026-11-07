import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, fontSize, fontWeight, spacing, radius } from "../../theme";
import SearchSongs from "./SearchSongs";
import SearchAlbums from "./SearchAlbums";
import SearchPeople from "./SearchPeople";
import { SEARCH_TABS } from "./constants";

export default function SearchScreen() {
	const [text, setText] = useState("");
	const [query, setQuery] = useState("");
	const [tab, setTab] = useState(SEARCH_TABS.SONGS);

	const submit = () => {
		setQuery(text.trim());
	};

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
			<View style={{ flex: 1, paddingHorizontal: spacing.lg, paddingTop: spacing.md }}>
				<Text style={{ color: colors.textPrimary, fontSize: fontSize.xl, fontWeight: fontWeight.bold, marginBottom: spacing.md }}>
					Buscar
				</Text>
				<View style={{ flexDirection: "row", alignItems: "center", backgroundColor: colors.surfaceLight, borderRadius: radius.full, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm }}>
					<TextInput
						value={text}
						onChangeText={setText}
						onSubmitEditing={submit}
						returnKeyType="search"
						placeholder="Buscar canciones, álbumes o personas"
						placeholderTextColor="rgba(244,240,249,0.5)"
						style={{ flex: 1, color: colors.textPrimary, fontSize: fontSize.sm }}
					/>
					<Pressable onPress={submit} style={{ paddingLeft: spacing.sm }}>
						<Text style={{ color: colors.textPrimary }}>Buscar</Text>
					</Pressable>
				</View>

				{tab === SEARCH_TABS.SONGS && <SearchSongs query={query} onChangeTab={setTab} />}
				{tab === SEARCH_TABS.ALBUMS && <SearchAlbums query={query} onChangeTab={setTab} />}
				{tab === SEARCH_TABS.PEOPLE && (
					<SearchPeople key={query} query={query} onChangeTab={setTab} />
				)}
			</View>
		</SafeAreaView>
	);
}