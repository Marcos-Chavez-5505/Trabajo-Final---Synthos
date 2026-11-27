import { useNavigation } from "@react-navigation/native";
import { Pressable, Text, View } from "react-native";
import { HOME_PILLS_STYLES as styles } from "./HomePills.styles";

const PILLS = [
	{ label: "Álbumes", screen: "Albums" },
	{ label: "Artistas", screen: "Artists" },
];

export default function HomePills() {
	const navigation = useNavigation();

	return (
		<View style={styles.content}>
			{PILLS.map(({ label, screen }) => (
				// `initial: false` evita que el stack anidado se inicialice con esta
				// pantalla como raíz: SearchHome debe quedar siempre abajo.
				<Pressable
					key={screen}
					onPress={() => navigation.navigate("Search", { screen, initial: false })}
					style={styles.pill}
				>
					<Text style={styles.pillText}>{label}</Text>
				</Pressable>
			))}
		</View>
	);
}
