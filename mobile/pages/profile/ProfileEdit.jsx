import { useState } from "react";
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
import * as ImagePicker from "expo-image-picker";
import { File } from "expo-file-system";
import { useAuth } from "@synthos/shared";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "../../components/ui/Avatar/Avatar";
import { PROFILE_EDIT_STYLES as styles } from "./ProfileEdit.styles";
import { showActionError, showSuccess } from "../../lib/toastMessages";

export default function ProfileEditScreen() {
	const navigation = useNavigation();
	const { user, updateProfile, uploadProfilePicture } = useAuth();

	const [username, setUsername] = useState(user?.username ?? "");
	const [bio, setBio] = useState(user?.bio ?? "");
	const [pendingUri, setPendingUri] = useState(null);
	const [saving, setSaving] = useState(false);

	async function pickImage() {
		const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (status !== "granted") {
			showActionError(
				{ message: "Necesitamos permiso para acceder a tus fotos." },
				"profile:picture",
			);
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
		setSaving(true);
		let stage = "profile:save";

		try {
			await updateProfile({ username, bio });

			if (pendingUri) {
				stage = "profile:picture";

				// El fetch de Expo SDK 58 no acepta `{ uri, name, type }` en
				// FormData; `File` implementa `bytes()` y sí lo convierte.
				await uploadProfilePicture(new File(pendingUri));
			}

			showSuccess("profile:save");
			navigation.goBack();
		} catch (cause) {
			showActionError(cause, stage);
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