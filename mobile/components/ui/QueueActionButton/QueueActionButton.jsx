import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo } from "react-native";
import { colors, sizes } from "../../../theme";
import { AddToQueueIcon, CheckIcon } from "../../icons";
import ScalePressable from "../ScalePressable/ScalePressable";
import {
	QUEUE_ACTION_BUTTON_STYLES as styles,
	dynamicSize,
} from "./QueueActionButton.styles";

// Cuánto queda el tilde de confirmación antes de volver al ícono de cola.
const FEEDBACK_MS = 1600;

/**
 * Botón de "añadir a la cola" con confirmación visual (port de
 * `QueueActionButton` web).
 *
 * Es presentacional: recibe `onAdd` (que puede devolver `false` si no se pudo
 * encolar) y no conoce el `PlayerContext`. Así lo reutilizan las tarjetas y el
 * feedback es idéntico en todas las pantallas: el ícono cambia a un tilde, el
 * botón se achica al presionar y queda un anillo durante `FEEDBACK_MS`. El
 * cambio de etiqueta se anuncia a lectores de pantalla.
 *
 * Equivalentes a la API web: `className` → `style`, `iconClassName` → `size`,
 * `title` → `accessibilityHint` (React Native no tiene tooltips).
 */
export default function QueueActionButton({
	onAdd,
	label = "Añadir a la cola",
	title,
	disabled = false,
	size = 16,
	buttonSize = sizes.mediaCardPlay,
	hitSlop = 8,
	style,
}) {
	const [added, setAdded] = useState(false);
	const timerRef = useRef(null);

	useEffect(() => () => clearTimeout(timerRef.current), []);

	function handlePress() {
		const result = onAdd?.();

		// La cola rechazó el pedido (p. ej. modo sala): no hay nada que confirmar.
		if (result === false) return;

		setAdded(true);
		clearTimeout(timerRef.current);
		timerRef.current = setTimeout(() => setAdded(false), FEEDBACK_MS);
		AccessibilityInfo.announceForAccessibility("Añadida a la cola");
	}

	const stateLabel = added ? "Añadida a la cola" : label;
	const Icon = added ? CheckIcon : AddToQueueIcon;

	return (
		<ScalePressable
			onPress={handlePress}
			disabled={disabled}
			hitSlop={hitSlop}
			accessibilityRole="button"
			accessibilityLabel={stateLabel}
			accessibilityHint={title}
			accessibilityState={{ disabled }}
			style={[
				styles.button,
				dynamicSize(buttonSize),
				added && styles.added,
				disabled && styles.disabled,
				style,
			]}
		>
			<Icon size={size} color={colors.lighter} />
		</ScalePressable>
	);
}
