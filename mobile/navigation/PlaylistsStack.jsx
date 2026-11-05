import { createNativeStackNavigator } from "@react-navigation/native-stack";
import PlaylistsScreen from "../pages/playlists/Playlists";
import PlaylistDetailScreen from "../pages/playlists/PlaylistDetail";

const Stack = createNativeStackNavigator();

/**
 * Stack propio de la tab Playlists.
 *
 * El detalle vive acá y no en el stack raíz para que el BottomTabBar y el
 * MiniPlayerBar sigan visibles mientras se navega una playlist.
 */
export default function PlaylistsStack() {
	return (
		<Stack.Navigator screenOptions={{ headerShown: false }}>
			<Stack.Screen name="PlaylistsList" component={PlaylistsScreen} />
			<Stack.Screen name="PlaylistDetail" component={PlaylistDetailScreen} />
		</Stack.Navigator>
	);
}
