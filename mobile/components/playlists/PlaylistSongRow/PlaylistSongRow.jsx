import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	Image,
	Keyboard,
	Pressable,
	Text,
	TextInput,
	View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { colors, sizes } from "../../../theme";
import {
	EllipsisIcon,
	HamburgerMenuIcon,
	HeartIcon,
	MusicNoteIcon,
	TrashIcon,
} from "../../icons";
import QueueActionButton from "../../ui/QueueActionButton/QueueActionButton";
import { PLAYLIST_SONG_ROW_STYLES as styles } from "./PlaylistSongRow.styles";

const RAIL_WIDTH = 96;
const OVERLAP = 12;
const REVEAL = RAIL_WIDTH - OVERLAP;
const OPEN_RATIO = 0.46;
const CLOSE_RATIO = 0.72;
const OPEN_VELOCITY = 720;
const CLOSE_VELOCITY = 320;
const EXIT_MS = 150;

const SETTLE = {
	stiffness: 560,
	damping: 48,
	mass: 0.82,
	restDelta: 0.5,
	restSpeed: 8,
};
const DRAG_START = { duration: 120, easing: Easing.out(Easing.quad) };
const DRAG_SETTLE_TIMING = {
	duration: 180,
	easing: Easing.out(Easing.cubic),
};

// Reanimated mueve los shared values en el hilo de UI; el linter de React los
// trata como valores inmutables del render y no distingue ese patrón.
/* eslint-disable react-hooks/immutability */

/**
 * Fila de canción de una playlist mobile (port de `PlaylistSongRow` web).
 *
 * - Swipe a la izquierda: riel con input de posición. A la derecha: eliminar.
 * - El handle (`HamburgerMenuIcon`) arrastra para reordenar; el padre calcula
 *   el índice destino y persiste con `useReorderSongs`.
 * - La fila no conoce servicios: recibe `onPlay`, `onRemove`, `onMoveTo` y
 *   `onAddToQueue`.
 */
export default function PlaylistSongRow({
	song,
	index,
	total = 0,
	isFavorite = false,
	onPlay,
	onRemove,
	onMoveTo,
	onAddToQueue,
	canRemove = true,
	canReorder = false,
	openRowId = null,
	onOpened,
	onClosed,
	onOtherPress,
	exiting = false,
	dragging = false,
	neighborShift = 0,
	onDragStart,
	onDragMove,
	onDragEnd,
}) {
	const x = useSharedValue(0);
	const startX = useSharedValue(0);
	const dragY = useSharedValue(0);
	const dragScale = useSharedValue(1);
	const neighborY = useSharedValue(0);
	const exit = useSharedValue(1);
	const lastNotified = useSharedValue(0);
	const swipeEnded = useSharedValue(0);

	const [openSide, setOpenSide] = useState(null);
	const [draftState, setDraftState] = useState({
		index,
		value: String(index + 1),
	});
	const committedRef = useRef(false);

	const shouldBeOpen = openRowId !== null && String(openRowId) === String(song.id);
	const draft =
		draftState.index === index ? draftState.value : String(index + 1);

	// Separación de vecinos al calcular el índice destino.
	useEffect(() => {
		neighborY.value = withTiming(neighborShift, DRAG_SETTLE_TIMING);
	}, [neighborShift, neighborY]);

	// Salida de la fila al quitarla (150 ms, igual que la web).
	useEffect(() => {
		if (!exiting) {
			exit.value = 1;
			return;
		}
		exit.value = withTiming(0, { duration: EXIT_MS });
	}, [exit, exiting]);

	const applySide = useCallback(
		(side) => {
			if (side === "index") {
				setDraftState({ index, value: String(index + 1) });
			}
			setOpenSide(side);
			if (side) onOpened?.(song.id);
			else onClosed?.(song.id);
		},
		[index, onClosed, onOpened, song.id],
	);

	const close = useCallback(
		(notify = true) => {
			x.value = withSpring(0, SETTLE);
			if (notify) applySide(null);
			else setOpenSide(null);
		},
		[applySide, x],
	);

	// Si otra fila se abre (o la pantalla cierra los rieles), esta se cierra.
	useEffect(() => {
		// Sincroniza el riel con el estado del padre: es el efecto buscado.
		// eslint-disable-next-line react-hooks/set-state-in-effect
		if (!shouldBeOpen && openSide) close(false);
	}, [shouldBeOpen, openSide, close]);

	const openRail = useCallback(
		(side) => {
			const target = side === "remove" ? -REVEAL : REVEAL;
			committedRef.current = false;
			x.value = withSpring(target, SETTLE);
			applySide(side);
		},
		[applySide, x],
	);

	const swipeGesture = useMemo(
		() =>
			Gesture.Pan()
				.enabled(canRemove || canReorder)
				.activeOffsetX([-12, 12])
				.failOffsetY([-14, 14])
				.onBegin(() => {
					swipeEnded.value = 0;
					startX.value = x.value;
				})
				.onUpdate((event) => {
					const min = canRemove ? -REVEAL : 0;
					const max = canReorder ? REVEAL : 0;
					x.value = Math.min(
						max,
						Math.max(min, startX.value + event.translationX),
					);
				})
				.onEnd((event) => {
					const latest = x.value;
					const wasOpen = openSide;
					let side = null;

					if (latest <= 0) {
						const open = wasOpen === "remove";
						const shouldOpen = open
							? !(
									latest > -REVEAL * CLOSE_RATIO ||
									event.velocityX > CLOSE_VELOCITY
								)
							: latest < -REVEAL * OPEN_RATIO ||
								(event.velocityX < -OPEN_VELOCITY && latest < -3);
						side = shouldOpen ? "remove" : null;
					} else {
						const open = wasOpen === "index";
						const shouldOpen = open
							? !(
									latest < REVEAL * CLOSE_RATIO ||
									event.velocityX < -CLOSE_VELOCITY
								)
							: latest > REVEAL * OPEN_RATIO ||
								(event.velocityX > OPEN_VELOCITY && latest > 3);
						side = shouldOpen ? "index" : null;
					}

					const target =
						side === "remove" ? -REVEAL : side === "index" ? REVEAL : 0;
					x.value = withSpring(target, SETTLE);
					swipeEnded.value = 1;
					scheduleOnRN(applySide, side);
				})
				.onFinalize(() => {
					// El gesto no llegó a terminar (cancelado o falló): se cierra.
					if (swipeEnded.value) return;
					x.value = withSpring(0, SETTLE);
					scheduleOnRN(applySide, null);
				}),
		[applySide, canRemove, canReorder, openSide, startX, swipeEnded, x],
	);

	const dragGesture = useMemo(
		() =>
			Gesture.Pan()
				.enabled(canReorder)
				.activeOffsetY([-6, 6])
				.failOffsetX([-12, 12])
				.onStart(() => {
					lastNotified.value = 0;
					dragY.value = 0;
					x.value = 0;
					dragScale.value = withTiming(1.02, DRAG_START);
					scheduleOnRN(onDragStart, song.id);
				})
				.onUpdate((event) => {
					dragY.value = event.translationY;
					if (Math.abs(event.translationY - lastNotified.value) >= 6) {
						lastNotified.value = event.translationY;
						scheduleOnRN(onDragMove, event.translationY);
					}
				})
				.onFinalize(() => {
					dragY.value = withTiming(0, DRAG_SETTLE_TIMING);
					dragScale.value = withTiming(1, DRAG_SETTLE_TIMING);
					lastNotified.value = 0;
					// El padre es idempotente: si el gesto terminó, ya hizo el commit.
					scheduleOnRN(onDragEnd);
				}),
		[
			canReorder,
			dragScale,
			dragY,
			lastNotified,
			onDragEnd,
			onDragMove,
			onDragStart,
			song.id,
			x,
		],
	);

	const animatedRow = useAnimatedStyle(() => ({
		transform: [
			{ translateX: x.value },
			{ translateY: dragY.value + neighborY.value },
			{ scale: dragScale.value * (0.98 + 0.02 * exit.value) },
		],
		opacity: exit.value,
	}));

	// Los rieles solo asoman cuando la tarjeta se corre hacia su lado: en
	// reposo y durante el drag vertical quedan invisibles detrás de la fila.
	const leftRailOpacity = useAnimatedStyle(() => ({
		opacity: Math.min(1, Math.max(0, x.value / 8)),
	}));
	const rightRailOpacity = useAnimatedStyle(() => ({
		opacity: Math.min(1, Math.max(0, -x.value / 8)),
	}));

	function handlePlay() {
		if (openSide) {
			close();
			return;
		}
		// Tocar otra fila con un riel abierto primero lo cierra.
		if (openRowId !== null && !shouldBeOpen) {
			onOtherPress?.();
			return;
		}
		onPlay?.();
	}

	function handleEllipsis() {
		if (openSide === "remove") close();
		else openRail("remove");
	}

	function commitIndex() {
		if (committedRef.current) return;
		committedRef.current = true;
		Keyboard.dismiss();

		const digits = draft.replace(/\D/g, "");
		const parsed = digits ? Number(digits) : NaN;
		const maxIndex = Math.max(1, total);

		if (Number.isNaN(parsed) || parsed < 1) {
			close();
			return;
		}

		const target = Math.min(maxIndex, Math.trunc(parsed));
		const current = index + 1;

		close();
		if (target !== current) onMoveTo?.(target);
	}

	function handleRemove() {
		close();
		onRemove?.();
	}

	return (
		<View style={[styles.wrapper, dragging && styles.wrapperDragging]}>
			{canReorder ? (
				<Animated.View
					pointerEvents={openSide === "index" ? "auto" : "none"}
					accessibilityElementsHidden={openSide !== "index"}
					importantForAccessibility={
						openSide === "index" ? "auto" : "no-hide-descendants"
					}
					style={[styles.rail, styles.railLeft, leftRailOpacity]}
				>
					<TextInput
						value={draft}
						onChangeText={(text) =>
							setDraftState({ index, value: text.replace(/\D/g, "") })
						}
						onFocus={() => {
							committedRef.current = false;
							setDraftState({ index, value: String(index + 1) });
						}}
						onSubmitEditing={commitIndex}
						onBlur={commitIndex}
						keyboardType="number-pad"
						returnKeyType="done"
						selectTextOnFocus
						maxLength={4}
						style={styles.indexInput}
						accessibilityLabel={`Posición de ${song.title}, entre 1 y ${Math.max(1, total)}`}
					/>
				</Animated.View>
			) : null}

			{canRemove ? (
				<Animated.View
					pointerEvents={openSide === "remove" ? "auto" : "none"}
					accessibilityElementsHidden={openSide !== "remove"}
					importantForAccessibility={
						openSide === "remove" ? "auto" : "no-hide-descendants"
					}
					style={[styles.rail, styles.railRight, rightRailOpacity]}
				>
					<Pressable
						onPress={handleRemove}
						style={({ pressed }) => [
							styles.removeButton,
							pressed && styles.pressed,
						]}
						accessibilityRole="button"
						accessibilityLabel={`Sacar ${song.title} de la playlist`}
					>
						<TrashIcon size={20} color={colors.lighter} />
					</Pressable>
				</Animated.View>
			) : null}

			<GestureDetector gesture={swipeGesture}>
				<Animated.View style={[styles.card, animatedRow]}>
					{canReorder ? (
						<GestureDetector gesture={dragGesture}>
							<Pressable
								style={styles.dragHandle}
								accessibilityRole="button"
								accessibilityLabel={`Mover ${song.title}`}
								hitSlop={6}
							>
								<HamburgerMenuIcon size={16} color={colors.textMuted} />
							</Pressable>
						</GestureDetector>
					) : null}

					<Pressable
						onPress={handlePlay}
						style={styles.playArea}
						accessibilityRole="button"
						accessibilityLabel={`Reproducir ${song.title}`}
					>
						<View style={styles.cover}>
							{song.coverUrl ? (
								<Image
									source={{ uri: song.coverUrl }}
									style={styles.coverImage}
									resizeMode="cover"
								/>
							) : (
								<MusicNoteIcon size={16} color={colors.textMuted} />
							)}
						</View>

						<View style={styles.titles}>
							<Text style={styles.title} numberOfLines={1}>
								{song.title}
							</Text>
							<Text style={styles.artist} numberOfLines={1}>
								{song.artist}
							</Text>
						</View>
					</Pressable>

					{isFavorite ? (
						<View accessibilityLabel="Es una de tus favoritas">
							<HeartIcon size={16} color={colors.lighter} />
						</View>
					) : null}

					<QueueActionButton
						onAdd={() => {
							if (openRowId !== null) onOtherPress?.();
							return onAddToQueue?.();
						}}
						label={`Añadir ${song.title} a la cola`}
						size={16}
						buttonSize={sizes.mediaCardPlay}
					/>

					{canRemove ? (
						<Pressable
							onPress={handleEllipsis}
							style={({ pressed }) => [
								styles.ellipsis,
								pressed && styles.pressed,
							]}
							accessibilityRole="button"
							accessibilityLabel={`Más acciones para ${song.title}`}
							accessibilityState={{ expanded: openSide === "remove" }}
							hitSlop={6}
						>
							<EllipsisIcon size={20} color={colors.textPrimary} />
						</Pressable>
					) : null}
				</Animated.View>
			</GestureDetector>
		</View>
	);
}
