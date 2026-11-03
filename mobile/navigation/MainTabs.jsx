import { View } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import BottomTabBar from "./BottomTabBar";
import PlaceholderScreen from "./PlaceholderScreen";
import HomeScreen from "../pages/home/Home";
import SearchScreen from "../pages/search/Search";
import ExpandedPlayer from "../components/player/ExpandedPlayer/ExpandedPlayer";
import { HeadphonesIcon, HomeIcon, PlaylistIcon, SearchIcon } from "../components/icons";

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
					component={PlaceholderScreen}
					options={{ tabBarLabel: "Salas", tabBarIcon: HeadphonesIcon }}
				/>
				<Tab.Screen
					name="Search"
					component={SearchScreen}
					options={{ tabBarLabel: "Buscar", tabBarIcon: SearchIcon }}
				/>
				<Tab.Screen
					name="Playlists"
					component={PlaceholderScreen}
					options={{ tabBarLabel: "Playlists", tabBarIcon: PlaylistIcon }}
				/>
			</Tab.Navigator>

			<ExpandedPlayer />
		</View>
	);
}