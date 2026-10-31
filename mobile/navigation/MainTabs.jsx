import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import BottomTabBar from "./BottomTabBar";
import PlaceholderScreen from "./PlaceholderScreen";
import { HomeIcon, LibraryIcon, SearchIcon, PlaceholderIcon } from "../components/icons";

const Tab = createBottomTabNavigator();

// Pantallas con barra inferior. Todo lo que NO esté acá (Landing, Login,
// Register y, más adelante, el reproductor expandido) vive en el Stack de
// App.jsx y por eso no muestra la barra.
export default function MainTabs() {
	return (
		<Tab.Navigator
			tabBar={(props) => <BottomTabBar {...props} />}
			screenOptions={{ headerShown: false }}
		>
			{/* TEMPORAL: component={PlaceholderScreen} -> pantalla real */}
			<Tab.Screen
				name="Home"
				component={PlaceholderScreen}
				options={{ tabBarLabel: "Inicio", tabBarIcon: HomeIcon }}
			/>
			{/* TEMPORAL: PlaceholderIcon -> ícono de Salas */}
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
			{/* TEMPORAL: LibraryIcon -> ícono de Playlists */}
			<Tab.Screen
				name="Playlists"
				component={PlaceholderScreen}
				options={{ tabBarLabel: "Playlists", tabBarIcon: LibraryIcon }}
			/>
		</Tab.Navigator>
	);
}