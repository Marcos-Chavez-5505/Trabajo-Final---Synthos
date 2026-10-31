import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthProvider } from "@synthos/shared";
import Landing from "./pages/langing/Landing";
import Login from "./pages/login/Login";
import Register from "./pages/register/Register";
import { initApi } from "./config/api";

initApi();

const Stack = createNativeStackNavigator();

export default function App() {
	return (
		<AuthProvider>
			<NavigationContainer>
				<Stack.Navigator
					initialRouteName="Landing"
					screenOptions={{ headerShown: false }}
				>
					<Stack.Screen name="Landing" component={Landing} />
					<Stack.Screen name="Login" component={Login} />
					<Stack.Screen name="Register" component={Register} />
				</Stack.Navigator>
			</NavigationContainer>
		</AuthProvider>
	);
}