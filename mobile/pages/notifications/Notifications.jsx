import { useMemo } from "react";
import {
	ActivityIndicator,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import {
	useNotificationsContext,
	formatRelativeTime,
} from "@synthos/shared";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/Avatar/Avatar";
import {
	UserIcon,
	MusicNoteIcon,
	PlaylistIcon,
	NotificationIcon,
} from "../../components/icons";
import { NOTIFICATIONS_STYLES as styles } from "./Notifications.styles";
import { colors } from "../../theme";

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
		href: () => ({ screen: "Playlists" }),
	},
};

function NotificationText({ notification }) {
	const actor = (
		<Text style={styles.bold}>@{notification.actor.username}</Text>
	);

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

function NotificationRow({ notification, onRead }) {
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
			accessibilityLabel={`${meta.label}: ${notification.actor.username}`}
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

function EmptyState() {
	return (
		<View style={styles.empty}>
			<NotificationIcon size={40} color={colors.textMuted} />
			<Text style={styles.emptyTitle}>No tenés notificaciones</Text>
			<Text style={styles.emptyText}>
				Cuando alguien te siga, te recomiende una canción o te invite a una
				playlist, va a aparecer acá.
			</Text>
		</View>
	);
}

export default function NotificationsScreen() {
	const { notifications, unreadCount, loading, markAsRead, markAllAsRead } =
		useNotificationsContext();

	if (loading && notifications.length === 0) {
		return (
			<SafeAreaView style={styles.safe}>
				<View style={styles.loading}>
					<ActivityIndicator color={colors.fucsia} />
				</View>
			</SafeAreaView>
		);
	}

	return (
		<SafeAreaView style={styles.safe}>
			<ScrollView contentContainerStyle={styles.scroll}>
				<View style={styles.header}>
					<View style={styles.headerText}>
						<Text style={styles.title}>Notificaciones</Text>
						<Text style={styles.subtitle}>
							{unreadCount > 0
								? `Tenés ${unreadCount} ${
										unreadCount === 1
											? "notificación nueva"
											: "notificaciones nuevas"
									}.`
								: "Estás al día. Acá van a aparecer las novedades de tu cuenta."}
						</Text>
					</View>
					{unreadCount > 0 ? (
						<Pressable onPress={markAllAsRead} style={styles.markAllButton}>
							<Text style={styles.markAllText}>Marcar todas como leídas</Text>
						</Pressable>
					) : null}
				</View>

				{notifications.length === 0 ? (
					<EmptyState />
				) : (
					<View style={styles.list}>
						{notifications.map((notification) => (
							<NotificationRow
								key={notification.id}
								notification={notification}
								onRead={markAsRead}
							/>
						))}
					</View>
				)}
			</ScrollView>
		</SafeAreaView>
	);
}