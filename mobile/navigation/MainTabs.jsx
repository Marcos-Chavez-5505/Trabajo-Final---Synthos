import { View } from "react-native";
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
import NotificationsScreen from "../pages/notifications/Notifications";
import PlaylistsStack from "./PlaylistsStack";
import SearchStack from "./SearchStack";

const Tab = createBottomTabNavigator();

export default function MainTabs() {
	return (
		<View style={{ flex: 1 }}>
			<Tab.Navigator
				tabBar={(props) => <BottomTabBar {...props} />}
				screenOptions={{ headerShown: false }}
			>
				<Tab.Screen
					name="Home"
					component={HomeScreen}
					options={{ tabBarLabel: "Home", tabBarIcon: HomeIcon }}
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
						popToTopOnBlur: true,
					}}
				/>
				<Tab.Screen name="Notifications" component={NotificationsScreen} />
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