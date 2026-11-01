import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import * as SecureStore from "expo-secure-store";
import { useAuth } from "@synthos/shared";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/Avatar/Avatar";
import { PROFILE_EDIT_STYLES as styles } from "./ProfileEdit.styles";
import { File } from "expo-file-system";

export default function ProfileEditScreen() {
	const navigation = useNavigation();
	const { user, updateProfile } = useAuth();

	const [username, setUsername] = useState(user?.username ?? "");
	const [bio, setBio] = useState(user?.bio ?? "");
	const [pendingUri, setPendingUri] = useState(null);
	const [error, setError] = useState("");
	const [saving, setSaving] = useState(false);

	async function pickImage() {
		const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (status !== "granted") {
			setError("Necesitamos permiso para acceder a tus fotos.");
			return;
		}
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ["images"],
			allowsEditing: true,
			aspect: [1, 1],
			quality: 0.8,
		});
		if (!result.canceled) {
			setPendingUri(result.assets[0].uri);
		}
	}

	async function handleSave() {
		setError("");
		setSaving(true);
		try {
			await updateProfile({ username, biography: bio });

			if (pendingUri) {
				const filename = pendingUri.split("/").pop() || "profile.jpg";
                const formData = new FormData();
                formData.append("picture", new File(pendingUri, filename));

                const sessionRaw = await SecureStore.getItemAsync("synthos_auth");
                const session = sessionRaw ? JSON.parse(sessionRaw) : null;
                const token = session?.token;

                const API_URL = process.env.EXPO_PUBLIC_API_URL;

                const res = await fetch(`${API_URL}/users/me/picture`, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                });

                if (!res.ok) {
                    const data = await res.json();
                    throw new Error(data?.message || "Error al subir la foto.");
                }
			}
			navigation.goBack();
		} catch (err) {
			setError(err?.message || "Error al guardar los cambios.");
		} finally {
			setSaving(false);
		}
	}

	const avatarSrc = pendingUri ?? user?.avatarUrl;

	return (
		<View style={styles.container}>
			<ScrollView showsVerticalScrollIndicator={false}>
				<View style={styles.card}>
					<Text style={styles.title}>Editar perfil</Text>

					<View style={styles.avatarRow}>
						<Avatar size={80}>
							<AvatarImage uri={avatarSrc} name={username} />
							<AvatarFallback name={username} />
						</Avatar>
						<View style={styles.avatarButtons}>
							<Pressable
								style={[styles.smallButton, saving && styles.buttonDisabled]}
								onPress={pickImage}
								disabled={saving}
							>
								<Text style={styles.smallButtonText}>Cambiar foto</Text>
							</Pressable>
						</View>
					</View>

					<Text style={styles.hint}>
						Seleccioná una imagen cuadrada. Se sube al guardar.
					</Text>

					<Text style={styles.label}>Nombre de usuario</Text>
					<TextInput
						style={styles.input}
						value={username}
						onChangeText={setUsername}
						placeholder="Nombre de usuario"
						placeholderTextColor="#b0a4b5"
					/>

					<Text style={styles.label}>Bio</Text>
					<TextInput
						style={[styles.input, styles.textarea]}
						value={bio}
						onChangeText={setBio}
						placeholder="Contá algo sobre vos"
						placeholderTextColor="#b0a4b5"
						multiline
					/>

					{error ? <Text style={styles.error}>{error}</Text> : null}

					<View style={styles.buttonsRow}>
						<Pressable
							style={[styles.buttonPrimary, saving && styles.buttonDisabled]}
							onPress={handleSave}
							disabled={saving}
						>
							{saving ? (
								<ActivityIndicator color="#fff" />
							) : (
								<Text style={styles.buttonText}>Guardar</Text>
							)}
						</Pressable>
						<Pressable
							style={styles.buttonSecondary}
							onPress={() => navigation.goBack()}
							disabled={saving}
						>
							<Text style={styles.buttonText}>Cancelar</Text>
						</Pressable>
					</View>
				</View>
			</ScrollView>

			<StatusBar style="light" />
		</View>
	);
}