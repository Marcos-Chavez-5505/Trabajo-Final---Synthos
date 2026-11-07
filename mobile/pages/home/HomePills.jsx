import { useNavigation } from "@react-navigation/native";
import { Pressable, Text } from "react-native";
import HorizontalScrollBar from "../../components/ui/HorizontalScrollBar/HorizontalScrollBar";
import { HOME_PILLS_STYLES as styles } from "./HomePills.styles";

const PILLS = [
	{ label: "Álbumes", route: "Albums" },
	{ label: "Artistas", route: "Artists" },
	{ label: "Populares", route: "Popular" },
];

export default function HomePills() {
	const navigation = useNavigation();

	return (
		<HorizontalScrollBar contentContainerStyle={styles.content}>
			{PILLS.map(({ label, route }) => (
				<Pressable
					key={route}
					onPress={() => navigation.navigate(route)}
					style={styles.pill}
				>
					<Text style={styles.pillText}>{label}</Text>
				</Pressable>
			))}
		</HorizontalScrollBar>
	);
}
