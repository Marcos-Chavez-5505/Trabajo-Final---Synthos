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
import { useAuth, listPlaylists, createRoom, useMyRooms } from "@synthos/shared";
import { CREATE_ROOM_STYLES as styles } from "./CreateRoom.styles";
import { showActionError, showSuccess } from "../../lib/toastMessages";

const MAX_NAME = 60;
const MAX_DESCRIPTION = 200;

export default function CreateRoomScreen() {
	const navigation = useNavigation();
	const { user } = useAuth();
	const { currentRoom, loading: roomsLoading } = useMyRooms();

	const [playlists, setPlaylists] = useState(null);
	const [loadVersion, setLoadVersion] = useState(0);

	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [isPrivate, setIsPrivate] = useState(false);
	const [playlistId, setPlaylistId] = useState("");
	const [error, setError] = useState("");
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (!user) return undefined;

		let active = true;

		listPlaylists(user.id).then(
			(all) => {
				if (!active) return;
				const usable = all.filter((p) => p.songIds.length > 0);
				setPlaylists(usable);
				setPlaylistId((current) => current || (usable[0]?.id ?? ""));
			},
			(cause) => {
				if (!active) return;
				// Sin playlists cargadas la pantalla se queda en "cargando":
				// caer a [] deja ver el estado vacío y el toast lleva el retry.
				setPlaylists([]);
				showActionError(cause, "playlists:load", {
					retry: () => setLoadVersion((value) => value + 1),
				});
			},
		);

		return () => {
			active = false;
		};
	}, [user, loadVersion]);

	if (!user) return null;

	if (currentRoom) {
		const isCurrentHost = String(currentRoom.hostId) === String(user.id);

		return (
			<View style={styles.container}>
				<ScrollView contentContainerStyle={styles.scroll}>
					<Text style={styles.title}>Ya estás en una sala</Text>
					<Text style={styles.subtitle}>
						{isCurrentHost
							? `Cerrá «${currentRoom.name}» para crear otra.`
							: `Salí de «${currentRoom.name}» para crear otra.`}
					</Text>

					<View style={styles.buttonsRow}>
						<Pressable
							style={styles.buttonPrimary}
							onPress={() =>
								navigation.replace("RoomDetail", { id: currentRoom.id })
							}
						>
							<Text style={styles.buttonText}>Ir a mi sala</Text>
						</Pressable>
						<Pressable
							style={styles.buttonSecondary}
							onPress={() => navigation.goBack()}
						>
							<Text style={styles.buttonText}>Volver</Text>
						</Pressable>
					</View>
				</ScrollView>

				<StatusBar style="light" />
			</View>
		);
	}

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

		setSaving(true);
		try {
			const created = await createRoom({
				name,
				description,
				isPrivate,
				playlistId,
			});
			showSuccess("room:create");
			navigation.replace("RoomDetail", { id: created.id });
		} catch (cause) {
			showActionError(cause, "room:create");
			setSaving(false);
		}
	}

	if (playlists === null || roomsLoading) {
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
								? "No aparece en el listado. Se entra con el código."
								: "Aparece en el listado y cualquiera puede entrar sin código."}
						</Text>

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