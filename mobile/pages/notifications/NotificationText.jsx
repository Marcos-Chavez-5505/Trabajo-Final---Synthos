import { Text } from "react-native";
import { NOTIFICATIONS_STYLES as styles } from "./Notifications.styles";

/**
 * Texto de cada tipo de notificación
 */
export default function NotificationText({ notification }) {
	const actor = <Text style={styles.bold}>@{notification.actor.username}</Text>;

	if (notification.type === "recommendation") {
		return (
			<Text style={styles.text}>
				{actor} te recomendó{" "}
				<Text style={styles.bold}>«{notification.song.title}»</Text> de{" "}
				{notification.song.artist}.
			</Text>
		);
	}

	if (notification.type === "playlist_invitation") {
		if (!notification.playlist) {
			return (
				<Text style={styles.text}>
					{actor} te invitó a una playlist que ya no está disponible.
				</Text>
			);
		}

		return (
			<Text style={styles.text}>
				{actor} te invitó a la playlist{" "}
				<Text style={styles.bold}>«{notification.playlist.name}»</Text>.
			</Text>
		);
	}

	return <Text style={styles.text}>{actor} empezó a seguirte.</Text>;
}
