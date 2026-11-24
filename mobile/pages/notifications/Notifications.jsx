import { useEffect } from "react";
import {
	ActivityIndicator,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNotificationsContext } from "@synthos/shared";
import { EmptyState } from "../../components/ui/EmptyState/EmptyState";
import { ScreenHeader } from "../../components/ui/ScreenHeader/ScreenHeader";
import { NotificationIcon } from "../../components/icons";
import { colors } from "../../theme";
import { NOTIFICATIONS_STYLES as styles } from "./Notifications.styles";
import { showActionError } from "../../lib/toastMessages";
import NotificationRow from "./NotificationRow";

export default function NotificationsScreen() {
	const {
		notifications,
		unreadCount,
		loading,
		error,
		refresh,
		markAsRead,
		markAllAsRead,
	} = useNotificationsContext();

	useEffect(() => {
		if (error) showActionError(error, "notifications:load", { retry: refresh });
	}, [error, refresh]);

	const isInitialLoading = loading && notifications.length === 0;
	const subtitle = isInitialLoading
		? "Cargando notificaciones..."
		: unreadCount > 0
			? `Tenés ${unreadCount} ${
					unreadCount === 1 ? "notificación nueva" : "notificaciones nuevas"
				}.`
			: "Estás al día. Acá van a aparecer las novedades de tu cuenta.";

	return (
		<SafeAreaView style={styles.safe}>
			<ScrollView contentContainerStyle={styles.scroll}>
				<ScreenHeader
					title="Notificaciones"
					subtitle={subtitle}
					style={styles.header}
					action={
						unreadCount > 0 && !isInitialLoading ? (
							<Pressable onPress={markAllAsRead} style={styles.markAllButton}>
								<Text style={styles.markAllText}>Marcar todas como leídas</Text>
							</Pressable>
						) : null
					}
				/>

				{isInitialLoading ? (
					<View style={styles.loading}>
						<ActivityIndicator color={colors.fucsia} />
					</View>
				) : notifications.length === 0 ? (
					<EmptyState
						icon={<NotificationIcon size={40} color={colors.textMuted} />}
						title="No tenés notificaciones"
						message="Cuando alguien te siga, te recomiende una canción o te invite a una playlist, va a aparecer acá."
						style={styles.empty}
					/>
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
