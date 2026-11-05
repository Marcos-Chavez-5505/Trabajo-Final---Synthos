import { Pressable, Text, View } from "react-native";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "../../ui/Avatar/Avatar";
import { MEMBER_ROW_STYLES as styles } from "./MemberRow.styles";

/**
 * Participante de una playlist colaborativa. El botón "Echar" solo aparece
 * para el creador y nunca sobre su propia fila (lo decide quien lo usa).
 */
export default function MemberRow({ member, canRemove = false, onRemove }) {
	return (
		<View style={styles.row}>
			<Avatar size={36}>
				<AvatarImage uri={member.avatarUrl} name={member.username} />
				<AvatarFallback name={member.username} />
			</Avatar>

			<Text style={styles.name} numberOfLines={1}>
				{member.username}
			</Text>

			<Text style={styles.role}>
				{member.role === "creator" ? "Creador" : "Colaborador"}
			</Text>

			{canRemove ? (
				<Pressable
					onPress={onRemove}
					style={({ pressed }) => [styles.remove, pressed && styles.pressed]}
					accessibilityRole="button"
					accessibilityLabel={`Sacar a ${member.username} de la playlist`}
					hitSlop={6}
				>
					<Text style={styles.removeText}>Echar</Text>
				</Pressable>
			) : null}
		</View>
	);
}
