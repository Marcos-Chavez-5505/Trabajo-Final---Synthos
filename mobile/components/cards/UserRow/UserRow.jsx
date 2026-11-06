import { Pressable, Text, View } from "react-native";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "../../ui/Avatar/Avatar";
import { USER_ROW_STYLES as styles } from "./UserRow.styles";

/**
 * Fila de persona en listas y búsqueda.
 *
 * El área de avatar + nombre + bio navega al perfil. La acción opcional
 * (por ejemplo, seguir) va fuera del `Pressable` para no anidar interactivos.
 */
export default function UserRow({ person, onPress, action = null }) {
	return (
		<View style={styles.row}>
			<Pressable
				onPress={onPress}
				disabled={!onPress}
				style={({ pressed }) => [styles.person, pressed && styles.pressed]}
				accessibilityRole={onPress ? "button" : undefined}
				accessibilityLabel={
					onPress ? `Ver perfil de ${person.username}` : undefined
				}
			>
				<Avatar size={48}>
					<AvatarImage uri={person.avatarUrl} name={person.username} />
					<AvatarFallback name={person.username} />
				</Avatar>

				<View style={styles.text}>
					<Text style={styles.name} numberOfLines={1}>
						{person.username}
					</Text>
					<Text style={styles.bio} numberOfLines={1}>
						{person.bio || "Sin bio todavía."}
					</Text>
				</View>
			</Pressable>

			{action ? <View style={styles.action}>{action}</View> : null}
		</View>
	);
}
