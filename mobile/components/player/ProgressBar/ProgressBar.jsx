import { useEffect, useRef, useState } from "react";
import { PanResponder, View } from "react-native";
import { usePlayerTime } from "@synthos/shared";
import { PROGRESS_BAR_STYLES as styles } from "./ProgressBar.styles";

const SEEK_STEP_SECONDS = 5;

/**
 * Barra de progreso con seek por toque y arrastre.
 *
 * Lee el tiempo de `usePlayerTime()` (contexto separado) para que el tick de
 * `currentTime` no re-renderice al resto del reproductor. La usan el mini
 * reproductor y el expandido, igual que `ProgressBar` en web.
 */
export default function ProgressBar({ onSeek, disabled = false, style }) {
	const { currentTime, duration } = usePlayerTime();
	const [trackWidth, setTrackWidth] = useState(0);
	const [dragging, setDragging] = useState(false);

	const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
	const progress = safeDuration > 0 ? Math.min(Math.max(currentTime / safeDuration, 0), 1) : 0;

	// El PanResponder se crea una sola vez: los valores que cambian (duración,
	// ancho, disabled, callback) se leen de esta ref en cada gesto.
	const stateRef = useRef({});
	useEffect(() => {
		stateRef.current = { trackWidth, safeDuration, disabled, onSeek };
	}, [trackWidth, safeDuration, disabled, onSeek]);

	const grantXRef = useRef(0);

	const seekFromX = (x) => {
		const state = stateRef.current;

		if (state.disabled || state.safeDuration === 0 || state.trackWidth === 0) return;

		const ratio = Math.min(Math.max(x / state.trackWidth, 0), 1);

		state.onSeek?.(ratio * state.safeDuration);
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
			onPanResponderRelease: () => setDragging(false),
			onPanResponderTerminate: () => setDragging(false),
		});
	}

	const responder = responderRef.current;
	const seekBy = (delta) => {
		if (disabled || safeDuration === 0) return;

		onSeek?.(Math.min(Math.max(currentTime + delta, 0), safeDuration));
	};

	return (
		<View
			onLayout={(event) => {
				const width = event.nativeEvent.layout.width;

				stateRef.current.trackWidth = width;
				setTrackWidth(width);
			}}
			{...responder.panHandlers}
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
			<View style={styles.track} pointerEvents="none">
				<View style={[styles.fill, { width: `${progress * 100}%` }]} />
			</View>

			{progress > 0 || dragging ? (
				<View
					style={[styles.thumb, { left: `${progress * 100}%` }]}
					pointerEvents="none"
				/>
			) : null}
		</View>
	);
}
