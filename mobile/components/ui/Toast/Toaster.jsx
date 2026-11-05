import {
	useCallback,
	useEffect,
	useRef,
	useState,
	useSyncExternalStore,
} from "react";
import {
	AccessibilityInfo,
	Platform,
	Pressable,
	StyleSheet,
	Text,
	useWindowDimensions,
	View,
} from "react-native";
import {
	Gesture,
	GestureDetector,
	GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
	Easing,
	useAnimatedStyle,
	useDerivedValue,
	useSharedValue,
	withTiming,
} from "react-native-reanimated";
import { FullWindowOverlay } from "react-native-screens";
import { scheduleOnRN } from "react-native-worklets";
import { useReducedMotionPreference } from "./useReducedMotionPreference";
import {
	CheckGlyph,
	ExclaimGlyph,
	InfoGlyph,
} from "./primitives/ToastGlyphs";
import { RollText } from "./primitives/RollText";
import { SpinGlyph } from "./primitives/SpinGlyph";
import { EASE_OUT } from "./motion";
import { colors } from "../../../theme";
import { TOASTER_STYLES as styles } from "./Toaster.styles";
import { toast, toastStore } from "./toastStore";

// Reanimated mueve los shared values en el hilo de UI; el linter de React los
// trata como valores inmutables del render y no distingue ese patrón.
/* eslint-disable react-hooks/immutability */

// Llegar corre lineal; cada fase hace su propio ease sobre su tramo, así las
// fases posteriores no quedan aplastadas en los primeros frames.
const ENTER = { duration: 560, easing: Easing.linear };
const EXIT = { duration: 420, easing: Easing.linear };

/** Ease-out sobre el tramo de una fase de un progreso lineal, acotado 0..1. */
function phase(progress, from, to) {
	"worklet";
	const t = Math.max(0, Math.min(1, (progress - from) / (to - from)));
	return 1 - (1 - t) ** 3;
}

/** Lo más chico desde donde arranca la cáscara: un círculo alrededor del estado. */
const MORPH_START = 44;
/** El radio de la píldora y el ancho de cada extremo redondeado. */
const CAP = 22;
/** El desplegable cubre la primera mitad, desde esta distancia pasando el borde. */
const DROP_FROM = 24;
const REFLOW = { duration: 220, easing: EASE_OUT };
const FADE = { duration: 160 };
/** Cuánto asoma cada toast detrás del primero, y cuánto se achica. */
const PEEK = 8;
const SHRINK = 0.06;
const GAP = 8;
const EDGE = 16;
const FLING_X = 90;
const FLING_Y = 28;

/**
 * Muestra los toasts de `toast()`. Se monta una sola vez, después del
 * navegador, para quedar por encima de las pantallas. Se apilan como
 * notificaciones: tocá la pila para desplegarla y deslizá uno para descartarlo.
 */
export function Toaster({
	position = "top",
	topInset = 0,
	bottomInset = 0,
	visibleToasts = 3,
	onShow,
	disableAnimation = false,
}) {
	const reducedMotion = useReducedMotionPreference();
	const reduce = reducedMotion || disableAnimation;
	const items = useSyncExternalStore(
		toastStore.subscribe,
		toastStore.getSnapshot,
	);
	const [sizes, setSizes] = useState({});
	const [expanded, setExpanded] = useState(false);
	const [overlayReady, setOverlayReady] = useState(false);

	useEffect(() => {
		if (items.length > 0) {
			// eslint-disable-next-line react-hooks/set-state-in-effect
			setOverlayReady(true);
		}
	}, [items.length]);

	// Los timers se frenan mientras la pila está abierta o hay un dedo abajo.
	const touching = useRef(false);
	const open = useRef(false);
	const syncTimers = useCallback(() => {
		if (touching.current || open.current) toastStore.pause();
		else toastStore.resume();
	}, []);

	// Más nuevos primero, y solo los que no están saliendo.
	const live = items.filter((item) => !item.dismissed).reverse();
	const isExpanded = expanded && live.length > 1;

	useEffect(() => {
		open.current = isExpanded;
		syncTimers();
	}, [isExpanded, syncTimers]);

	const onTouch = useCallback(
		(down) => {
			touching.current = down;
			syncTimers();
		},
		[syncTimers],
	);

	// Los lectores de pantalla se enteran de cada toast nuevo y cambio de estado.
	const seen = useRef(new Map());
	const onShowRef = useRef(onShow);
	useEffect(() => {
		onShowRef.current = onShow;
	}, [onShow]);
	useEffect(() => {
		for (const item of items) {
			if (item.dismissed || seen.current.get(item.id) === item.status) continue;
			seen.current.set(item.id, item.status);
			onShowRef.current?.(item);
			if (Platform.OS === "ios") {
				AccessibilityInfo.announceForAccessibility(
					item.description ? `${item.title}. ${item.description}` : item.title,
				);
			}
		}
		for (const id of seen.current.keys()) {
			if (!items.some((item) => item.id === id)) seen.current.delete(id);
		}
	}, [items]);

	const onMeasure = useCallback((id, size) => {
		setSizes((previous) => {
			const old = previous[id];
			return old && old.width === size.width && old.height === size.height
				? previous
				: { ...previous, [id]: size };
		});
	}, []);

	const onDismiss = useCallback((id) => toast.dismiss(id), []);

	const onRemove = useCallback((id) => {
		toastStore.remove(id);
		setSizes(({ [id]: _removed, ...rest }) => rest);
	}, []);

	const onToggle = useCallback(() => {
		if (live.length <= 1) return;
		open.current = !open.current;
		syncTimers();
		setExpanded(open.current);
	}, [live.length, syncTimers]);

	const sign = position === "top" ? 1 : -1;
	const front = sizes[live[0]?.id ?? ""] ?? { width: 0, height: 44 };
	const targets = new Map();
	let offset = 0;
	live.forEach((item, depth) => {
		const height = sizes[item.id]?.height ?? 44;
		const hidden = depth >= visibleToasts;
		if (isExpanded) {
			targets.set(item.id, {
				depth,
				y: sign * offset,
				scale: 1,
				opacity: hidden ? 0 : 1,
			});
			offset += height + GAP;
		} else {
			// Los toasts tienen tamaños distintos: los colapsados esperan
			// ocultos detrás del primero y sus asomos dibujan la forma.
			targets.set(item.id, {
				depth,
				y: 0,
				scale: 1 - depth * SHRINK,
				opacity: depth === 0 ? 1 : 0,
			});
		}
	});
	const peeks = Math.min(live.length, visibleToasts) - 1;

	const layer = (
		<View
			pointerEvents="box-none"
			style={[
				StyleSheet.absoluteFill,
				styles.layer,
				position === "top"
					? { paddingTop: topInset + 8 }
					: { paddingBottom: bottomInset + 8 },
			]}
		>
			<View
				pointerEvents="box-none"
				style={position === "top" ? styles.anchorTop : styles.anchorBottom}
			>
				{Array.from({ length: Math.max(0, visibleToasts - 1) }, (_, i) => (
					<Peek
						key={`peek-${i + 1}`}
						depth={i + 1}
						size={front}
						shown={!isExpanded && i < peeks}
						position={position}
						reduce={reduce}
					/>
				))}
				{items.map((item) => {
					const target = targets.get(item.id);
					return (
						<ToastView
							key={item.id}
							item={item}
							targetY={target?.y ?? 0}
							targetScale={target?.scale ?? 1}
							targetOpacity={target?.opacity ?? 1}
							zIndex={target ? 100 - target.depth : 0}
							// Los colapsados esperan ocultos: solo el primero recibe toques
							// hasta que la pila se despliega.
							interactive={Boolean(target) && (isExpanded || target.depth === 0)}
							position={position}
							reduce={reduce}
							onMeasure={onMeasure}
							onDismiss={onDismiss}
							onRemove={onRemove}
							onToggle={onToggle}
							onTouch={onTouch}
						/>
					);
				})}
			</View>
		</View>
	);

	// En iOS las tabs nativas y los modales se dibujan arriba de las vistas de
	// React Native, así que los toasts van en su propia capa de la ventana.
	if (Platform.OS === "ios") {
		if (!overlayReady) return null;
		return (
			<FullWindowOverlay>
				<GestureHandlerRootView
					pointerEvents="box-none"
					style={StyleSheet.absoluteFill}
				>
					{layer}
				</GestureHandlerRootView>
			</FullWindowOverlay>
		);
	}

	return layer;
}

function ToastView({
	item,
	targetY,
	targetScale,
	targetOpacity,
	zIndex,
	interactive,
	position,
	reduce,
	onMeasure,
	onDismiss,
	onRemove,
	onToggle,
	onTouch,
}) {
	const window = useWindowDimensions();
	const sign = position === "top" ? 1 : -1;
	const enter = useSharedValue(0);
	const y = useSharedValue(targetY);
	const scale = useSharedValue(targetScale);
	const opacity = useSharedValue(targetOpacity);
	const dragX = useSharedValue(0);
	const dragY = useSharedValue(0);
	const height = useSharedValue(44);
	const flung = useSharedValue(0);
	// El ancho del layout y el ancho que la píldora muestra en reposo, que se
	// desliza al nuevo layout cuando cambian el estado o el título.
	const layoutWidth = useSharedValue(0);
	const restWidth = useSharedValue(0);
	const measured = useRef(false);

	useEffect(() => {
		const config = reduce ? { duration: 0 } : REFLOW;
		y.value = withTiming(targetY, config);
		scale.value = withTiming(targetScale, config);
		opacity.value = withTiming(targetOpacity, reduce ? FADE : REFLOW);
	}, [
		opacity,
		reduce,
		scale,
		targetOpacity,
		targetScale,
		targetY,
		y,
	]);

	// Irse espeja llegar. Un swipe ya se lo llevó.
	useEffect(() => {
		if (!item.dismissed || flung.value) return;
		const id = item.id;
		enter.value = withTiming(0, reduce ? FADE : EXIT, (done) => {
			if (done) scheduleOnRN(onRemove, id);
		});
	}, [enter, flung, item.dismissed, item.id, onRemove, reduce]);

	const id = item.id;

	const pan = Gesture.Pan()
		.enabled(item.dismissible && !item.dismissed)
		.activeOffsetX([-12, 12])
		.activeOffsetY([-10, 10])
		.onBegin(() => {
			scheduleOnRN(onTouch, true);
		})
		.onUpdate((event) => {
			dragX.value = event.translationX;
			// Alejarse del borde resiste; hacia el borde sigue el dedo.
			const out = event.translationY * sign < 0;
			dragY.value = out ? event.translationY : event.translationY * 0.15;
		})
		.onEnd((event) => {
			const sideways =
				Math.abs(event.translationX) > FLING_X ||
				Math.abs(event.velocityX) > 800;
			const outward =
				event.translationY * sign < -FLING_Y || event.velocityY * sign < -500;
			if (!sideways && !outward) {
				dragX.value = withTiming(0, REFLOW);
				dragY.value = withTiming(0, REFLOW);
				return;
			}
			flung.value = 1;
			scheduleOnRN(onDismiss, id);
			const done = (finished) => {
				"worklet";
				if (finished) scheduleOnRN(onRemove, id);
			};
			if (sideways) {
				const direction = Math.sign(event.translationX || event.velocityX);
				dragX.value = withTiming(direction * window.width, EXIT, done);
			} else {
				dragY.value = withTiming(-sign * (height.value + 80), EXIT, done);
			}
		})
		.onFinalize(() => {
			scheduleOnRN(onTouch, false);
		});

	const animatedStyle = useAnimatedStyle(() => {
		const e = enter.value;
		const drop = reduce ? 1 : phase(e, 0, 0.5);
		const travel = (1 - drop) * -sign * (height.value + DROP_FROM);
		return {
			opacity: (reduce ? e : phase(e, 0, 0.18)) * opacity.value,
			transform: [
				{ translateX: dragX.value },
				{ translateY: y.value + dragY.value + travel },
				{ scale: scale.value * (0.6 + 0.4 * drop) },
			],
		};
	});

	// Mientras aterriza, la píldora se ensancha desde un círculo alrededor del
	// estado, hacia afuera desde el centro. Solo se mueven transforms.
	const shape = useDerivedValue(() => {
		const full = layoutWidth.value;
		const rest = restWidth.value;
		const start = Math.min(rest, Math.max(MORPH_START, height.value));
		const grow = reduce ? 1 : phase(enter.value, 0.2, 0.85);
		const width = start + (rest - start) * grow;
		const middle = full - CAP * 2;
		return {
			stretch: middle > 0 ? Math.max(0, width - CAP * 2) / middle : 1,
			shift: (full - width) / 2,
		};
	});
	const middleStyle = useAnimatedStyle(() => ({
		transform: [{ scaleX: shape.value.stretch }],
	}));
	const middleShadowStyle = useAnimatedStyle(() => ({
		opacity: Math.min(1, shape.value.stretch * 3),
		transform: [{ scaleX: shape.value.stretch }],
	}));
	const leftCapStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: shape.value.shift }],
	}));
	const rightCapStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: -shape.value.shift }],
	}));
	const rowStyle = useAnimatedStyle(() => ({
		transform: [{ translateX: shape.value.shift }],
	}));
	const textStyle = useAnimatedStyle(() => ({
		opacity: reduce ? 1 : phase(enter.value, 0.55, 0.95),
	}));

	const onLayout = ({ nativeEvent }) => {
		const { width, height: tall } = nativeEvent.layout;
		height.value = tall;
		layoutWidth.value = width;
		onMeasure(item.id, { width, height: tall });
		if (!measured.current) {
			// El morph espera el primer layout para saber su ancho completo.
			measured.current = true;
			restWidth.value = width;
			enter.value = withTiming(1, reduce ? FADE : ENTER);
			return;
		}
		// Un estado o título nuevos deslizan la píldora a su ancho nuevo.
		restWidth.value = reduce ? width : withTiming(width, REFLOW);
	};

	return (
		<Animated.View
			pointerEvents={!item.dismissed && interactive ? "box-none" : "none"}
			style={[
				position === "top" ? styles.slotTop : styles.slotBottom,
				{ zIndex },
				animatedStyle,
			]}
		>
			<GestureDetector gesture={pan}>
				<Pressable
					onPress={onToggle}
					onLayout={onLayout}
					accessibilityRole={item.status === "error" ? "alert" : "text"}
					accessibilityLiveRegion={
						item.status === "error" ? "assertive" : "polite"
					}
					accessibilityHint={
						item.dismissible ? "Deslizá para descartar" : undefined
					}
					style={{ maxWidth: window.width - EDGE * 2 }}
				>
					{/* Todas las sombras van abajo de cualquier relleno, así las
					    uniones desaparecen y las sombras suman la de la píldora. */}
					<PillPieces
						shadow
						middle={middleShadowStyle}
						left={leftCapStyle}
						right={rightCapStyle}
					/>
					<PillPieces
						middle={middleStyle}
						left={leftCapStyle}
						right={rightCapStyle}
					/>
					<Animated.View style={rowStyle}>
						<ToastContent item={item} reduce={reduce} textStyle={textStyle} />
					</Animated.View>
				</Pressable>
			</GestureDetector>
		</Animated.View>
	);
}

/** La píldora como dos extremos redondeados y un medio recto que se estira. */
function PillPieces({ shadow = false, middle, left, right }) {
	// Las piezas de sombra solo proyectan; los rellenos de arriba llevan el borde.
	return (
		<>
			<Animated.View
				pointerEvents="none"
				style={[
					shadow ? styles.shadowMiddle : styles.middle,
					shadow && styles.shadowPiece,
					middle,
				]}
			/>
			<Animated.View
				pointerEvents="none"
				style={[
					shadow ? styles.shadowCapLeft : styles.capLeft,
					shadow && styles.shadowPiece,
					left,
				]}
			/>
			<Animated.View
				pointerEvents="none"
				style={[
					shadow ? styles.shadowCapRight : styles.capRight,
					shadow && styles.shadowPiece,
					right,
				]}
			/>
		</>
	);
}

/** La fila dentro del toast: estado, palabras y una acción opcional. */
function ToastContent({ item, reduce, textStyle }) {
	return (
		<View style={styles.content}>
			<StatusBadge status={item.status} reduce={reduce} />
			<Animated.View style={[styles.textBlock, textStyle]}>
				<View style={styles.words}>
					<RollText
						text={item.title}
						style={styles.title}
						reduce={reduce}
						numberOfLines={2}
					/>
					{item.description ? (
						<Text numberOfLines={3} style={styles.description}>
							{item.description}
						</Text>
					) : null}
				</View>
				{item.action ? (
					<Pressable
						accessibilityRole="button"
						hitSlop={8}
						onPress={() => {
							item.action?.onPress();
							toast.dismiss(item.id);
						}}
						style={({ pressed }) => [
							styles.action,
							pressed && styles.actionPressed,
						]}
					>
						<Text style={styles.actionLabel}>{item.action.label}</Text>
					</Pressable>
				) : null}
			</Animated.View>
		</View>
	);
}

/**
 * Un borde sólido de la forma del primer toast, asomando detrás para mostrar
 * que hay más esperando. Sigue el tamaño del primero.
 */
function Peek({ depth, size, shown, position, reduce }) {
	const sign = position === "top" ? 1 : -1;
	const width = useSharedValue(size.width);
	const height = useSharedValue(size.height);
	const visible = useSharedValue(shown ? 1 : 0);

	useEffect(() => {
		const config = reduce ? { duration: 0 } : REFLOW;
		width.value = withTiming(size.width, config);
		height.value = withTiming(size.height, config);
	}, [height, reduce, size.height, size.width, width]);
	useEffect(() => {
		visible.value = withTiming(shown ? 1 : 0, reduce ? FADE : REFLOW);
	}, [reduce, shown, visible]);

	const style = useAnimatedStyle(() => ({
		width: width.value,
		height: height.value,
		opacity: visible.value,
		transform: [
			{ translateY: sign * depth * PEEK * visible.value },
			{ scale: 1 - depth * SHRINK },
		],
	}));

	return (
		<View
			pointerEvents="none"
			style={[
				position === "top" ? styles.slotTop : styles.slotBottom,
				{ zIndex: 100 - depth },
			]}
		>
			<Animated.View
				style={[
					styles.pill,
					{
						transformOrigin: position === "top" ? "50% 100%" : "50% 0%",
					},
					style,
				]}
			/>
		</View>
	);
}

const BADGE = {
	success: {
		style: styles.badgePrimary,
		glyph: (color) => <CheckGlyph size={14} color={color} strokeWidth={2.8} />,
	},
	info: {
		style: styles.badgePrimary,
		glyph: (color) => <InfoGlyph size={14} color={color} strokeWidth={2.8} />,
	},
	error: {
		style: styles.badgeError,
		glyph: (color) => (
			<ExclaimGlyph size={14} color={color} strokeWidth={2.8} />
		),
	},
};

/** El estado en un círculo relleno; hace crossfade cuando cambia. */
function StatusBadge({ status, reduce }) {
	const onPrimary = colors.lighter;
	const primary = colors.primary;
	const shown = useSharedValue(1);
	const [shownStatus, setShownStatus] = useState(status);
	// Con movimiento reducido no hay crossfade: el estado mostrado es el actual.
	const current = reduce ? status : shownStatus;

	// Apaga la marca vieja, intercambia y enciende la nueva.
	useEffect(() => {
		if (status === current) return;
		shown.value = withTiming(0, { duration: 90 }, (done) => {
			if (done) scheduleOnRN(setShownStatus, status);
		});
	}, [current, shown, status]);
	useEffect(() => {
		shown.value = withTiming(1, { duration: 160, easing: EASE_OUT });
	}, [current, shown]);

	const style = useAnimatedStyle(() => ({
		opacity: shown.value,
		transform: [{ scale: 0.7 + 0.3 * shown.value }],
	}));

	if (current === "neutral" && status === "neutral") return null;

	return (
		<Animated.View
			style={[
				styles.badge,
				current === "loading" || current === "neutral"
					? styles.badgeMuted
					: BADGE[current].style,
				style,
			]}
		>
			{current === "loading" ? (
				<SpinGlyph size={14} color={primary} reduce={reduce} />
			) : current === "neutral" ? null : (
				BADGE[current].glyph(onPrimary)
			)}
		</Animated.View>
	);
}
