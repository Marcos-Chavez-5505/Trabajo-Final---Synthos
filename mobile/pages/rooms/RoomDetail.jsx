import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useNavigation } from "@react-navigation/native";
import {
	getRoomById,
	getPlayback,
	controlPlayback,
	voteSkip,
	leaveRoom,
	closeRoom,
	kickMember,
	mapApiError,
	useAuth,
	connectSocket,
	joinRoomChannel,
	leaveRoomChannel,
	subscribeToRoomEvent,
} from "@synthos/shared";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/Avatar/Avatar";
import { HeadphonesIcon } from "../../components/icons";
import { ROOM_DETAIL_STYLES as styles } from "./RoomDetail.styles";
import { colors } from "../../theme";

export default function RoomDetailScreen({ route }) {
	const navigation = useNavigation();
	const { id } = route.params ?? {};
	const { user } = useAuth();
	const viewerId = String(user?.id ?? "");

	const [room, setRoom] = useState(null);
	const [playback, setPlayback] = useState(null);
	const [votes, setVotes] = useState({ voters: [], required: 0, hasVoted: false });
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [actionError, setActionError] = useState("");
	const [pending, setPending] = useState("");

	const membership = room?.members?.find((m) => String(m.userId) === viewerId);
	const isHost = membership?.role === "host";
	const host = room?.members?.find((m) => m.role === "host");

	// Fetch inicial de la sala
	useEffect(() => {
		let active = true;
		setLoading(true);
		setError("");

		getRoomById(id)
			.then((found) => {
				if (!active) return;
				if (!found) {
					setError("La sala no existe.");
					setLoading(false);
					return;
				}
				setRoom(found);
				setLoading(false);
			})
			.catch((cause) => {
				if (active) {
					setError(mapApiError(cause));
					setLoading(false);
				}
			});

		return () => {
			active = false;
		};
	}, [id]);

	// Socket + playback inicial
	useEffect(() => {
		if (!room) return undefined;

		let active = true;
		connectSocket();
		joinRoomChannel(id);

		getPlayback(id)
			.then((data) => {
				if (!active) return;
				setPlayback(data.playback);
				setVotes(data.skipVotes);
			})
			.catch(() => {});

		const offMembers = subscribeToRoomEvent("room:members", (members) => {
			if (!active) return;
			const parsed = members.map((raw) => ({
				userId: String(raw.idUser ?? raw.id_user ?? raw.user?.id),
				username: raw.user?.username ?? "",
				avatarUrl: raw.user?.pictureUrl ?? null,
				role: raw.role,
			}));
			setRoom((cur) =>
				cur ? { ...cur, members: parsed, membersCount: parsed.length } : cur,
			);
		});

		const offPlayback = subscribeToRoomEvent("room:playback", (next) => {
			if (active) setPlayback(next);
		});

		const offSkip = subscribeToRoomEvent("room:skip-votes", (payload) => {
			if (!active) return;
			const voters = (payload?.voters ?? []).map(String);
			setVotes({
				voters,
				required: Number(payload?.required ?? 0),
				hasVoted: voters.includes(viewerId),
			});
		});

		const offKicked = subscribeToRoomEvent("room:kicked", () => {
			if (active) navigation.goBack();
		});

		const offClosed = subscribeToRoomEvent("room:closed", () => {
			if (active) navigation.goBack();
		});

		return () => {
			active = false;
			leaveRoomChannel(id);
			offMembers();
			offPlayback();
			offSkip();
			offKicked();
			offClosed();
		};
	}, [room, id, navigation, viewerId]);

	const runAction = useCallback(async (name, action) => {
		setPending(name);
		setActionError("");
		try {
			await action();
		} catch (cause) {
			setActionError(mapApiError(cause));
		} finally {
			setPending("");
		}
	}, []);

	function handleControl(action) {
		runAction(action, () => controlPlayback(id, action));
	}

	function handleVoteSkip() {
		runAction("vote", async () => {
			const result = await voteSkip(id);
			setVotes(result.skipVotes);
		});
	}

	function handleLeave() {
		runAction("leave", async () => {
			await leaveRoom(id);
			navigation.goBack();
		});
	}

	function handleClose() {
		runAction("close", async () => {
			await closeRoom(id);
			navigation.goBack();
		});
	}

	function handleKick(targetId) {
		runAction(`kick:${targetId}`, () => kickMember(id, targetId));
	}

	if (loading) {
		return (
			<View style={styles.loadingContainer}>
				<ActivityIndicator color={colors.fucsia} />
				<StatusBar style="light" />
			</View>
		);
	}

	if (error || !room) {
		return (
			<View style={styles.container}>
				<ScrollView contentContainerStyle={styles.scroll}>
					<Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
						<Text style={styles.backButtonText}>← Volver</Text>
					</Pressable>
					<View style={styles.errorBox}>
						<Text style={styles.errorText}>{error || "La sala no existe."}</Text>
					</View>
				</ScrollView>
				<StatusBar style="light" />
			</View>
		);
	}

	const playing = playback?.status === "playing";
	const canPlay = (room.songs?.length ?? 0) > 0;
	const hasSong = Boolean(playback?.songId) && playback?.status !== "stopped";
	const nonHostCount = (room.members ?? []).filter((m) => m.role !== "host").length;
	const required = votes.required > 0 ? votes.required : Math.floor(nonHostCount / 2) + 1;

	return (
		<View style={styles.container}>
			<ScrollView contentContainerStyle={styles.scroll}>
				<Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
					<Text style={styles.backButtonText}>← Volver</Text>
				</Pressable>

				{actionError ? (
					<View style={styles.errorBox}>
						<Text style={styles.errorText}>{actionError}</Text>
					</View>
				) : null}

				<View style={styles.header}>
					<View style={styles.headerTop}>
						<View style={styles.iconWrapper}>
							<HeadphonesIcon size={24} color={colors.textPrimary} />
						</View>
						<View style={styles.headerText}>
							<Text style={styles.roomName} numberOfLines={1}>
								{room.name}
							</Text>
							<Text style={styles.roomCode}>
								Código <Text style={styles.roomCodeHighlight}>{room.code}</Text>
								{room.isPrivate ? " · privada" : ""}
							</Text>
						</View>
					</View>

					{room.description ? (
						<Text style={styles.description}>{room.description}</Text>
					) : null}

					<View style={styles.metaGrid}>
						<View style={styles.metaItem}>
							<Text style={styles.metaLabel}>Anfitriona</Text>
							<Text style={styles.metaValue}>{host?.username ?? "—"}</Text>
						</View>
						<View style={styles.metaItem}>
							<Text style={styles.metaLabel}>Personas</Text>
							<Text style={styles.metaValue}>
								{room.members?.length ?? 0}/{room.maxCapacity ?? "—"}
							</Text>
						</View>
						<View style={styles.metaItem}>
							<Text style={styles.metaLabel}>Canciones</Text>
							<Text style={styles.metaValue}>{room.songsCount ?? 0}</Text>
						</View>
					</View>
				</View>

				<View style={styles.section}>
					<Text style={styles.sectionTitle}>Reproducción</Text>
					<Text style={styles.playbackStatus}>
						{playing ? "Sonando" : playback?.status === "paused" ? "Pausada" : "Detenida"}
					</Text>
					<Text style={styles.playbackMuted}>
						{hasSong ? "Hay una canción en curso" : "La sala todavía no empezó a reproducir"}
					</Text>

					{isHost ? (
						<View style={styles.controlsRow}>
							<Pressable
								style={[styles.controlButton, styles.controlButtonPrimary]}
								onPress={() => handleControl(playing ? "pause" : "play")}
								disabled={Boolean(pending) || !canPlay}
							>
								<Text style={styles.controlButtonText}>
									{playing ? "Pausar" : "Reproducir"}
								</Text>
							</Pressable>
							<Pressable
								style={[styles.controlButton, (!canPlay || pending) && styles.controlButtonDisabled]}
								onPress={() => handleControl("next")}
								disabled={Boolean(pending) || !canPlay}
							>
								<Text style={styles.controlButtonText}>Siguiente</Text>
							</Pressable>
							<Pressable
								style={[styles.controlButton, (!hasSong || pending) && styles.controlButtonDisabled]}
								onPress={() => handleControl("stop")}
								disabled={Boolean(pending) || !hasSong}
							>
								<Text style={styles.controlButtonText}>Detener</Text>
							</Pressable>
						</View>
					) : (
						<View style={styles.controlsRow}>
							<Pressable
								style={[
									styles.controlButton,
									(votes.hasVoted || !hasSong || pending) && styles.controlButtonDisabled,
								]}
								onPress={handleVoteSkip}
								disabled={votes.hasVoted || !hasSong || Boolean(pending)}
							>
								<Text style={styles.controlButtonText}>
									Votar para saltar ({votes.voters.length}/{required})
								</Text>
							</Pressable>
						</View>
					)}
				</View>

				<View style={styles.section}>
					<Text style={styles.sectionTitle}>
						Personas ({room.members?.length ?? 0}/{room.maxCapacity ?? "—"})
					</Text>
					{(room.members ?? []).map((member) => (
						<View key={member.userId} style={styles.memberRow}>
							<Avatar size={32}>
								<AvatarImage uri={member.avatarUrl} name={member.username} />
								<AvatarFallback name={member.username} />
							</Avatar>
							<View style={styles.memberInfo}>
								<Text style={styles.memberName} numberOfLines={1}>
									{member.username || "Usuario"}
									{member.userId === viewerId ? " (vos)" : ""}
								</Text>
								<Text style={styles.memberRole}>
									{member.role === "host" ? "Anfitriona" : "Participante"}
								</Text>
							</View>
							{isHost && member.role !== "host" ? (
								<Pressable
									style={styles.kickButton}
									onPress={() => handleKick(member.userId)}
									disabled={Boolean(pending)}
								>
									<Text style={styles.kickButtonText}>Sacar</Text>
								</Pressable>
							) : null}
						</View>
					))}
				</View>

				<View style={styles.footer}>
					<Pressable
						style={[styles.footerButton, styles.footerButtonSecondary]}
						onPress={handleLeave}
						disabled={Boolean(pending)}
					>
						<Text style={styles.footerButtonText}>
							{isHost ? "Salir y cerrar" : "Salir"}
						</Text>
					</Pressable>
					{isHost ? (
						<Pressable
							style={[styles.footerButton, styles.footerButtonDanger]}
							onPress={handleClose}
							disabled={Boolean(pending)}
						>
							<Text style={styles.footerButtonText}>Cerrar sala</Text>
						</Pressable>
					) : null}
				</View>
			</ScrollView>

			<StatusBar style="light" />
		</View>
	);
}