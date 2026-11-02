import { useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../../theme";
import {
	QUEUE_ACTION_BUTTON_STYLES as styles,
	dynamicSize,
} from "./QueueActionButton.styles";

const FEEDBACK_MS = 1600;

export default function QueueActionButton({
	onAdd,
	disabled = false,
	size = 24,
	buttonSize = 40,
	style,
}) {
	const [added, setAdded] = useState(false);
	const timerRef = useRef(null);

	useEffect(() => () => clearTimeout(timerRef.current), []);

	function handlePress() {
		const result = onAdd?.();
		if (result === false) return;

		setAdded(true);
		clearTimeout(timerRef.current);
		timerRef.current = setTimeout(() => setAdded(false), FEEDBACK_MS);
	}

	return (
		<Pressable
			onPress={handlePress}
			disabled={disabled}
			accessibilityRole="button"
			accessibilityLabel={added ? "Añadida a la cola" : "Añadir a la cola"}
			style={({ pressed }) => [
				styles.button,
				dynamicSize(buttonSize),
				added && styles.added,
				pressed && styles.pressed,
				disabled && styles.disabled,
				style,
			]}
		>
			<View style={styles.iconWrapper}>
				<Ionicons
					name={added ? "checkmark" : "list"}
					size={size}
					color={colors.lighter}
				/>
			</View>
		</Pressable>
	);
}