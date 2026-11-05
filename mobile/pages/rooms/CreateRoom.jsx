import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Pressable,
	ScrollView,
	Text,
	TextInput,
	View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useNavigation } from "@react-navigation/native";
import { useAuth, listPlaylists, createRoom, mapApiError } from "@synthos/shared";
import { CREATE_ROOM_STYLES as styles } from "./CreateRoom.styles";
import { showActionError, showSuccess } from "../../lib/toastMessages";

const MAX_NAME = 60;
const MAX_DESCRIPTION = 200;

export default function CreateRoomScreen() {
	const navigation = useNavigation();
	const { user } = useAuth();

	const [playlists, setPlaylists] = useState(null);
	const [loadError, setLoadError] = useState("");

	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [isPrivate, setIsPrivate] = useState(false);
	const [password, setPassword] = useState("");
	const [playlistId, setPlaylistId] = useState("");
	const [error, setError] = useState("");
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (!user) return;

		let active = true;

		listPlaylists(user.id)
			.then((all) => {
				if (!active) return;
				const usable = all.filter((p) => p.songIds.length > 0);
				setPlaylists(usable);
				setPlaylistId((current) => current || (usable[0]?.id ?? ""));
			})
			.catch((cause) => {
				if (active) setLoadError(mapApiError(cause));
			});

		return () => {
			active = false;
		};
	}, [user]);

	if (!user) return null;

	const nothingToShow = playlists !== null && playlists.length === 0;

	async function handleSubmit() {
		if (saving) return;
		setError("");

		if (!name.trim()) {
			setError("Poné un nombre para la sala.");
			return;
		}
		if (!playlistId) {
			setError("Elegí una playlist como fuente de la sala.");
			return;
		}
		if (isPrivate && !password.trim()) {
			setError("Las salas privadas necesitan contraseña.");
			return;
		}

		setSaving(true);
		try {
			const created = await createRoom({
				name,
				description,
				isPrivate,
				password,
				playlistId,
			});
			showSuccess("room:create");
			navigation.replace("RoomDetail", { id: created.id });
		} catch (cause) {
			showActionError(cause, "room:create");
			setSaving(false);
		}
	}

	if (playlists === null) {
		return (
			<View style={styles.container}>
				<Text style={styles.loadingText}>Cargando tus playlists…</Text>
				<StatusBar style="light" />
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<ScrollView contentContainerStyle={styles.scroll}>
				<Text style={styles.title}>Crear sala</Text>
				<Text style={styles.subtitle}>
					Una sala se escucha en grupo. Elegí de qué playlist arranca.
				</Text>

				{loadError ? <Text style={styles.error}>{loadError}</Text> : null}

				{nothingToShow ? (
					<View style={styles.emptyContainer}>
						<Text style={styles.emptyTitle}>
							Necesitás una playlist con canciones
						</Text>
						<Text style={styles.emptyText}>
							La sala arranca reproduciendo tus canciones, así que hace falta al
							menos una playlist con al menos una canción.
						</Text>
					</View>
				) : (
					<>
						<Text style={styles.label}>Nombre de la sala</Text>
						<TextInput
							style={styles.input}
							value={name}
							onChangeText={setName}
							placeholder="Ej: Rock de la tarde"
							placeholderTextColor="#b0a4b5"
							maxLength={MAX_NAME}
						/>

						<Text style={styles.label}>Descripción (opcional)</Text>
						<TextInput
							style={[styles.input, styles.textarea]}
							value={description}
							onChangeText={setDescription}
							placeholder="De qué se trata la sala"
							placeholderTextColor="#b0a4b5"
							maxLength={MAX_DESCRIPTION}
							multiline
						/>

						<Text style={styles.label}>Visibilidad</Text>
						<View style={styles.visibilityRow}>
							<Pressable
								style={[
									styles.visibilityButton,
									!isPrivate
										? styles.visibilityButtonActive
										: styles.visibilityButtonInactive,
								]}
								onPress={() => setIsPrivate(false)}
							>
								<Text style={styles.visibilityButtonText}>Pública</Text>
							</Pressable>
							<Pressable
								style={[
									styles.visibilityButton,
									isPrivate
										? styles.visibilityButtonActive
										: styles.visibilityButtonInactive,
								]}
								onPress={() => setIsPrivate(true)}
							>
								<Text style={styles.visibilityButtonText}>Privada</Text>
							</Pressable>
						</View>
						<Text style={styles.hint}>
							{isPrivate
								? "No aparece en el listado. Se entra con el código y la contraseña."
								: "Aparece en el listado y cualquiera puede entrar sin código."}
						</Text>

						{isPrivate ? (
							<>
								<Text style={styles.label}>Contraseña de la sala</Text>
								<TextInput
									style={styles.input}
									value={password}
									onChangeText={setPassword}
									placeholder="Mínimo 4 caracteres"
									placeholderTextColor="#b0a4b5"
									secureTextEntry
									maxLength={40}
								/>
							</>
						) : null}

						<Text style={styles.label}>Playlist fuente</Text>
						{playlists.map((p) => (
							<Pressable
								key={p.id}
								style={[
									styles.playlistItem,
									p.id === playlistId && styles.playlistItemActive,
								]}
								onPress={() => setPlaylistId(p.id)}
							>
								<Text style={styles.playlistName}>{p.name}</Text>
								<Text style={styles.playlistMeta}>
									{p.songIds.length}{" "}
									{p.songIds.length === 1 ? "canción" : "canciones"}
								</Text>
							</Pressable>
						))}

						<Text style={styles.hint}>
							Cupo máximo: 10 personas. Lo define el servidor, no se puede
							cambiar.
						</Text>

						{error ? <Text style={styles.error}>{error}</Text> : null}

						<View style={styles.buttonsRow}>
							<Pressable
								style={[styles.buttonPrimary, saving && styles.buttonDisabled]}
								onPress={handleSubmit}
								disabled={saving}
							>
								{saving ? (
									<ActivityIndicator color="#fff" />
								) : (
									<Text style={styles.buttonText}>Crear sala</Text>
								)}
							</Pressable>
							<Pressable
								style={styles.buttonSecondary}
								onPress={() => navigation.goBack()}
								disabled={saving}
							>
								<Text style={styles.buttonText}>Volver</Text>
							</Pressable>
						</View>
					</>
				)}
			</ScrollView>

			<StatusBar style="light" />
		</View>
	);
}