import { Text, View } from "react-native";
import { PLACEHOLDER_STYLES as styles } from "./PlaceholderScreen.styles";

// TEMPORAL: pantalla vacía para probar la navegación mientras no existan las
// pantallas reales. En MainTabs, reemplazar `component={PlaceholderScreen}`
// por la pantalla real y, cuando no quede ninguna, borrar estos dos archivos.
export default function PlaceholderScreen({ route }) {
	return (
		<View style={styles.main}>
			<Text style={styles.title}>{route.name}</Text>
		</View>
	);
}