import { View } from "react-native";
import { colors } from "../theme";
import { useUnreadNotificationsCount } from "@synthos/shared";
import BottomNav from "../components/layout/BottomNav/BottomNav";
import MiniPlayerBar from "../components/layout/MiniPlayerBar/MiniPlayerBar";

export default function BottomTabBar({ state, descriptors, navigation }) {
	const unreadCount = useUnreadNotificationsCount();

	const items = state.routes.map((route) => {
		const { options } = descriptors[route.key];
		return {
			key: route.key,
			label: options.tabBarLabel ?? options.title ?? route.name,
			Icon: options.tabBarIcon,
			badge:
				route.name === "Notifications" && unreadCount > 0
					? unreadCount > 9
						? "9+"
						: String(unreadCount)
					: null,
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