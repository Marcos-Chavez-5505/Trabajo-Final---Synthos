import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	AppState,
	Image,
	KeyboardAvoidingView,
	Platform,
	Pressable,
	ScrollView,
	StyleSheet,
	Text,
	TextInput,
	View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, LinearTransition } from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { File } from "expo-file-system";
import {
	getPlaylistById,
	getSongById,
	listSentInvitations,
	mapApiError,
	removePlaylist,
	removePlaylistCover,
	removePlaylistMember,
	removeSongFromPlaylist,
	sendInvitation,
	updateFavoritesOrder,
	updatePlaylist,
	updatePlaylistSongsOrder,
	uploadPlaylistCover,
	useAuth,
	useFavorites,
	usePlayer,
	useReorderSongs,
} from "@synthos/shared";
import AvatarStack from "../../components/ui/AvatarStack/AvatarStack";
import ScalePressable from "../../components/ui/ScalePressable/ScalePressable";
import PlaylistCover from "../../components/playlists/PlaylistCover/PlaylistCover";
import PlaylistSongRow from "../../components/playlists/PlaylistSongRow/PlaylistSongRow";
import MemberRow from "../../components/playlists/MemberRow/MemberRow";
import InviteUserSheet from "../../components/playlists/InviteUserSheet/InviteUserSheet";
import {
	MusicNoteIcon,
	PencilLineIcon,
	PlayIcon,
	TrashIcon,
	UserGroupIcon,
	UserIcon,
} from "../../components/icons";
import { colors, spacing } from "../../theme";
import {
	runWithToast,
	showActionError,
	showSuccess,
} from "../../lib/toastMessages";
import { PLAYLIST_DETAIL_STYLES as styles } from "./PlaylistDetail.styles";

const ROW_EXIT_MS = 150;
const EXIT_TIMEOUT_MS = 400;
const NEIGHBOR_SEPARATION = 10;
const MAX_NAME_EDIT = 50;
const MAX_DESCRIPTION = 200;
const MAX_COVER_BYTES = 2 * 1024 * 1024;
const EMPTY_ORDER = [];

// Mismo criterio que el layout del detalle web: spring críticamente
// amortiguado, así las filas se acomodan sin rebotar.
const ROW_LAYOUT = LinearTransition.springify()
	.damping(45)
	.stiffness(500);

export default function PlaylistDetailScreen({ route }) {
	const navigation = useNavigation();
	const insets = useSafeAreaInsets();
	const { id } = route.params ?? {};
	const { user } = useAuth();
	const userId = user?.id ?? null;
	const { playSongs, addToQueue, removeFromPlaylistQueue, removeFromFavoritesQueue, clearQueueIfSource } =
		usePlayer();
	const { isFavorite } = useFavorites();

	const [response, setResponse] = useState({ key: null, playlist: null });
	const [loadError, setLoadError] = useState("");
	const [loadVersion, setLoadVersion] = useState(0);
	const [songById, setSongById] = useState(() => new Map());
	const [invitationsResponse, setInvitationsResponse] = useState({
		key: null,
		items: [],
	});
	const [removingIds, setRemovingIds] = useState(() => new Set());
	const [exitingIds, setExitingIds] = useState(() => new Set());
	const [hasExitingRow, setHasExitingRow] = useState(false);
	const [openRowId, setOpenRowId] = useState(null);
	const [inviting, setInviting] = useState(false);
	const [editing, setEditing] = useState(false);
	const [draftName, setDraftName] = useState("");
	const [draftDescription, setDraftDescription] = useState("");
	const [savingEdit, setSavingEdit] = useState(false);
	const [editError, setEditError] = useState("");
	const [coverBusy, setCoverBusy] = useState(false);
	const [coverMenuOpen, setCoverMenuOpen] = useState(false);
	const [draggingId, setDraggingId] = useState(null);
	const [dragTarget, setDragTarget] = useState(null);
	const [scrollEnabled, setScrollEnabled] = useState(true);

	const key = `${userId}:${id}`;
	const playlist = response.key === key ? response.playlist : null;
	const loaded = response.key === key;
	const loading = userId !== null && !loaded && !loadError;
	const isCreator = playlist?.role === "creator";

	const loadPlaylist = useCallback(() => {
		if (!userId) return Promise.resolve();

		return getPlaylistById(userId, id).then(
			(loadedPlaylist) => {
				setLoadError("");
				setResponse({ key: `${userId}:${id}`, playlist: loadedPlaylist });
			},
			(cause) => {
				setLoadError(mapApiError(cause));
			},
		);
	}, [userId, id]);

	useEffect(() => {
		loadPlaylist();
	}, [loadPlaylist, loadVersion]);

	// Solo el creador de una colaborativa administra invitaciones. Las
	// personales no pueden tenerlas: invitar las convierte en colaborativas.
	const canManageInvitations =
		Boolean(playlist) && playlist.role === "creator" && !playlist.isFavorites;
	const invitations = invitationsResponse.key === key ? invitationsResponse.items : [];

	const loadInvitations = useCallback(() => {
		if (!userId || !canManageInvitations) return Promise.resolve();

		return listSentInvitations(userId, id)
			.then((items) => setInvitationsResponse({ key: `${userId}:${id}`, items }))
			.catch((cause) => showActionError(cause, "playlist:invitations:load"));
	}, [userId, id, canManageInvitations]);

	useEffect(() => {
		loadInvitations();
	}, [loadInvitations]);

	// Resolución de canciones por conjunto estable de ids (no se re-pide al
	// reordenar ni al quitar una canción).
	const songIdsKey = playlist
		? [...playlist.songIds].map(String).sort().join(",")
		: null;
	const songByIdRef = useRef(songById);
	const coverTouchRef = useRef(false);

	// Al salir de la pantalla el menú de la portada no debe quedar abierto.
	useEffect(() => {
		const unsubscribe = navigation.addListener("blur", () =>
			setCoverMenuOpen(false),
		);
		return unsubscribe;
	}, [navigation]);

	useEffect(() => {
		songByIdRef.current = songById;
	}, [songById]);

	useEffect(() => {
		if (!songIdsKey) return undefined;

		const ids = songIdsKey.split(",").filter(Boolean);
		const pendingIds = ids.filter((songId) => {
			const cached = songByIdRef.current.get(songId);
			// Las que fallaron (null) se reintentan en el próximo cambio.
			return cached === undefined || cached === null;
		});

		if (pendingIds.length === 0) return undefined;

		let active = true;

		Promise.all(pendingIds.map((songId) => getSongById(songId).catch(() => null)))
			.then((songs) => {
				if (!active) return;
				setSongById((prev) => {
					const next = new Map(prev);
					pendingIds.forEach((sid, i) => next.set(sid, songs[i]));
					return next;
				});
			})
			.catch((cause) => {
				if (active) showActionError(cause, "playlist:songs:load");
			});

		return () => {
			active = false;
		};
	}, [songIdsKey]);

	const songIds = songIdsKey ? songIdsKey.split(",").filter(Boolean) : [];
	const resolving = Boolean(songIdsKey) && songIds.some((sid) => !songById.has(sid));

	// Reordenar: creador y colaboradores (igual que agregar/quitar).
	const canReorder = Boolean(playlist) && playlist.role !== null;

	const initialOrder = useMemo(
		() => playlist?.songIds ?? EMPTY_ORDER,
		[playlist],
	);

	const saveOrder = useCallback(
		async (ids) => {
			if (!playlist) throw new Error("No hay playlist cargada.");
			if (playlist.isFavorites) return updateFavoritesOrder(userId, ids);
			return updatePlaylistSongsOrder(userId, id, ids);
		},
		[playlist, userId, id],
	);

	const handleMerged = useCallback(() => {
		// El backend fusionó (alta o baja concurrente): recargamos.
		loadPlaylist();
	}, [loadPlaylist]);

	const handleReorderError = useCallback((cause) => {
		showActionError(cause, "playlist:order");
	}, []);

	const { order, reorder, flush } = useReorderSongs({
		initialOrder,
		saveOrder,
		onMerged: handleMerged,
		onError: handleReorderError,
	});

	// Portada: imagen subida > carátula de la primera canción del orden actual
	// > ícono.
	const firstOrderedSong =
		order.length > 0 ? songById.get(String(order[0])) : null;
	const firstOrderedCoverUrl = firstOrderedSong?.coverUrl ?? null;
	const coverUri = playlist?.coverUrl || firstOrderedCoverUrl || null;
	const hasCoverImage = Boolean(coverUri);
	const canEditCover = Boolean(playlist) && isCreator && !playlist.isFavorites;
	const hasMembers = Boolean(playlist?.members.length);

	const playlistIds = new Set((playlist?.songIds ?? []).map(String));
	const orderedEntries = order
		.map((sid) => ({ sid, song: songById.get(String(sid)) ?? null }))
		.filter(({ sid }) => playlistIds.has(String(sid)));
	const visibleRows = orderedEntries.filter(
		({ sid }) => !removingIds.has(String(sid)),
	);
	const playable = visibleRows.map(({ song }) => song).filter(Boolean);
	const missing = visibleRows.filter(({ song }) => song === null).length;

	const visibleCount = (playlist?.songIds ?? []).filter(
		(sid) => !removingIds.has(String(sid)),
	).length;
	const orderIds = new Set(order.map(String));
	const orderInSync =
		orderIds.size === playlistIds.size &&
		[...playlistIds].every((sid) => orderIds.has(sid));

	const visibleRowsRef = useRef(visibleRows);
	visibleRowsRef.current = visibleRows;
	const orderRef = useRef(order);
	orderRef.current = order;

	// ----- drag & drop -----
	const rowLayoutsRef = useRef(new Map());
	const draggingIdRef = useRef(null);
	const dragStartIndexRef = useRef(-1);
	const dragTargetRef = useRef(null);

	const handleDragStart = useCallback((songId) => {
		const from = visibleRowsRef.current.findIndex(
			({ sid }) => String(sid) === String(songId),
		);
		if (from === -1) return;

		draggingIdRef.current = songId;
		dragStartIndexRef.current = from;
		dragTargetRef.current = from;
		setDraggingId(songId);
		setDragTarget(from);
		setScrollEnabled(false);
		setOpenRowId(null);
	}, []);

	const handleDragMove = useCallback((offset) => {
		const dragging = draggingIdRef.current;
		if (!dragging) return;

		const layout = rowLayoutsRef.current.get(String(dragging));
		const step = Math.max(40, (layout?.height ?? 56) + 4);
		const max = Math.max(0, visibleRowsRef.current.length - 1);
		const next = Math.max(
			0,
			Math.min(max, dragStartIndexRef.current + Math.round(offset / step)),
		);

		if (next !== dragTargetRef.current) {
			dragTargetRef.current = next;
			setDragTarget(next);
		}
	}, []);

	const handleDragEnd = useCallback(() => {
		const dragging = draggingIdRef.current;
		const from = dragStartIndexRef.current;
		const to = dragTargetRef.current;

		draggingIdRef.current = null;
		dragStartIndexRef.current = -1;
		dragTargetRef.current = null;
		setDraggingId(null);
		setDragTarget(null);
		setScrollEnabled(true);

		if (!dragging || to === null || to === from) return;

		const rows = visibleRowsRef.current;
		const base = rows
			.filter(({ sid }) => String(sid) !== String(dragging))
			.map(({ sid }) => sid);
		const insertAt = Math.max(0, Math.min(base.length, to));
		const nextVisible = [...base];
		nextVisible.splice(insertAt, 0, dragging);

		// Los ids ocultos (quitas pendientes) conservan su lugar en el orden.
		const visibleSet = new Set(rows.map(({ sid }) => String(sid)));
		let cursor = 0;
		const nextOrder = orderRef.current.map((songId) =>
			visibleSet.has(String(songId)) ? nextVisible[cursor++] : songId,
		);

		reorder(nextOrder);
	}, [reorder]);

	const handleRowLayout = useCallback((songId, event) => {
		const { y, height } = event.nativeEvent.layout;
		rowLayoutsRef.current.set(String(songId), { y, height });
	}, []);

	const handleRowClosed = useCallback((rowId) => {
		setOpenRowId((prev) =>
			String(prev) === String(rowId) ? null : prev,
		);
	}, []);

	const handleCloseRails = useCallback(() => {
		setOpenRowId(null);
	}, []);

	// Separa a los vecinos del punto de inserción 10 px, como la web.
	function neighborShiftFor(songId) {
		if (dragTarget === null || !draggingId) return 0;

		const base = visibleRows
			.filter(({ sid }) => String(sid) !== String(draggingId))
			.map(({ sid }) => String(sid));
		const position = base.indexOf(String(songId));

		if (position === dragTarget - 1) return -NEIGHBOR_SEPARATION;
		if (position === dragTarget) return NEIGHBOR_SEPARATION;
		return 0;
	}

	function indicatorTop() {
		if (dragTarget === null || !draggingId) return null;

		const base = visibleRows.filter(
			({ sid }) => String(sid) !== String(draggingId),
		);
		if (base.length === 0) return 0;

		if (dragTarget >= base.length) {
			const last = rowLayoutsRef.current.get(String(base[base.length - 1].sid));
			return last ? last.y + last.height : 0;
		}

		const row = rowLayoutsRef.current.get(String(base[dragTarget].sid));
		return row?.y ?? 0;
	}

	// ----- quitar canciones -----
	const removalQueueRef = useRef(Promise.resolve());
	const exitTimerRef = useRef(null);
	const exitTimersRef = useRef(new Set());

	useEffect(
		() => () => {
			clearTimeout(exitTimerRef.current);
			for (const timer of exitTimersRef.current) clearTimeout(timer);
			exitTimersRef.current.clear();
		},
		[],
	);

	function handleRemoveSong(songId) {
		const key = String(songId);

		if (removingIds.has(key) || exitingIds.has(key)) return;

		setExitingIds((prev) => new Set(prev).add(key));
		setHasExitingRow(true);
		clearTimeout(exitTimerRef.current);
		exitTimerRef.current = setTimeout(
			() => setHasExitingRow(false),
			EXIT_TIMEOUT_MS,
		);

		const timer = setTimeout(() => {
			exitTimersRef.current.delete(timer);

			setRemovingIds((prev) => new Set(prev).add(key));

			removalQueueRef.current = removalQueueRef.current
				.then(async () => {
					const updated = await removeSongFromPlaylist(userId, id, songId, {
						isFavorites: Boolean(playlist?.isFavorites),
					});

					if (!updated) {
						throw new Error("No se pudo quitar la canción de la playlist.");
					}

					setResponse({ key: `${userId}:${id}`, playlist: updated });
					setRemovingIds((prev) => {
						if (!prev.has(key)) return prev;
						const next = new Set(prev);
						next.delete(key);
						return next;
					});
					setExitingIds((prev) => {
						if (!prev.has(key)) return prev;
						const next = new Set(prev);
						next.delete(key);
						return next;
					});

					if (playlist?.isFavorites) removeFromFavoritesQueue(songId);
					else removeFromPlaylistQueue(songId, id);
				})
				.catch((cause) => {
					setRemovingIds((prev) => {
						if (!prev.has(key)) return prev;
						const next = new Set(prev);
						next.delete(key);
						return next;
					});
					setExitingIds((prev) => {
						if (!prev.has(key)) return prev;
						const next = new Set(prev);
						next.delete(key);
						return next;
					});
					showActionError(cause, "playlist:song:remove");
				});
		}, ROW_EXIT_MS);

		exitTimersRef.current.add(timer);
	}

	// Mueve una canción a una posición (1-based) dentro de la lista visible.
	function handleMoveSong(songId, position) {
		if (!Number.isFinite(position)) return;

		const visibleIds = visibleRows.map(({ sid }) => sid);
		const from = visibleIds.findIndex((sid) => String(sid) === String(songId));
		if (from === -1) return;

		const to = Math.min(
			Math.max(Math.trunc(position) - 1, 0),
			visibleIds.length - 1,
		);
		if (to === from) return;

		const sid = visibleIds[from];
		const nextVisible = [...visibleIds];
		nextVisible.splice(from, 1);
		nextVisible.splice(to, 0, sid);

		const visibleSet = new Set(visibleIds.map(String));
		let cursor = 0;
		const nextOrder = order.map((songIdToMove) =>
			visibleSet.has(String(songIdToMove)) ? nextVisible[cursor++] : songIdToMove,
		);

		reorder(nextOrder);
	}

	// ----- edición inline -----
	function startEdit() {
		setOpenRowId(null);
		setDraftName(playlist.name);
		setDraftDescription(playlist.description ?? "");
		setEditError("");
		setEditing(true);
	}

	function cancelEdit() {
		if (savingEdit) return;
		setEditError("");
		setEditing(false);
	}

	async function saveEdit() {
		if (savingEdit || !playlist) return;

		const name = draftName.trim();
		if (!name) {
			setEditError("Ponele un nombre a la playlist.");
			return;
		}

		setEditError("");
		setSavingEdit(true);

		try {
			const updated = await updatePlaylist(userId, id, {
				name,
				description: draftDescription,
			});

			if (updated) {
				setResponse({ key: `${userId}:${id}`, playlist: updated });
				setEditing(false);
				showSuccess("playlist:update");
			}
		} catch (cause) {
			setEditError(mapApiError(cause));
		} finally {
			setSavingEdit(false);
		}
	}

	// ----- borrar playlist -----
	function confirmDelete() {
		setOpenRowId(null);
		Alert.alert(
			"¿Eliminar playlist?",
			"Esta acción no se puede deshacer.",
			[
				{ text: "Cancelar", style: "cancel" },
				{
					text: "Eliminar",
					style: "destructive",
					onPress: async () => {
						try {
							const deleted = await removePlaylist(userId, id);
							if (!deleted) {
								showActionError(
									{ message: "No se pudo eliminar la playlist." },
									"playlist:delete",
								);
								return;
							}
							clearQueueIfSource(id);
							showSuccess("playlist:delete");
							navigation.goBack();
						} catch (cause) {
							showActionError(cause, "playlist:delete");
						}
					},
				},
			],
		);
	}

	// ----- portada -----
	async function pickCover() {
		if (coverBusy || !userId) return;

		const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (status !== "granted") {
			showActionError(
				{ message: "Necesitamos permiso para acceder a tus fotos." },
				"playlist:cover:upload",
			);
			return;
		}

		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ["images"],
			allowsEditing: true,
			aspect: [1, 1],
			quality: 0.7,
		});

		if (result.canceled) return;

		const asset = result.assets?.[0];
		if (!asset) return;

		if (asset.fileSize && asset.fileSize > MAX_COVER_BYTES) {
			showActionError(
				{ message: "La imagen no puede superar los 2 MB." },
				"playlist:cover:upload",
			);
			return;
		}

		setCoverBusy(true);

		// Expo SDK 58 trae su propio `fetch`, que no acepta el objeto
		// `{ uri, name, type }` de RN dentro de FormData. `File` expone `bytes()`,
		// que es lo que ese fetch convierte al multipart.
		const task = uploadPlaylistCover(userId, id, new File(asset.uri));
		runWithToast("playlist:cover:upload", task);

		try {
			const updated = await task;
			if (updated) setResponse({ key: `${userId}:${id}`, playlist: updated });
		} catch {
			// El toast de `runWithToast` ya mostró el error.
		} finally {
			setCoverBusy(false);
		}
	}

	async function handleRemoveCover() {
		if (coverBusy || !playlist?.coverUrl || !userId) return;

		setCoverBusy(true);

		const task = removePlaylistCover(userId, id);
		runWithToast("playlist:cover:remove", task);

		try {
			const updated = await task;
			if (updated) setResponse({ key: `${userId}:${id}`, playlist: updated });
		} catch {
			// El toast de `runWithToast` ya mostró el error.
		} finally {
			setCoverBusy(false);
		}
	}

	// ----- invitaciones y participantes -----
	async function handleInvite(person) {
		const result = await sendInvitation(userId, id, person.id);
		showSuccess("playlist:invite");

		if (result.converted) await loadPlaylist();
		loadInvitations();

		return result;
	}

	function openInvite() {
		setOpenRowId(null);
		setInviting(true);
	}

	function openPersonProfile(personId) {
		if (String(personId) === String(userId)) {
			navigation.navigate("Profile");
			return;
		}
		navigation.navigate("ProfilePublic", { userId: personId });
	}

	function confirmRemoveMember(member) {
		Alert.alert(
			"¿Sacar a esta persona?",
			"Va a dejar de participar de la playlist.",
			[
				{ text: "Cancelar", style: "cancel" },
				{
					text: "Echar",
					style: "destructive",
					onPress: async () => {
						try {
							await removePlaylistMember(userId, id, member.id);
							await loadPlaylist();
							loadInvitations();
							showSuccess("playlist:member:remove");
						} catch (cause) {
							showActionError(cause, "playlist:member:remove");
						}
					},
				},
			],
		);
	}

	// Flush del orden al salir o al mandar la app a segundo plano.
	useEffect(() => {
		const subscription = AppState.addEventListener("change", (state) => {
			if (state !== "active") flush().catch(() => {});
		});

		return () => {
			subscription.remove();
			flush().catch(() => {});
		};
	}, [flush]);

	if (loading) {
		return (
			<View style={styles.centered}>
				<ActivityIndicator color={colors.fucsia} />
				<StatusBar style="light" />
			</View>
		);
	}

	if (loadError) {
		return (
			<View style={[styles.centered, { paddingTop: insets.top }]}>
				<Text style={styles.error}>{loadError}</Text>
				<Pressable
					onPress={() => setLoadVersion((prev) => prev + 1)}
					style={styles.secondaryButton}
					accessibilityRole="button"
				>
					<Text style={styles.buttonText}>Reintentar</Text>
				</Pressable>
				<StatusBar style="light" />
			</View>
		);
	}

	if (loaded && !playlist) {
		return (
			<View style={[styles.centered, { paddingTop: insets.top }]}>
				<Text style={styles.emptyTitle}>No encontramos esa playlist</Text>
				<Text style={styles.mutedMessage}>
					Puede que la hayas eliminado, o que no sea tuya.
				</Text>
				<Pressable
					onPress={() => navigation.goBack()}
					style={styles.secondaryButton}
					accessibilityRole="button"
				>
					<Text style={styles.buttonText}>Ir a mis playlists</Text>
				</Pressable>
				<StatusBar style="light" />
			</View>
		);
	}

	if (!playlist) {
		return (
			<View style={styles.centered}>
				<ActivityIndicator color={colors.fucsia} />
				<StatusBar style="light" />
			</View>
		);
	}

	const showDelete = isCreator && !playlist.isFavorites;
	const playIndexFor = (index) =>
		visibleRows.slice(0, index).filter(({ song }) => song).length;

	// Un toque fuera de la portada cierra su menú. El wrapper de la portada
	// marca el toque antes de que el evento suba hasta acá; así los botones del
	// menú (subir/quitar) llegan a ejecutarse.
	const handleScreenTouchStart = () => {
		const insideCover = coverTouchRef.current;
		coverTouchRef.current = false;
		if (coverMenuOpen && !insideCover) setCoverMenuOpen(false);
	};

	return (
		<View style={styles.container} onTouchStart={handleScreenTouchStart}>
			<KeyboardAvoidingView
				style={styles.flex}
				behavior={Platform.OS === "ios" ? "padding" : undefined}
			>
				<ScrollView
					scrollEnabled={scrollEnabled}
					onScroll={() => {
						if (openRowId !== null) setOpenRowId(null);
						if (coverMenuOpen) setCoverMenuOpen(false);
					}}
					scrollEventThrottle={16}
					keyboardShouldPersistTaps="handled"
					contentContainerStyle={{
						paddingTop: insets.top + spacing.md,
						paddingBottom: spacing.xxl,
					}}
					showsVerticalScrollIndicator={false}
				>
					<View style={styles.headerWrapper}>
						{hasCoverImage ? (
							<View pointerEvents="none" style={styles.headerGlow}>
								<Image
									source={{ uri: coverUri }}
									style={StyleSheet.absoluteFill}
									blurRadius={50}
									opacity={0.24}
									resizeMode="cover"
								/>
								<LinearGradient
									colors={[`${colors.surface}00`, colors.surface]}
									start={{ x: 0.5, y: 0 }}
									end={{ x: 0.5, y: 1 }}
									style={StyleSheet.absoluteFill}
								/>
							</View>
						) : null}

						<View style={styles.header}>
							<View
								style={styles.coverWrapper}
								onTouchStart={() => {
									coverTouchRef.current = true;
								}}
							>
								<PlaylistCover
									uri={coverUri}
									canEdit={canEditCover}
									busy={coverBusy}
									hasUploadedCover={Boolean(playlist.coverUrl)}
									menuOpen={coverMenuOpen}
									onMenuOpenChange={setCoverMenuOpen}
									onUpload={pickCover}
									onRemove={handleRemoveCover}
								/>
							</View>

							{editing ? (
								<View style={styles.editBlock}>
									<TextInput
										value={draftName}
										onChangeText={setDraftName}
										placeholder="Título"
										placeholderTextColor={colors.textMuted}
										maxLength={MAX_NAME_EDIT}
										style={styles.nameInput}
										accessibilityLabel="Nombre de la playlist"
									/>
									<TextInput
										value={draftDescription}
										onChangeText={setDraftDescription}
										placeholder="Descripción"
										placeholderTextColor={colors.textMuted}
										maxLength={MAX_DESCRIPTION}
										multiline
										style={styles.descriptionInput}
										accessibilityLabel="Descripción de la playlist"
									/>

									{editError ? (
										<Text style={styles.formError}>{editError}</Text>
									) : null}

									<View style={styles.editButtons}>
										<Pressable
											onPress={saveEdit}
											disabled={savingEdit}
											style={({ pressed }) => [
												styles.primaryButton,
												pressed && styles.pressed,
												savingEdit && styles.disabled,
											]}
											accessibilityRole="button"
										>
											<Text style={styles.buttonText}>
												{savingEdit ? "Guardando…" : "Guardar"}
											</Text>
										</Pressable>
										<Pressable
											onPress={cancelEdit}
											disabled={savingEdit}
											style={({ pressed }) => [
												styles.secondaryButton,
												pressed && styles.pressed,
												savingEdit && styles.disabled,
											]}
											accessibilityRole="button"
										>
											<Text style={styles.buttonText}>Cancelar</Text>
										</Pressable>
									</View>

									{showDelete ? (
										<Pressable
											onPress={confirmDelete}
											style={({ pressed }) => [
												styles.deleteButton,
												pressed && styles.pressed,
											]}
											accessibilityRole="button"
											accessibilityLabel="Eliminar playlist"
										>
											<TrashIcon size={18} color={colors.lighter} />
											<Text style={styles.deleteText}>Eliminar playlist</Text>
										</Pressable>
									) : null}
								</View>
							) : (
								<View style={styles.infoBlock}>
									<View style={styles.nameRow}>
										<Text style={styles.name} numberOfLines={2}>
											{playlist.name}
										</Text>
										{showDelete ? (
											<Pressable
												onPress={startEdit}
												style={({ pressed }) => [
													styles.pencil,
													pressed && styles.pressed,
												]}
												accessibilityRole="button"
												accessibilityLabel="Editar nombre y descripción"
												hitSlop={8}
											>
												<PencilLineIcon size={20} color={colors.textPrimary} />
											</Pressable>
										) : null}
									</View>

									<View style={styles.metaRow}>
										{hasMembers ? (
											<AvatarStack
												members={playlist.members}
												onPress={
													isCreator && !playlist.isFavorites
														? openInvite
														: undefined
												}
												onMemberPress={(member) =>
													openPersonProfile(member.id)
												}
											/>
										) : null}

										{playlist.isCollaborative ? (
											<UserGroupIcon size={24} color={colors.textPrimary} />
										) : (
											<UserIcon size={24} color={colors.textPrimary} />
										)}

										<Text style={styles.bullet}>•</Text>
										<Text style={styles.count}>
											{visibleCount}{" "}
											{visibleCount === 1 ? "canción" : "canciones"}
										</Text>
									</View>

									{playlist.description ? (
										<Text style={styles.description}>{playlist.description}</Text>
									) : null}

									<View style={styles.actionsRow}>
										<ScalePressable
											onPress={() => {
												setOpenRowId(null);
												playSongs(playable, 0, {
													playlistId: id,
													isFavorites: Boolean(playlist.isFavorites),
												});
											}}
											disabled={playable.length === 0}
											style={[
												styles.playButton,
												playable.length === 0 && styles.disabled,
											]}
											accessibilityRole="button"
											accessibilityLabel={`Reproducir ${playlist.name}`}
										>
											<PlayIcon size={22} color={colors.lighter} />
										</ScalePressable>

										{!hasMembers && isCreator && !playlist.isFavorites ? (
											<Pressable
												onPress={openInvite}
												style={({ pressed }) => [
													styles.inviteButton,
													pressed && styles.pressed,
												]}
												accessibilityRole="button"
												accessibilityLabel="Invitar personas"
											>
												<Text style={styles.inviteButtonText}>+</Text>
											</Pressable>
										) : null}
									</View>
								</View>
							)}
						</View>
					</View>

					{playlist.isFavorites ? (
						<Text style={styles.favoritesNote}>
							Se creó sola cuando marcaste tu primera canción favorita. Para
							cambiarla, usá el corazón en cada canción.
						</Text>
					) : null}

					{resolving ? (
						<View style={styles.stateRow}>
							<ActivityIndicator color={colors.textMuted} />
							<Text style={styles.mutedMessage}>Buscando canciones…</Text>
						</View>
					) : null}

					{!resolving &&
					!hasExitingRow &&
					visibleRows.length === 0 &&
					(playlist.songIds.length === 0 || orderInSync) ? (
						<Animated.View entering={FadeIn.duration(180)}>
							<EmptyPlaylist isFavorites={playlist.isFavorites} />
						</Animated.View>
					) : null}

					{!resolving && (visibleRows.length > 0 || hasExitingRow) ? (
						<View style={styles.songList}>
							{visibleRows.map(({ sid, song }, index) =>
								song === null ? (
									<Animated.View
										key={sid}
										layout={ROW_LAYOUT}
										style={styles.unavailableRow}
									>
										<Text style={styles.mutedMessage}>
											Esta canción ya no está disponible.
										</Text>
									</Animated.View>
								) : (
									<Animated.View
										key={sid}
										layout={ROW_LAYOUT}
										onLayout={(event) => handleRowLayout(sid, event)}
									>
										<PlaylistSongRow
											song={song}
											index={index}
											total={visibleRows.length}
											isFavorite={isFavorite(song.id)}
											onPlay={() =>
												playSongs(playable, playIndexFor(index), {
													playlistId: id,
													isFavorites: Boolean(playlist.isFavorites),
												})
											}
											onAddToQueue={() => addToQueue(song)}
											onRemove={() => handleRemoveSong(song.id)}
											onMoveTo={(position) => handleMoveSong(song.id, position)}
											canRemove={playlist.role !== null}
											canReorder={canReorder}
											openRowId={openRowId}
											onOpened={setOpenRowId}
											onClosed={handleRowClosed}
											onOtherPress={handleCloseRails}
											exiting={exitingIds.has(String(sid))}
											dragging={draggingId !== null && String(draggingId) === String(sid)}
											neighborShift={neighborShiftFor(sid)}
											onDragStart={handleDragStart}
											onDragMove={handleDragMove}
											onDragEnd={handleDragEnd}
										/>
									</Animated.View>
								),
							)}

							{dragTarget !== null ? (
								<View
									pointerEvents="none"
									style={[styles.indicator, { top: indicatorTop() ?? 0 }]}
								/>
							) : null}
						</View>
					) : null}

					{!resolving && missing > 0 ? (
						<Text style={styles.missingNote}>
							{missing}{" "}
							{missing === 1
								? "canción ya no está disponible y no se puede reproducir."
								: "canciones ya no están disponibles y no se pueden reproducir."}
						</Text>
					) : null}

					{playlist.isCollaborative && playlist.members.length > 0 ? (
						<View style={styles.membersSection}>
							<Text style={styles.sectionTitle}>Participantes</Text>
							{playlist.members.map((member) => (
								<MemberRow
									key={member.id}
									member={member}
									canRemove={isCreator && member.role !== "creator"}
									onRemove={() => confirmRemoveMember(member)}
									onPress={() => openPersonProfile(member.id)}
								/>
							))}
						</View>
					) : null}
				</ScrollView>
			</KeyboardAvoidingView>

			{isCreator && !playlist.isFavorites ? (
				<InviteUserSheet
					open={inviting}
					onClose={() => setInviting(false)}
					userId={userId}
					isCollaborative={playlist.isCollaborative}
					excludeIds={[
						...playlist.members.map((member) => member.id),
						...invitations.map((invitation) => invitation.receiver.id),
					]}
					invitations={invitations}
					onInvite={handleInvite}
				/>
			) : null}

			<StatusBar style="light" />
		</View>
	);
}

function EmptyPlaylist({ isFavorites }) {
	return (
		<View style={styles.emptyState}>
			<MusicNoteIcon size={40} color={colors.textMuted} />
			<Text style={styles.emptyTitle}>Esta playlist está vacía</Text>
			<Text style={styles.mutedMessage}>
				{isFavorites
					? "Marcá una canción como favorita y va a aparecer acá."
					: "Agregá canciones desde el reproductor o la búsqueda."}
			</Text>
		</View>
	);
}
