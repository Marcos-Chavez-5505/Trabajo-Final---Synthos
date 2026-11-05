import { Pressable, Text, View } from "react-native";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "../Avatar/Avatar";
import { AVATAR_STACK_STYLES as styles } from "./AvatarStack.styles";

const MAX_VISIBLE = 3;
const SIZE = 36;

/**
 * Grupo de avatares de una playlist (port de `AvatarStack` web).
 *
 * Muestra hasta 3 y, si hay más, un contador "+N". Con `onPress` se vuelve un
 * botón (abrir participantes / invitar); sin `onPress` es presentacional.
 */
export default function AvatarStack({
	members = [],
	onPress,
	label = "Ver participantes e invitar",
}) {
	if (members.length === 0) return null;

	const visibleMembers = members.slice(0, MAX_VISIBLE);
	const remaining = members.length - visibleMembers.length;

	const group = (
		<View style={styles.group}>
			{visibleMembers.map((member, index) => (
				<View
					key={member.id ?? member.username}
					style={[styles.item, index > 0 && styles.overlap, { zIndex: 30 - index * 10 }]}
				>
					<Avatar size={SIZE}>
						<AvatarImage uri={member.avatarUrl} name={member.username} />
						<AvatarFallback name={member.username} />
					</Avatar>
				</View>
			))}

			{remaining > 0 ? (
				<View style={[styles.remaining, styles.overlap]}>
					<Text style={styles.remainingText}>+{remaining}</Text>
				</View>
			) : null}
		</View>
	);

	if (!onPress) {
		return (
			<View accessibilityRole="none" accessibilityLabel="Participantes">
				{group}
			</View>
		);
	}

	return (
		<Pressable
			onPress={onPress}
			accessibilityRole="button"
			accessibilityLabel={label}
			style={({ pressed }) => [styles.button, pressed && styles.pressed]}
		>
			{group}
		</Pressable>
	);
}
