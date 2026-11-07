import { Pressable, Text, View } from "react-native";
import { PAGINATION_STYLES as styles } from "./Pagination.styles";

/**
 * Paginación compacta para listas de mobile.
 *
 * Muestra la página actual y permite avanzar o retroceder. A diferencia de la
 * web, no dibuja un botón por página: en pantallas angostas los números no
 * entran y el par anterior/siguiente cubre la misma necesidad.
 */
export default function Pagination({
	page,
	totalPages,
	onPageChange,
	disabled = false,
	style,
}) {
	const isFirstPage = page <= 1;
	const isLastPage = page >= totalPages;

	return (
		<View style={[styles.container, style]}>
			<Pressable
				onPress={() => onPageChange(page - 1)}
				disabled={disabled || isFirstPage}
				style={({ pressed }) => [
					styles.button,
					(disabled || isFirstPage) && styles.disabled,
					pressed && !disabled && !isFirstPage && styles.pressed,
				]}
				accessibilityRole="button"
				accessibilityLabel="Página anterior"
				accessibilityState={{ disabled: disabled || isFirstPage }}
			>
				<Text style={styles.buttonLabel}>Anterior</Text>
			</Pressable>

			<Text style={styles.pageLabel}>{`Página ${page} de ${totalPages}`}</Text>

			<Pressable
				onPress={() => onPageChange(page + 1)}
				disabled={disabled || isLastPage}
				style={({ pressed }) => [
					styles.button,
					(disabled || isLastPage) && styles.disabled,
					pressed && !disabled && !isLastPage && styles.pressed,
				]}
				accessibilityRole="button"
				accessibilityLabel="Página siguiente"
				accessibilityState={{ disabled: disabled || isLastPage }}
			>
				<Text style={styles.buttonLabel}>Siguiente</Text>
			</Pressable>
		</View>
	);
}
