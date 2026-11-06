import { Pressable, Text, View } from "react-native";
import { FOLLOW_STATS_STYLES as styles } from "./FollowStats.styles";

/**
 * Contadores de seguidores y seguidos.
 *
 * Si recibe `onSelect`, cada contador abre la lista correspondiente. Se usa
 * igual en el perfil propio y en el público.
 */
export default function FollowStats({
	followerCount,
	followingCount,
	onSelect,
}) {
	const renderStat = (relation, count, singular, plural) => {
		const canPress = Boolean(onSelect);

		return (
			<Pressable
				onPress={canPress ? () => onSelect(relation) : undefined}
				disabled={!canPress}
				style={({ pressed }) => [
					styles.stat,
					pressed && styles.pressed,
				]}
				accessibilityRole={canPress ? "button" : undefined}
				accessibilityLabel={
					canPress
						? `Ver ${relation === "seguidores" ? "seguidores" : "seguidos"}: ${count}`
						: undefined
				}
			>
				<Text style={styles.value}>{count}</Text>
				<Text style={styles.label}>{count === 1 ? singular : plural}</Text>
			</Pressable>
		);
	};

	return (
		<View style={styles.row}>
			{renderStat("seguidores", followerCount, "Seguidor", "Seguidores")}
			{renderStat("siguiendo", followingCount, "Seguido", "Seguidos")}
		</View>
	);
}
