import { View } from "react-native";
import { colors } from "../theme";
import BottomNav from "../components/layout/BottomNav/BottomNav";
import MiniPlayerBar from "../components/layout/MiniPlayerBar/MiniPlayerBar";

// Notificaciones se abre desde el TopBar: la ruta sigue en el navigator pero no
// se muestra como pestaña.
const HIDDEN_TABS = new Set(["Notifications"]);

export default function BottomTabBar({ state, descriptors, navigation }) {
	const items = state.routes
		.filter((route) => !HIDDEN_TABS.has(route.name))
		.map((route) => {
			const { options } = descriptors[route.key];
			return {
				key: route.key,
				label: options.tabBarLabel ?? options.title ?? route.name,
				Icon: options.tabBarIcon,
			};
		});

	const onSelect = (key) => {
		const route = state.routes.find((r) => r.key === key);
		const event = navigation.emit({
			type: "tabPress",
			target: route.key,
			canPreventDefault: true,
		});
		if (!event.defaultPrevented) navigation.navigate(route.name);
	};

	return (
		<View style={{ backgroundColor: colors.surface }}>
			<MiniPlayerBar />
			<BottomNav
				items={items}
				selectedKey={state.routes[state.index].key}
				onSelect={onSelect}
			/>
		</View>
	);
}