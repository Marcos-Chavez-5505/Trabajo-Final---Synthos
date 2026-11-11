import { View } from "react-native";
import { StackActions } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import BottomTabBar from "./BottomTabBar";
import HomeScreen from "../pages/home/Home";
import ExpandedPlayer from "../components/player/ExpandedPlayer/ExpandedPlayer";
import {
	HeadphonesIcon,
	HomeIcon,
	PlaylistIcon,
	SearchIcon,
} from "../components/icons";
import RoomsScreen from "../pages/rooms/Rooms";
import PlaylistsStack from "./PlaylistsStack";
import SearchStack from "./SearchStack";

const Tab = createBottomTabNavigator();

export default function MainTabs() {
	return (
		// El overlay se monta una sola vez junto a las tabs y lee el estado
		// global, así sobrevive a la navegación entre pestañas.
		<View style={{ flex: 1 }}>
			<Tab.Navigator
				tabBar={(props) => <BottomTabBar {...props} />}
				screenOptions={{ headerShown: false }}
			>
				<Tab.Screen
					name="Home"
					component={HomeScreen}
					options={{ tabBarLabel: "Inicio", tabBarIcon: HomeIcon }}
				/>
				<Tab.Screen
					name="Rooms"
					component={RoomsScreen}
					options={{ tabBarLabel: "Salas", tabBarIcon: HeadphonesIcon }}
				/>
				<Tab.Screen
					name="Search"
					component={SearchStack}
					options={{
						tabBarLabel: "Buscar",
						tabBarIcon: SearchIcon,
						// Al salir de la pestaña, el stack vuelve a su raíz: si no,
						// quedaba en Álbumes/Artistas y al volver no se podía buscar.
						popToTopOnBlur: true,
					}}
					listeners={({ navigation, route }) => ({
						tabPress: () => {
							// Tocar Buscar estando ya en el catálogo también vuelve a
							// `SearchHome` (ahí no hay blur, así que `popToTopOnBlur`
							// no alcanza).
							const stack = route.state;
							if (stack?.type === "stack" && stack.key && stack.index > 0) {
								navigation.dispatch({
									...StackActions.popToTop(),
									target: stack.key,
								});
							}
						},
					})}
				/>
				<Tab.Screen
					name="Playlists"
					component={PlaylistsStack}
					options={{ tabBarLabel: "Playlists", tabBarIcon: PlaylistIcon }}
				/>
			</Tab.Navigator>

			<ExpandedPlayer />
		</View>
	);
}
