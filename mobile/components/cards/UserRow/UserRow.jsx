import { Avatar, AvatarFallback, AvatarImage } from "../../ui/Avatar/Avatar";
import GeneralRow from "../GeneralRow/GeneralRow";

/**
 * Fila de persona en listas y búsqueda.
 */
export default function UserRow({ person, onPress, action = null }) {
	return (
		<GeneralRow
			leading={
				<Avatar size={48}>
					<AvatarImage uri={person.avatarUrl} name={person.username} />
					<AvatarFallback name={person.username} />
				</Avatar>
			}
			title={person.username}
			subtitle={person.bio || "Sin bio todavía."}
			action={action}
			onPress={onPress}
			accessibilityLabel={
				onPress ? `Ver perfil de ${person.username}` : undefined
			}
		/>
	);
}
