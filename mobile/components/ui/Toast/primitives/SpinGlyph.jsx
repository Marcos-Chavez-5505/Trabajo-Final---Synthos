import { useEffect } from "react";
import Animated, {
	cancelAnimation,
	Easing,
	ReduceMotion,
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withTiming,
} from "react-native-reanimated";
import { RingGlyph } from "./ToastGlyphs";

/**
 * Anillo giratorio para estados de carga. Con movimiento reducido queda
 * quieto: el anillo sigue leyéndose como "en progreso".
 */
export function SpinGlyph({ size = 16, color, reduce }) {
	const turn = useSharedValue(0);

	useEffect(() => {
		if (reduce) {
			cancelAnimation(turn);
			turn.value = 0;
			return undefined;
		}
		turn.value = 0;
		turn.value = withRepeat(
			withTiming(1, {
				duration: 900,
				easing: Easing.linear,
				reduceMotion: ReduceMotion.Never,
			}),
			-1,
			false,
		);
		return () => cancelAnimation(turn);
	}, [reduce, turn]);

	const style = useAnimatedStyle(() => ({
		transform: [{ rotate: `${turn.value * 360}deg` }],
	}));

	return (
		<Animated.View style={style}>
			<RingGlyph size={size} color={color} />
		</Animated.View>
	);
}
