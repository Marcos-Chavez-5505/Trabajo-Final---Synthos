import { createNativeStackNavigator } from "@react-navigation/native-stack";
import SearchScreen from "../pages/search/Search";
import ArtistsScreen from "../pages/artists/Artists";
import ArtistDetailPage from "../pages/artists/ArtistsDetail/ArtistDetail";
import AlbumsScreen from "../pages/albums/Albums";
import PopularScreen from "../pages/popular/Popular";

const Stack = createNativeStackNavigator();

export default function SearchStack() {
	return (
		<Stack.Navigator screenOptions={{ headerShown: false }}>
			<Stack.Screen name="SearchHome" component={SearchScreen} />
			<Stack.Screen name="Artists" component={ArtistsScreen} />
			<Stack.Screen name="ArtistDetail" component={ArtistDetailPage} />
			<Stack.Screen name="Albums" component={AlbumsScreen} />
			<Stack.Screen name="Popular" component={PopularScreen} />
		</Stack.Navigator>
	);
}
