import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
} from "react-native-reanimated";
import { usePresence } from "../usePresence";
import { EASE_OUT, SPRING_SWAP } from "../motion";

const EXIT = { duration: 140, easing: EASE_OUT };
const TRAVEL = 0.9;

/** El progreso va 0 (abajo), 1 (en reposo) y 2 (rodado hacia arriba). */
function Layer({ text, appear, exiting, reduce, height, style, lines }) {
	const progress = useSharedValue(appear && !reduce ? 0 : 1);

	useEffect(() => {
		if (reduce) {
			progress.value = exiting ? 2 : 1;
			return;
		}
		progress.value = exiting ? withTiming(2, EXIT) : withSpring(1, SPRING_SWAP);
	}, [exiting, progress, reduce]);

	const animatedStyle = useAnimatedStyle(
		() => {
			const p = progress.value;
			return {
				opacity: Math.max(0, Math.min(1, p <= 1 ? p : 2 - p)),
				transform: [{ translateY: (1 - p) * height * TRAVEL }],
			};
		},
		[height],
	);

	return (
		<Animated.View style={[styles.layer, animatedStyle]}>
			<Text numberOfLines={lines} style={style}>
				{text}
			</Text>
		</Animated.View>
	);
}

/**
 * Texto que "rueda" cuando cambia: la línea nueva sube desde abajo mientras
 * la vieja sale por arriba. Port de `primitives/roll-text.tsx` adaptado a
 * `style` en vez de `className`.
 */
export function RollText({
	value,
	text,
	style,
	reduce,
	numberOfLines = 1,
}) {
	const lines = numberOfLines === 0 ? undefined : numberOfLines;
	const [height, setHeight] = useState(16);
	const items = usePresence(value ?? text, text, () =>
		reduce ? 0 : EXIT.duration + 40,
	);

	return (
		<View style={styles.slot}>
			{/* Da tamaño al slot con el texto actual. */}
			<Text
				numberOfLines={lines}
				style={[style, styles.sizer]}
				onLayout={({ nativeEvent }) => setHeight(nativeEvent.layout.height)}
			>
				{text}
			</Text>
			{items.map((item) => (
				<Layer
					key={item.key}
					text={item.value}
					appear={item.appear}
					exiting={item.exiting}
					reduce={reduce}
					height={height}
					style={style}
					lines={lines}
				/>
			))}
		</View>
	);
}

const styles = StyleSheet.create({
	slot: { overflow: "hidden", flexShrink: 1, minWidth: 0 },
	sizer: { opacity: 0 },
	layer: { position: "absolute", left: 0, right: 0, top: 0 },
});
