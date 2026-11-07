import { Pressable, Text, View } from "react-native";
import { GENERAL_ROW_STYLES as styles } from "./GeneralRow.styles";

/**
 * leading es el visual de la
 * entidad y action queda fuera del Pressable para que un botón interno no
 * dispare también la acción principal de la fila.
 */
export default function GeneralRow({
	leading,
	title,
	subtitle,
	label,
	action = null,
	onPress,
	accessibilityLabel,
}) {
	return (
		<View style={styles.row}>
			<Pressable
				onPress={onPress}
				disabled={!onPress}
				style={({ pressed }) => [styles.content, pressed && styles.pressed]}
				accessibilityRole={onPress ? "button" : undefined}
				accessibilityLabel={accessibilityLabel}
			>
				{leading}
				<View style={styles.text}>
					<Text style={styles.title} numberOfLines={1}>
						{title}
					</Text>
					{subtitle ? (
						<Text style={styles.subtitle} numberOfLines={1}>
							{subtitle}
						</Text>
					) : null}
					{label ? (
						<Text style={styles.label} numberOfLines={1}>
							{label}
						</Text>
					) : null}
				</View>
			</Pressable>

			{action ? <View style={styles.action}>{action}</View> : null}
		</View>
	);
}
