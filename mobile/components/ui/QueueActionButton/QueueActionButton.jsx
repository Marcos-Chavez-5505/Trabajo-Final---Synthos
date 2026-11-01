import { useEffect, useRef, useState } from "react";
import { Pressable, View, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../../../theme";

// Cuánto queda el tilde de confirmación antes de volver al ícono de cola.
const FEEDBACK_MS = 1600;

/**
 * Botón de "añadir a la cola" con confirmación visual.
 *
 * Es presentacional: recibe `onAdd` (que puede devolver `false` si no se pudo
 * encolar) y no conoce ningún contexto. Así lo reutilizan tanto las tarjetas
 * como cualquier otra pantalla, y el feedback es idéntico en todas.
 */
export default function QueueActionButton({
  onAdd,
  disabled = false,
  size = 24,
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

const styles = StyleSheet.create({
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  iconWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  added: {
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  pressed: {
    transform: [{ scale: 0.9 }],
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.4,
  },
});