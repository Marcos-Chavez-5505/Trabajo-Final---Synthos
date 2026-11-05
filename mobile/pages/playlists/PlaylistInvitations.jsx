import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import {
	acceptPlaylistInvitation,
	listReceivedInvitations,
	rejectPlaylistInvitation,
	subscribeToPlaylists,
	useAuth,
	mapApiError,
} from "@synthos/shared";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "../../components/ui/Avatar/Avatar";
import { PlaylistIcon } from "../../components/icons";
import { colors } from "../../theme";
import { showActionError, showSuccess } from "../../lib/toastMessages";
import { PLAYLIST_INVITATIONS_STYLES as styles } from "./PlaylistInvitations.styles";

/**
 * Bandeja de invitaciones a playlists colaborativas (tercera sub-pestaña).
 *
 * Solo trae las pendientes: al aceptar o rechazar desaparecen de acá y el
 * `subscribeToPlaylists` que dispara la mutación vuelve a pedir la lista.
 */
export default function PlaylistInvitations() {
	const navigation = useNavigation();
	const { user } = useAuth();
	const userId = user?.id ?? null;

	const [response, setResponse] = useState({
		key: null,
		invitations: [],
		error: null,
	});
	const [pendingId, setPendingId] = useState(null);
	const [version, setVersion] = useState(0);

	useEffect(() => {
		if (!userId) return undefined;

		let active = true;

		listReceivedInvitations(userId)
			.then((invitations) => {
				if (active) setResponse({ key: userId, invitations, error: null });
			})
			.catch((cause) => {
				if (active) {
					setResponse({ key: userId, invitations: [], error: mapApiError(cause) });
				}
			});

		return () => {
			active = false;
		};
	}, [userId, version]);

	useEffect(() => subscribeToPlaylists(() => setVersion((prev) => prev + 1)), []);

	async function handleAccept(invitation) {
		if (pendingId || !userId) return;

		setPendingId(invitation.playlistId);

		try {
			await acceptPlaylistInvitation(userId, invitation.playlistId);
			showSuccess("playlist:invitation:accept");
			navigation.navigate("PlaylistDetail", { id: invitation.playlistId });
		} catch (cause) {
			showActionError(cause, "playlist:invitation:accept", {
				retry: () => handleAccept(invitation),
			});
		} finally {
			setPendingId(null);
		}
	}

	async function handleReject(invitation) {
		if (pendingId || !userId) return;

		setPendingId(invitation.playlistId);

		try {
			await rejectPlaylistInvitation(userId, invitation.playlistId);
			showSuccess("playlist:invitation:reject");
		} catch (cause) {
			showActionError(cause, "playlist:invitation:reject", {
				retry: () => handleReject(invitation),
			});
		} finally {
			setPendingId(null);
		}
	}

	const isCurrent = response.key === userId;
	const invitations = isCurrent ? response.invitations : [];
	const error = isCurrent ? response.error : null;

	if (!isCurrent) {
		return (
			<View style={styles.state}>
				<ActivityIndicator color={colors.textMuted} />
				<Text style={styles.message}>Cargando tus invitaciones…</Text>
			</View>
		);
	}

	if (error) {
		return (
			<View style={styles.state}>
				<Text style={styles.error}>{error}</Text>
				<Pressable
					onPress={() => setVersion((prev) => prev + 1)}
					style={styles.retryButton}
					accessibilityRole="button"
				>
					<Text style={styles.retryText}>Reintentar</Text>
				</Pressable>
			</View>
		);
	}

	if (invitations.length === 0) {
		return (
			<View style={styles.state}>
				<PlaylistIcon size={40} color={colors.textMuted} />
				<Text style={styles.emptyTitle}>No tenés invitaciones</Text>
				<Text style={styles.message}>
					Cuando alguien te invite a una playlist colaborativa, aparece acá
					para aceptarla.
				</Text>
			</View>
		);
	}

	return (
		<ScrollView
			style={styles.fill}
			contentContainerStyle={styles.list}
			showsVerticalScrollIndicator={false}
		>
			{invitations.map((invitation) => (
				<View key={invitation.playlistId} style={styles.card}>
					<View style={styles.cover}>
						<PlaylistIcon size={24} color={colors.textPrimary} />
					</View>

					<View style={styles.info}>
						<Text style={styles.name} numberOfLines={1}>
							{invitation.playlist.name}
						</Text>
						<View style={styles.senderRow}>
							<Avatar size={20}>
								<AvatarImage
									uri={invitation.sender.avatarUrl}
									name={invitation.sender.username}
								/>
								<AvatarFallback name={invitation.sender.username} />
							</Avatar>
							<Text style={styles.sender} numberOfLines={1}>
								{invitation.sender.username} te invitó
							</Text>
						</View>
					</View>

					<View style={styles.actions}>
						<Pressable
							onPress={() => handleReject(invitation)}
							disabled={pendingId !== null}
							style={({ pressed }) => [
								styles.secondaryButton,
								pressed && styles.pressed,
								pendingId !== null && styles.disabled,
							]}
							accessibilityRole="button"
						>
							<Text style={styles.buttonText}>Rechazar</Text>
						</Pressable>
						<Pressable
							onPress={() => handleAccept(invitation)}
							disabled={pendingId !== null}
							style={({ pressed }) => [
								styles.primaryButton,
								pressed && styles.pressed,
								pendingId !== null && styles.disabled,
							]}
							accessibilityRole="button"
						>
							<Text style={styles.buttonText}>
								{pendingId === invitation.playlistId ? "Uniéndome…" : "Aceptar"}
							</Text>
						</Pressable>
					</View>
				</View>
			))}
		</ScrollView>
	);
}
