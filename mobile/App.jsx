import { useMemo } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, PlayerProvider, useAuth } from "@synthos/shared";
import Landing from "./pages/landing/Landing";
import Login from "./pages/login/Login";
import Register from "./pages/register/Register";
import MainTabs from "./navigation/MainTabs";
import ProfileScreen from "./pages/profile/ProfileView";
import { initApi } from "./config/api";
import { createAudioMotor } from "./lib/audioMotor";
import ProfileEditScreen from "./pages/profile/ProfileEdit";
import CreateRoomScreen from "./pages/rooms/CreateRoom";
import RoomDetailScreen from "./pages/rooms/RoomDetail";
import AlbumsScreen from "./pages/albums/Albums";
import ArtistsScreen from "./pages/artists/Artists";

initApi();

const Stack = createNativeStackNavigator();

function RootNavigator() {
	const { user, loading } = useAuth();

	if (loading) {
		return (
			<View
				style={{
					flex: 1,
					backgroundColor: "#1e1e1e",
					justifyContent: "center",
					alignItems: "center",
				}}
			>
				<ActivityIndicator color="#ef2f62" size="large" />
			</View>
		);
	}

	return (
        // Inicia directamente si la sesion sigue iniciada 
		<NavigationContainer>
			<Stack.Navigator
				initialRouteName={user ? "Main" : "Landing"}
				screenOptions={{ headerShown: false }}
			>
				<Stack.Screen name="Landing" component={Landing} />
				<Stack.Screen name="Login" component={Login} />
				<Stack.Screen name="Register" component={Register} />
				<Stack.Screen name="Main" component={MainTabs} />
				<Stack.Screen name="Profile" component={ProfileScreen} />
				<Stack.Screen name="ProfileEdit" component={ProfileEditScreen} />
				<Stack.Screen name="CreateRoom" component={CreateRoomScreen} />
				<Stack.Screen name="RoomDetail" component={RoomDetailScreen} />
				<Stack.Screen name="Albums" component={AlbumsScreen} />
				<Stack.Screen name="Artists" component={ArtistsScreen} />
			</Stack.Navigator>
		</NavigationContainer>
	);
}

export default function App() {
	// El motor de audio se inyecta por configuración: shared/ no conoce
	// expo-audio ni la plataforma (AGENTS.md, regla 14).
	const motor = useMemo(() => createAudioMotor(), []);

	return (
		<SafeAreaProvider>
			<AuthProvider>
				<PlayerProvider motor={motor}>
					<RootNavigator />
				</PlayerProvider>
			</AuthProvider>
		</SafeAreaProvider>
	);
}