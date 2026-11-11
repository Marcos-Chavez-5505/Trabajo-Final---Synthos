import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SearchScreen from "../pages/search/Search";
import ArtistsScreen from "../pages/artists/Artists";
import ArtistDetailScreen from "../pages/artists/ArtistsDetail/ArtistDetail";
import AlbumsScreen from "../pages/albums/Albums";
import PopularScreen from "../pages/popular/Popular";
import AlbumDetailScreen from "../pages/albums/AlbumDetail/AlbumDetail";
const Stack = createNativeStackNavigator();

export default function SearchStack() {
	return (
		<Stack.Navigator screenOptions={{ headerShown: false }}>
			<Stack.Screen name="SearchHome" component={SearchScreen} />
			<Stack.Screen name="Artists" component={ArtistsScreen} />
			<Stack.Screen name="ArtistDetail" component={ArtistDetailScreen} />
			<Stack.Screen name="Albums" component={AlbumsScreen} />
			<Stack.Screen name="AlbumDetail" component={AlbumDetailScreen} />
			<Stack.Screen name="Popular" component={PopularScreen} />
		</Stack.Navigator>
	);
}
