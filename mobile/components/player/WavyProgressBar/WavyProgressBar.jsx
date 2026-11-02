import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, PanResponder, View } from "react-native";
import Animated, {
	cancelAnimation,
	Easing,
	useAnimatedProps,
	useSharedValue,
	withRepeat,
	withTiming,
} from "react-native-reanimated";
import Svg, { Line, Path, Rect } from "react-native-svg";
import { usePlayerTime } from "@synthos/shared";
import { colors } from "../../../theme";
import { WAVY_PROGRESS_STYLES as styles } from "./WavyProgressBar.styles";

const SEEK_STEP_SECONDS = 5;

// Valores del WavyMusicSlider del HTML de referencia.
const HEIGHT = 40;
const CENTER_Y = HEIGHT / 2;
const PAD = 8; // margen lateral del track, para que el thumb no se corte
const STROKE = 6;
const WAVE_LENGTH = 40;
const AMPLITUDE = 3;
const CYCLE_MS = 2000; // un ciclo completo de la onda
const SETTLE_MS = 300; // amplitud: lerp equivalente a ~300ms
const THUMB_MS = 250; // círculo -> línea
const THUMB_IDLE = { w: 16, h: 16 };
const THUMB_ACTIVE = { w: 6, h: 24 };

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedLine = Animated.createAnimatedComponent(Line);
const AnimatedRect = Animated.createAnimatedComponent(Rect);

/**
 * Barra de progreso ondulada para el reproductor expandido.
 *
 * Lee el tiempo de `usePlayerTime()` (contexto separado) y anima la onda y el
 * thumb en el hilo de UI con Reanimated: la fase y la amplitud viven en
 * shared values y el `d` del Path se actualiza con `useAnimatedProps`, sin
 * re-render de React por frame. El resto de la barra (accesibilidad, seek)
 * sigue en JS.
 *
 * Misma API que `ProgressBar` (`onSeek`, `disabled`) más `isPlaying`: la onda
 * fluye mientras suena y se aplana al pausar o al arrastrar.
 */
export default function WavyProgressBar({ onSeek, isPlaying = false, disabled = false, style }) {
	const { currentTime, duration } = usePlayerTime();
	const [dragging, setDragging] = useState(false);
	const [reduceMotion, setReduceMotion] = useState(false);

	const trackWidth = useSharedValue(0);
	const progress = useSharedValue(0);
	const phase = useSharedValue(0);
	const amplitude = useSharedValue(0);
	const thumbW = useSharedValue(THUMB_IDLE.w);
	const thumbH = useSharedValue(THUMB_IDLE.h);
	const thumbOpacity = useSharedValue(0);

	const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
	const progressRatio = safeDuration > 0 ? clamp(currentTime / safeDuration, 0, 1) : 0;
	const flowing = isPlaying && !dragging && !reduceMotion;

	useEffect(() => {
		AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);

		const subscription = AccessibilityInfo.addEventListener("reduceMotionChanged", setReduceMotion);

		return () => subscription.remove();
	}, []);

	// El avance solo cambia con el tick del tiempo (no por frame).
	useEffect(() => {
		progress.value = progressRatio;

		const target = progressRatio > 0 || dragging ? 1 : 0;

		if (thumbOpacity.value !== target) {
			thumbOpacity.value = withTiming(target, { duration: 150 });
		}
	}, [progressRatio, dragging, progress, thumbOpacity]);

	useEffect(() => {
		amplitude.value = withTiming(flowing ? AMPLITUDE : 0, {
			duration: SETTLE_MS,
			easing: Easing.out(Easing.quad),
		});
	}, [flowing, amplitude]);

	// Fase continua: Reanimated la anima en el hilo de UI. Al pausar se detiene
	// en el valor actual; al reanudar sigue desde ahí (sin salto).
	useEffect(() => {
		if (!flowing) {
			cancelAnimation(phase);
			return;
		}

		phase.value = withRepeat(
			withTiming(phase.value + 2 * Math.PI, {
				duration: CYCLE_MS,
				easing: Easing.linear,
			}),
			-1,
			false,
		);
	}, [flowing, phase]);

	useEffect(() => {
		const easing = Easing.out(Easing.quad);

		thumbW.value = withTiming(dragging ? THUMB_ACTIVE.w : THUMB_IDLE.w, {
			duration: THUMB_MS,
			easing,
		});
		thumbH.value = withTiming(dragging ? THUMB_ACTIVE.h : THUMB_IDLE.h, {
			duration: THUMB_MS,
			easing,
		});
	}, [dragging, thumbW, thumbH]);

	const waveProps = useAnimatedProps(() => {
		const usable = Math.max(trackWidth.value - PAD * 2, 0);
		const progressX = PAD + usable * progress.value;
		const amp = amplitude.value;

		if (amp <= 0.05) {
			return { d: `M ${PAD} ${CENTER_Y} L ${progressX} ${CENTER_Y}` };
		}

		const frequency = (2 * Math.PI) / WAVE_LENGTH;
		let d = `M ${PAD} ${CENTER_Y + amp * Math.sin(frequency * PAD + phase.value)}`;

		for (let x = PAD + 3; x < progressX; x += 3) {
			d += ` L ${x} ${CENTER_Y + amp * Math.sin(frequency * x + phase.value)}`;
		}

		d += ` L ${progressX} ${CENTER_Y + amp * Math.sin(frequency * progressX + phase.value)}`;

		return { d };
	});

	const tailProps = useAnimatedProps(() => {
		const usable = Math.max(trackWidth.value - PAD * 2, 0);

		return {
			x1: PAD + usable * progress.value,
			x2: PAD + usable,
		};
	});

	const thumbProps = useAnimatedProps(() => {
		const usable = Math.max(trackWidth.value - PAD * 2, 0);
		const progressX = PAD + usable * progress.value;

		return {
			x: progressX - thumbW.value / 2,
			y: CENTER_Y - thumbH.value / 2,
			width: thumbW.value,
			height: thumbH.value,
			rx: thumbW.value / 2,
			opacity: thumbOpacity.value,
		};
	});

	// El PanResponder se crea una sola vez: lo que cambia se lee de esta ref.
	const stateRef = useRef({});
	useEffect(() => {
		stateRef.current = { safeDuration, disabled, onSeek };
	}, [safeDuration, disabled, onSeek]);

	const grantXRef = useRef(0);

	const seekFromX = (x) => {
		const state = stateRef.current;
		const usable = trackWidth.value - PAD * 2;

		if (state.disabled || state.safeDuration === 0 || usable <= 0) return;

		state.onSeek?.(clamp((x - PAD) / usable, 0, 1) * state.safeDuration);
	};

	const responderRef = useRef(null);

	if (!responderRef.current) {
		responderRef.current = PanResponder.create({
			onStartShouldSetPanResponder: () =>
				!stateRef.current.disabled && stateRef.current.safeDuration > 0,
			onMoveShouldSetPanResponder: () =>
				!stateRef.current.disabled && stateRef.current.safeDuration > 0,
			onPanResponderGrant: (event) => {
				const x = event.nativeEvent.locationX;

				grantXRef.current = x;
				setDragging(true);
				seekFromX(x);
			},
			onPanResponderMove: (_event, gesture) => seekFromX(grantXRef.current + gesture.dx),
			// La barra vive dentro de un ScrollView vertical: sin esto, el scroll
			// puede reclamar el gesto en medio del arrastre.
			onPanResponderTerminationRequest: () => false,
			onPanResponderRelease: () => setDragging(false),
			onPanResponderTerminate: () => setDragging(false),
		});
	}

	const seekBy = (delta) => {
		if (disabled || safeDuration === 0) return;

		onSeek?.(clamp(currentTime + delta, 0, safeDuration));
	};

	return (
		<View
			onLayout={(event) => {
				trackWidth.value = event.nativeEvent.layout.width;
			}}
			{...responderRef.current.panHandlers}
			style={[styles.touchArea, disabled && styles.disabled, style]}
			accessible
			accessibilityRole="adjustable"
			accessibilityLabel="Progreso de la canción"
			accessibilityValue={{
				min: 0,
				max: Math.round(safeDuration),
				now: Math.round(currentTime),
			}}
			accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
			onAccessibilityAction={(event) => {
				if (event.nativeEvent.actionName === "increment") seekBy(SEEK_STEP_SECONDS);
				if (event.nativeEvent.actionName === "decrement") seekBy(-SEEK_STEP_SECONDS);
			}}
		>
			<Svg width="100%" height={HEIGHT} pointerEvents="none">
				<AnimatedLine
					y1={CENTER_Y}
					y2={CENTER_Y}
					animatedProps={tailProps}
					stroke={colors.wall}
					strokeWidth={STROKE}
					strokeLinecap="round"
				/>
				<AnimatedPath
					animatedProps={waveProps}
					stroke={colors.fucsia}
					strokeWidth={STROKE}
					strokeLinecap="round"
					strokeLinejoin="round"
					fill="none"
				/>
				<AnimatedRect animatedProps={thumbProps} fill={colors.fucsia} />
			</Svg>
		</View>
	);
}
