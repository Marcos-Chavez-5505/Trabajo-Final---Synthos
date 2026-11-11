import { useNavigation } from "@react-navigation/native";
import { Pressable, Text } from "react-native";
import HorizontalScrollBar from "../../ui/HorizontalScrollBar/HorizontalScrollBar";
import { HOME_PILLS_STYLES as styles } from "./HomePills.styles";

const PILLS = [
	{ label: "Álbumes", screen: "Albums" },
	{ label: "Artistas", screen: "Artists" },
	{ label: "Populares", screen: "Popular" },
];

export default function HomePills() {
	const navigation = useNavigation();

	return (
		<HorizontalScrollBar contentContainerStyle={styles.content}>
			{PILLS.map(({ label, screen }) => (
				<Pressable
					key={screen}
					onPress={() => navigation.navigate("Search", { screen })}
					style={styles.pill}
				>
					<Text style={styles.pillText}>{label}</Text>
				</Pressable>
			))}
		</HorizontalScrollBar>
	);
}
