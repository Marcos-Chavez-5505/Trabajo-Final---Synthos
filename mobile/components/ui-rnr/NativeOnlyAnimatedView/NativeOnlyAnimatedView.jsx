import { Platform, Pressable } from "react-native";
import Animated from "react-native-reanimated";

// Port de packages/registry/src/nativewind/components/ui/native-only-animated-view.tsx
// de React Native Reusables (leído en Fase 0, HTTP 200): en web no anima y
// devuelve los children tal cual; en nativo usa reanimated.
//
// `as` se desestructura para no pasarlo como prop al componente nativo.
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function NativeOnlyAnimatedView({ as, children, ...props }) {
	if (Platform.OS === "web") {
		return <>{children}</>;
	}

	if (as === "Pressable") {
		return <AnimatedPressable {...props}>{children}</AnimatedPressable>;
	}

	return <Animated.View {...props}>{children}</Animated.View>;
}
