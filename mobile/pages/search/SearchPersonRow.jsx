import { useState } from "react";
import { Text, View } from "react-native";
import { followUser, unfollowUser, useAuth } from "@synthos/shared";
import UserRow from "../../components/cards/UserRow/UserRow";
import FollowButton from "../../components/social/FollowButton/FollowButton";
import { SEARCH_PERSON_ROW_STYLES as styles } from "./SearchPersonRow.styles";
import { showActionError } from "../../lib/toastMessages";

/**
 * Resultado de la búsqueda de personas con botón seguir.
 *
 * La lista ya trae el estado de cada relación en el payload, así que la fila
 * solo ejecuta la mutación puntual y actualiza su propio botón, sin volver a
 * pedir la búsqueda completa.
 */
export default function SearchPersonRow({ person, onPress }) {
	const { user } = useAuth();
	const viewerId = user?.id ?? null;
	const canFollow = Boolean(viewerId) && String(viewerId) !== String(person.id);

	const [following, setFollowing] = useState(() =>
		Boolean(person.isFollowing),
	);
	const [pending, setPending] = useState(false);

	const toggle = async () => {
		if (!canFollow || pending) return;

		setPending(true);
		const previous = following;
		const optimistic = !previous;
		setFollowing(optimistic);

		try {
			const action = optimistic ? followUser : unfollowUser;
			const next = await action(viewerId, person.id);
			setFollowing(next.isFollowing);
		} catch (cause) {
			setFollowing(previous);
			showActionError(cause, "follow:toggle");
		} finally {
			setPending(false);
		}
	};

	return (
		<UserRow
			person={person}
			onPress={onPress}
			action={
				canFollow ? (
					<View style={styles.action}>
						<FollowButton
							compact
							canFollow={canFollow}
							isFollowing={following}
							onToggle={toggle}
							pending={pending}
						/>
						{person.followsMe ? (
							<View style={styles.badge}>
								<Text style={styles.badgeText}>Te sigue</Text>
							</View>
						) : null}
					</View>
				) : null
			}
		/>
	);
}
