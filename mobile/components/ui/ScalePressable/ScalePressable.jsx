import { useState } from "react";
import { Animated, Easing, Pressable } from "react-native";

// Efecto de presionado equivalente a `transition duration-150 active:scale-90`
// de la web: la escala se anima en lugar de cambiar de golpe.
const PRESS_DURATION = 150;
const PRESS_SCALE = 0.9;
const PRESS_EASING = Easing.bezier(0.4, 0, 0.2, 1);

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * `Pressable` que se achica suavemente mientras está presionado.
 *
 * Acepta las mismas props que `Pressable` (`style` como objeto o array, no como
 * función). `pressedScale` permite ajustar cuánto se achica. Lo usan el botón
 * de cola y el de reproducir de las tarjetas para que el feedback sea el mismo.
 */
export default function ScalePressable({
	pressedScale = PRESS_SCALE,
	onPressIn,
	onPressOut,
	style,
	children,
	...props
}) {
	const [scale] = useState(() => new Animated.Value(1));

	function animate(toValue) {
		Animated.timing(scale, {
			toValue,
			duration: PRESS_DURATION,
			easing: PRESS_EASING,
			useNativeDriver: true,
		}).start();
	}

	return (
		<AnimatedPressable
			{...props}
			onPressIn={(event) => {
				animate(pressedScale);
				onPressIn?.(event);
			}}
			onPressOut={(event) => {
				animate(1);
				onPressOut?.(event);
			}}
			style={[style, { transform: [{ scale }] }]}
		>
			{children}
		</AnimatedPressable>
	);
}
