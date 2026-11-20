import { Pressable, Text, View } from "react-native";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "../../ui/Avatar/Avatar";
import { INVITE_ROW_STYLES as styles } from "./InviteRow.styles";

const STATUS_LABEL = {
	pendiente: "Pendiente",
	aceptada: "Aceptó",
	rechazada: "Rechazó",
};

/** Fila de resultado: avatar, nombre y estado o botón Invitar (como en web). */
export default function InviteRow({ person, status, pending, disabled, onInvite }) {
	return (
		<View style={styles.personRow}>
			<Avatar size={32}>
				<AvatarImage uri={person.avatarUrl} name={person.username} />
				<AvatarFallback name={person.username} />
			</Avatar>

			<View style={styles.personText}>
				<Text style={styles.personName} numberOfLines={1}>
					{person.username}
				</Text>
				<Text style={styles.personHandle} numberOfLines={1}>
					@{person.username}
				</Text>
			</View>

			<View style={styles.action}>
				{status ? (
					<Text style={styles.status}>
						{STATUS_LABEL[status] ?? STATUS_LABEL.pendiente}
					</Text>
				) : pending ? (
					<Text style={styles.status}>Enviando…</Text>
				) : (
					<Pressable
						onPress={onInvite}
						disabled={disabled}
						style={({ pressed }) => [
							styles.inviteButton,
							pressed && styles.pressed,
							disabled && styles.disabled,
						]}
						accessibilityRole="button"
						accessibilityLabel={`Invitar a ${person.username}`}
					>
						<Text style={styles.inviteButtonText}>Invitar</Text>
					</Pressable>
				)}
			</View>
		</View>
	);
}
