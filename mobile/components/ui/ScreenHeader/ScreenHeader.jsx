import { Text, View } from "react-native";
import { SCREEN_HEADER_STYLES as styles } from "./ScreenHeader.styles";

export function ScreenHeader({ title, subtitle, action, children, style }) {
	return (
		<View style={[styles.container, style]}>
			<View style={styles.titleRow}>
				<Text style={styles.title}>{title}</Text>
				{action}
			</View>

			{subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}

			{children}
		</View>
	);
}
