import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import BottomTabBar from "./BottomTabBar";
import PlaceholderScreen from "./PlaceholderScreen";
import HomeScreen from "../pages/home/Home";
import { HomeIcon, LibraryIcon, SearchIcon, PlaceholderIcon } from "../components/icons";

const Tab = createBottomTabNavigator();

export default function MainTabs() {
	return (
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
				options={{ tabBarLabel: "Salas", tabBarIcon: PlaceholderIcon }}
			/>
			<Tab.Screen
				name="Search"
				component={PlaceholderScreen}
				options={{ tabBarLabel: "Buscar", tabBarIcon: SearchIcon }}
			/>
			<Tab.Screen
				name="Playlists"
				component={PlaceholderScreen}
				options={{ tabBarLabel: "Playlists", tabBarIcon: LibraryIcon }}
			/>
		</Tab.Navigator>
	);
}