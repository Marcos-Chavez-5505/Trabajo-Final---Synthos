import { useCallback, useEffect, useRef, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Image,
	Modal,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
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
	rateHost,
	mapApiError,
	useAuth,
	usePlayer,
	useRoomPlayback,
	connectSocket,
	joinRoomChannel,
	leaveRoomChannel,
	subscribeToRoomEvent,
} from "@synthos/shared";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/Avatar/Avatar";
import {
	HeadphonesIcon,
	LibraryIcon,
	HeartIcon,
	HeartOutlineIcon,
} from "../../components/icons";
import ProgressBar from "../../components/player/ProgressBar/ProgressBar";
import { ROOM_DETAIL_STYLES as styles } from "./RoomDetail.styles";
import { colors } from "../../theme";

const PLAYBACK_FALLBACK = {
	songId: null,
	status: "stopped",
	positionMs: 0,
	updatedAt: 0,
};

const NOOP = () => {};

export default function RoomDetailScreen({ route }) {
	const navigation = useNavigation();
	const { id } = route.params ?? {};
	const { user } = useAuth();
	const viewerId = String(user?.id ?? "");

	// Reproductor global (el mismo de MiniPlayerBar): la sala no tiene audio
	// propio, solo aplica el estado que manda el servidor.
	const { song: currentSong, isMuted, toggleMute, seek } = usePlayer();

	const [room, setRoom] = useState(null);
	const [votes, setVotes] = useState({ voters: [], required: 0, hasVoted: false });
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [actionError, setActionError] = useState("");
	const [pending, setPending] = useState("");
	const [loaded, setLoaded] = useState(false);
	const [rated, setRated] = useState(false);
	const [ratingHover, setRatingHover] = useState(0);
	const [forcedExit, setForcedExit] = useState(null);

	const membership = room?.members?.find((m) => String(m.userId) === viewerId);
	const isHost = membership?.role === "host";
	const host = room?.members?.find((m) => m.role === "host");

	// Fetch inicial de la sala.
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
				setRated(Boolean(found.viewerHasRated));
				setLoaded(true);
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

	// Host: cuando termina una canción, pide el `next` al backend y el
	// `room:playback` de vuelta mueve a todos. Sin esto el host no avanza solo.
	const requestNext = useCallback(() => {
		controlPlayback(id, "next").catch((cause) =>
			setActionError(mapApiError(cause)),
		);
	}, [id]);

	const { playback, isBlocked, resume: resumeAudio, sync: syncPlayback } =
		useRoomPlayback({
			roomId: id,
			songs: room?.songs ?? [],
			isHost,
			onEnded: isHost ? requestNext : null,
		});

	// Ref estable para syncPlayback.
	const syncPlaybackRef = useRef(syncPlayback);
	useEffect(() => {
		syncPlaybackRef.current = syncPlayback;
	}, [syncPlayback]);

	// 1. Conexión al canal: solo depende del id.
	useEffect(() => {
		if (!id) return undefined;
		connectSocket();
		joinRoomChannel(id);
		return () => {
			leaveRoomChannel(id);
		};
	}, [id]);

	// 2. Suscripciones: no dependen de room ni de syncPlayback.
	useEffect(() => {
		if (!loaded) return undefined;

		let active = true;

		getPlayback(id)
			.then((data) => {
				if (!active) return;
				syncPlaybackRef.current(data.playback);
				setVotes(data.skipVotes);
			})
			.catch(() => {});

		const offJoined = subscribeToRoomEvent("joined-room", (payload) => {
			if (!active) return;
			if (Number(payload?.roomId) !== Number(id)) return;
			getPlayback(id)
				.then((data) => {
					if (!active) return;
					syncPlaybackRef.current(data.playback);
					setVotes(data.skipVotes);
				})
				.catch(() => {});
		});

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
			if (!active) return;
			syncPlaybackRef.current(next);
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

		const offRating = subscribeToRoomEvent("room:rating", (payload) => {
			if (!active) return;
			const avg = Number(payload?.avgRating ?? 0);
			setRoom((cur) =>
				cur ? { ...cur, hostRating: avg === 0 ? null : avg } : cur,
			);
		});

		const offKicked = subscribeToRoomEvent("room:kicked", () => {
			if (!active) return;
			setForcedExit({
				title: "Te sacaron de la sala",
				message:
					"El anfitrión te quitó de esta sala. Podés volver al listado para entrar a otra.",
			});
		});

		const offClosed = subscribeToRoomEvent("room:closed", () => {
			if (!active) return;
			setForcedExit({
				title: "La sala se cerró",
				message:
					"Esta sala ya no está disponible. Podés volver al listado para buscar otra.",
			});
		});

		return () => {
			active = false;
			offJoined();
			offMembers();
			offPlayback();
			offSkip();
			offRating();
			offKicked();
			offClosed();
		};
	}, [id, loaded, viewerId]);

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
		runAction(action, async () => {
			const result = await controlPlayback(id, action);
			if (result) syncPlaybackRef.current(result);
		});
	}

	function handleVoteSkip() {
		runAction("vote", async () => {
			const result = await voteSkip(id);
			setVotes(result.skipVotes);
		});
	}

	function handleRate(value) {
		if (!value || value < 1 || value > 5) return;
		runAction("rate", async () => {
			setRated(await rateHost(id, value));
		});
	}

	function handleLeave() {
		Alert.alert(
			"Salir de la sala",
			isHost
				? "¿Cerrás la sala al salir? Se termina para todos."
				: "¿Salís de la sala?",
			[
				{ text: "Cancelar", style: "cancel" },
				{
					text: isHost ? "Cerrar" : "Salir",
					style: "destructive",
					onPress: () =>
						runAction("leave", async () => {
							await leaveRoom(id);
							navigation.goBack();
						}),
				},
			],
		);
	}

	function handleClose() {
		Alert.alert(
			"Cerrar sala",
			"¿Cerrás la sala? Se termina para todos.",
			[
				{ text: "Cancelar", style: "cancel" },
				{
					text: "Cerrar",
					style: "destructive",
					onPress: () =>
						runAction("close", async () => {
							await closeRoom(id);
							navigation.goBack();
						}),
				},
			],
		);
	}

	function handleKick(targetId, username) {
		Alert.alert(
			"Sacar de la sala",
			`¿Sacás a ${username || "este usuario"} de la sala?`,
			[
				{ text: "Cancelar", style: "cancel" },
				{
					text: "Sacar",
					style: "destructive",
					onPress: () =>
						runAction(`kick:${targetId}`, () => kickMember(id, targetId)),
				},
			],
		);
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

	const effectivePlayback = playback ?? PLAYBACK_FALLBACK;
	const playing = effectivePlayback.status === "playing";
	const canPlay = (room.songs?.length ?? 0) > 0;
	const hasSong =
		Boolean(effectivePlayback.songId) && effectivePlayback.status !== "stopped";
	const nonHostCount = (room.members ?? []).filter((m) => m.role !== "host").length;
	const required =
		votes.required > 0 ? votes.required : Math.floor(nonHostCount / 2) + 1;

	// Miembros: host primero, luego alfabético (igual que web).
	const orderedMembers = [...(room.members ?? [])].sort((a, b) => {
		if (a.role === "host") return -1;
		if (b.role === "host") return 1;
		return (a.username || "").localeCompare(b.username || "", "es", {
			sensitivity: "base",
		});
	});

	const hostRating = room.hostRating ?? 0;

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

					{/* Canción actual: portada + título + artista. */}
					<View style={styles.nowPlayingRow}>
						<View style={styles.nowPlayingCover}>
							{currentSong?.coverUrl ? (
								<Image
									source={{ uri: currentSong.coverUrl }}
									style={styles.nowPlayingCoverImage}
									resizeMode="cover"
								/>
							) : (
								<LibraryIcon size={24} color={colors.textMuted} />
							)}
						</View>
						<View style={styles.nowPlayingText}>
							<Text style={styles.nowPlayingTitle} numberOfLines={1}>
								{currentSong?.title ?? "Nada reproduciendo"}
							</Text>
							<Text style={styles.nowPlayingArtist} numberOfLines={1}>
								{currentSong?.artist ??
									"La sala todavía no empezó a reproducir"}
							</Text>
						</View>
					</View>

					{/* Seek: solo el host. La posición en una sala es del servidor. */}
					<ProgressBar
						onSeek={isHost ? seek : NOOP}
						disabled={!isHost}
						style={styles.progress}
					/>

					<Text style={styles.playbackStatus}>
						{playing
							? "Sonando"
							: effectivePlayback.status === "paused"
								? "Pausada"
								: "Detenida"}
					</Text>

					{isBlocked ? (
						<Pressable
							style={[styles.controlButton, styles.controlButtonPrimary, { marginTop: 8 }]}
							onPress={resumeAudio}
						>
							<Text style={styles.controlButtonText}>Tocar para escuchar</Text>
						</Pressable>
					) : null}

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
								style={[
									styles.controlButton,
									(!canPlay || pending) && styles.controlButtonDisabled,
								]}
								onPress={() => handleControl("next")}
								disabled={Boolean(pending) || !canPlay}
							>
								<Text style={styles.controlButtonText}>Siguiente</Text>
							</Pressable>
							<Pressable
								style={[
									styles.controlButton,
									(!hasSong || pending) && styles.controlButtonDisabled,
								]}
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
									(votes.hasVoted || !hasSong || pending) &&
										styles.controlButtonDisabled,
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

					{/* Mute local: no viaja por el socket. */}
					<Pressable
						style={[
							styles.controlButton,
							{ marginTop: 8 },
							isMuted && styles.controlButtonPrimary,
						]}
						onPress={toggleMute}
					>
						<Text style={styles.controlButtonText}>
							{isMuted ? "Activar sonido" : "Silenciar"}
						</Text>
					</Pressable>

					{/* Rating del anfitrión: solo no-host y solo si todavía no calificó. */}
					{!isHost ? (
						<View style={styles.ratingRow}>
							{rated ? (
								<Text style={styles.ratingDone}>Calificaste al anfitrión</Text>
							) : (
								<View style={styles.ratingStars}>
									{[1, 2, 3, 4, 5].map((star) => {
										const active = star <= (ratingHover || hostRating);
										return (
											<Pressable
												key={star}
												onPress={() => handleRate(star)}
												onPressIn={() => setRatingHover(star)}
												onPressOut={() => setRatingHover(0)}
												disabled={pending === "rate"}
												hitSlop={6}
											>
												{active ? (
													<HeartIcon size={24} color={colors.fucsia} />
												) : (
													<HeartOutlineIcon size={24} color={colors.textMuted} />
												)}
											</Pressable>
										);
									})}
								</View>
							)}
						</View>
					) : null}
				</View>

				<View style={styles.section}>
					<Text style={styles.sectionTitle}>
						Personas ({room.members?.length ?? 0}/{room.maxCapacity ?? "—"})
					</Text>
					{orderedMembers.map((member) => (
						<View key={member.userId} style={styles.memberRow}>
							<Pressable
								onPress={() => {
									if (String(member.userId) === viewerId) {
										navigation.navigate("Profile");
										return;
									}
									navigation.navigate("ProfilePublic", {
										userId: member.userId,
									});
								}}
								style={styles.memberLink}
								accessibilityRole="button"
								accessibilityLabel={`Ver perfil de ${member.username || "usuario"}`}
							>
								<Avatar size={32}>
									<AvatarImage uri={member.avatarUrl} name={member.username} />
									<AvatarFallback name={member.username} />
								</Avatar>
								<View style={styles.memberInfo}>
									<Text style={styles.memberName} numberOfLines={1}>
										{member.username || "Usuario"}
										{String(member.userId) === viewerId ? " (vos)" : ""}
									</Text>
									<Text style={styles.memberRole}>
										{member.role === "host" ? "Anfitriona" : "Participante"}
									</Text>
								</View>
							</Pressable>
							{isHost && member.role !== "host" ? (
								<Pressable
									style={styles.kickButton}
									onPress={() => handleKick(member.userId, member.username)}
									disabled={Boolean(pending)}
								>
									<Text style={styles.kickButtonText}>Sacar</Text>
								</Pressable>
							) : null}
						</View>
					))}
				</View>

				<View style={styles.footer}>
					{isHost ? (
						<Pressable
							style={[styles.footerButton, styles.footerButtonDanger]}
							onPress={handleClose}
							disabled={Boolean(pending)}
						>
							<Text style={styles.footerButtonText}>Cerrar sala</Text>
						</Pressable>
					) : (
						<Pressable
							style={[styles.footerButton, styles.footerButtonSecondary]}
							onPress={handleLeave}
							disabled={Boolean(pending)}
						>
							<Text style={styles.footerButtonText}>Salir</Text>
						</Pressable>
					)}
				</View>
			</ScrollView>

			{/* Modal de expulsión / cierre. */}
			<Modal
				visible={Boolean(forcedExit)}
				transparent
				animationType="fade"
				onRequestClose={() => {
					setForcedExit(null);
					navigation.goBack();
				}}
			>
				<View style={styles.modalBackdrop}>
					<View style={styles.modalCard}>
						<Text style={styles.modalTitle}>
							{forcedExit?.title ?? "Sala no disponible"}
						</Text>
						<Text style={styles.modalMessage}>
							{forcedExit?.message ?? "Volvé al listado para continuar."}
						</Text>
						<Pressable
							style={[styles.footerButton, styles.footerButtonDanger]}
							onPress={() => {
								setForcedExit(null);
								navigation.goBack();
							}}
						>
							<Text style={styles.footerButtonText}>Ir a Salas</Text>
						</Pressable>
					</View>
				</View>
			</Modal>

			<StatusBar style="light" />
		</View>
	);
}