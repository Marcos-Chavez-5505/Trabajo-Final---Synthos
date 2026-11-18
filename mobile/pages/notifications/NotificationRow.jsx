import { useNavigation } from "@react-navigation/native";
import { Pressable, Text, View } from "react-native";
import { formatRelativeTime } from "@synthos/shared";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "../../components/ui/Avatar/Avatar";
import { UserIcon, MusicNoteIcon, PlaylistIcon } from "../../components/icons";
import { colors } from "../../theme";
import { NOTIFICATIONS_STYLES as styles } from "./Notifications.styles";
import NotificationText from "./NotificationText";

const TYPE_META = {
	follow: {
		label: "Nuevo seguidor",
		Icon: UserIcon,
		badgeStyle: styles.badgeFollow,
		action: "Ver perfil",
		href: (n) => ({ screen: "ProfilePublic", params: { userId: n.actor.id } }),
	},
	recommendation: {
		label: "Recomendación",
		Icon: MusicNoteIcon,
		badgeStyle: styles.badgeRecommendation,
		action: "Ver recomendación",
		href: () => ({ screen: "Profile" }),
	},
	playlist_invitation: {
		label: "Invitación a playlist",
		Icon: PlaylistIcon,
		badgeStyle: styles.badgePlaylist,
		action: "Ver invitación",
		href: () => ({
			screen: "Playlists",
			params: { screen: "PlaylistsList", params: { tab: "invitaciones" } },
		}),
	},
};

export default function NotificationRow({ notification, onRead }) {
	const navigation = useNavigation();
	const meta = TYPE_META[notification.type] ?? TYPE_META.follow;
	const unread = !notification.isRead;
	const Icon = meta.Icon;

	function handlePress() {
		if (unread) onRead(notification.id);
		const target = meta.href(notification);
		navigation.navigate(target.screen, target.params);
	}

	return (
		<Pressable
			onPress={handlePress}
			style={[styles.row, unread ? styles.rowUnread : styles.rowRead]}
			accessibilityRole="button"
			accessibilityLabel={`${unread ? "Sin leer. " : ""}${meta.label}: ${notification.actor.username}`}
		>
			{unread ? <View style={styles.unreadDot} /> : null}

			<View style={styles.avatarWrap}>
				<Avatar size={44}>
					<AvatarImage
						uri={notification.actor.avatarUrl}
						name={notification.actor.username}
					/>
					<AvatarFallback name={notification.actor.username} />
				</Avatar>
				<View style={[styles.typeBadge, meta.badgeStyle]}>
					<Icon size={12} color={colors.textPrimary} />
				</View>
			</View>

			<View style={styles.textWrap}>
				<NotificationText notification={notification} />
				<Text style={styles.meta}>
					{meta.label} · {formatRelativeTime(notification.createdAt)}
				</Text>
			</View>
		</Pressable>
	);
}
