import { View } from "react-native";
import { colors } from "../theme";
import BottomNav from "../components/layout/BottomNav/BottomNav";
import MiniPlayerBar from "../components/layout/MiniPlayerBar/MiniPlayerBar";

// Adaptador entre @react-navigation/bottom-tabs y BottomNav.
// No conoce nombres de rutas: cada pantalla declara su etiqueta e ícono en sus
// `options`, por ejemplo:
//
//   <Tab.Screen
//     name="Home"
//     component={Home}
//     options={{ tabBarLabel: "Inicio", tabBarIcon: HomeIcon }}
//   />
//
// - tabBarLabel debe ser un string (si falta, se usa `title` y luego el nombre de la ruta).
// - tabBarIcon puede ser cualquier ícono de components/icons: recibe { size, color }.
export default function BottomTabBar({ state, descriptors, navigation }) {
	const items = state.routes.map((route) => {
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
		if (!event.defaultPrevented) navigation.navigate(route.name, route.params);
	};

	return (
		// El mini reproductor flota sobre la navegación inferior. El wrapper pinta
		// el fondo de la app: sin esto, las esquinas redondeadas y los márgenes del
		// mini dejaban ver el fondo claro por defecto del contenedor de navegación.
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