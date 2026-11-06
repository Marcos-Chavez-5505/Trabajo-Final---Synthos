import { useState } from "react";
import {
	Pressable,
	Text,
	TextInput,
	View,
} from "react-native";
import { colors } from "../../theme";
import { showActionError } from "../../lib/toastMessages";
import { CREATE_PLAYLIST_FORM_STYLES as styles } from "./CreatePlaylistForm.styles";

const MAX_NAME = 50;
const MAX_DESCRIPTION = 200;

/**
 * Formulario de creación de playlist. La edición del detalle es inline con los
 * mismos campos y copy. Es presentacional: el service lo llama quien lo usa
 * (`usePlaylistsPage` en la pantalla).
 *
 * Los errores de validación quedan inline; los de la API van por toast.
 */
export default function CreatePlaylistForm({ onCreate, onCancel }) {
	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [error, setError] = useState("");
	const [saving, setSaving] = useState(false);

	async function handleSubmit() {
		if (saving) return;

		if (!name.trim()) {
			setError("Ponele un nombre a la playlist.");
			return;
		}

		setError("");
		setSaving(true);

		try {
			await onCreate({ name: name.trim(), description });
		} catch (cause) {
			showActionError(cause, "playlist:create");
			setSaving(false);
		}
	}

	return (
		<View style={styles.card}>
			<Text style={styles.title}>Nueva playlist</Text>

			<TextInput
				value={name}
				onChangeText={setName}
				placeholder="Nombre de la playlist"
				placeholderTextColor={colors.textMuted}
				maxLength={MAX_NAME}
				style={styles.input}
				accessibilityLabel="Nombre de la playlist"
			/>

			<TextInput
				value={description}
				onChangeText={setDescription}
				placeholder="Descripción (opcional)"
				placeholderTextColor={colors.textMuted}
				maxLength={MAX_DESCRIPTION}
				multiline
				style={[styles.input, styles.textarea]}
				accessibilityLabel="Descripción de la playlist"
			/>

			{error ? <Text style={styles.error}>{error}</Text> : null}

			<View style={styles.buttonsRow}>
				<Pressable
					onPress={handleSubmit}
					disabled={saving}
					style={({ pressed }) => [
						styles.primaryButton,
						pressed && styles.pressed,
						saving && styles.disabled,
					]}
					accessibilityRole="button"
					accessibilityLabel="Crear playlist"
				>
					<Text style={styles.buttonText}>
						{saving ? "Creando…" : "Crear"}
					</Text>
				</Pressable>

				<Pressable
					onPress={onCancel}
					disabled={saving}
					style={({ pressed }) => [
						styles.secondaryButton,
						pressed && styles.pressed,
						saving && styles.disabled,
					]}
					accessibilityRole="button"
				>
					<Text style={styles.buttonText}>Cancelar</Text>
				</Pressable>
			</View>
		</View>
	);
}
