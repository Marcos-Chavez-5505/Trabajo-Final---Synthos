import { useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, useAuth } from "@synthos/shared";

import { REGISTER_STYLES } from "./Register.styles";

function RegisterScreen() {
	const { register } = useAuth();
	const [formData, setFormData] = useState({
		username: "",
		email: "",
		password: "",
		confirmPassword: "",
	});
	const [error, setError] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const handleChange = (name, value) => {
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const onSubmit = async () => {
		setError("");
		if (
			!formData.username ||
			!formData.email ||
			!formData.password ||
			!formData.confirmPassword
		) {
			setError("Completá todos los campos.");
			return;
		}
		if (formData.password !== formData.confirmPassword) {
			setError("Las contraseñas no coinciden.");
			return;
		}
		if (formData.password.length < 8) {
			setError(
				"La contraseña necesita al menos 8 caracteres, 1 número y 1 mayúscula."
			);
			return;
		}
		if (!/\d/.test(formData.password) || !/[A-Z]/.test(formData.password)) {
			setError(
				"La contraseña necesita al menos 8 caracteres, 1 número y 1 mayúscula."
			);
			return;
		}

		setSubmitting(true);
		const result = await register({
			username: formData.username,
			email: formData.email,
			password: formData.password,
		});
		setSubmitting(false);
		if (!result.success) {
			setError(result.message);
		}
	};

	return (
		<View style={REGISTER_STYLES.main}>
			<View style={REGISTER_STYLES.card}>
				<Text style={REGISTER_STYLES.header}>Crear cuenta</Text>
				<Text style={REGISTER_STYLES.subtitle}>
					Registrate para empezar a escuchar.
				</Text>

				<View style={REGISTER_STYLES.form}>
					<View style={REGISTER_STYLES.field}>
						<Text style={REGISTER_STYLES.labelText}>Nombre de usuario</Text>
						<TextInput
							style={REGISTER_STYLES.input}
							placeholder="Tu nombre"
							placeholderTextColor={REGISTER_STYLES.placeholderTextColor}
							autoCapitalize="none"
							value={formData.username}
							onChangeText={(value) => handleChange("username", value)}
						/>
					</View>

					<View style={REGISTER_STYLES.field}>
						<Text style={REGISTER_STYLES.labelText}>Email</Text>
						<TextInput
							style={REGISTER_STYLES.input}
							placeholder="correo@ejemplo.com"
							placeholderTextColor={REGISTER_STYLES.placeholderTextColor}
							autoCapitalize="none"
							keyboardType="email-address"
							value={formData.email}
							onChangeText={(value) => handleChange("email", value)}
							autoComplete="email"
						/>
					</View>

					<View style={REGISTER_STYLES.field}>
						<Text style={REGISTER_STYLES.labelText}>Contraseña</Text>
						<TextInput
							style={REGISTER_STYLES.input}
							placeholder="••••••••"
							placeholderTextColor={REGISTER_STYLES.placeholderTextColor}
							secureTextEntry
							value={formData.password}
							onChangeText={(value) => handleChange("password", value)}
							autoComplete="password"
						/>
					</View>

					<View style={REGISTER_STYLES.field}>
						<Text style={REGISTER_STYLES.labelText}>Confirmar contraseña</Text>
						<TextInput
							style={REGISTER_STYLES.input}
							placeholder="••••••••"
							placeholderTextColor={REGISTER_STYLES.placeholderTextColor}
							secureTextEntry
							value={formData.confirmPassword}
							onChangeText={(value) => handleChange("confirmPassword", value)}
							autoComplete="password"
						/>
					</View>

					{error ? (
						<View style={REGISTER_STYLES.errorContainer}>
							<Text style={REGISTER_STYLES.errorText}>{error}</Text>
						</View>
					) : null}

					<Pressable
						style={[
							REGISTER_STYLES.button,
							submitting && REGISTER_STYLES.buttonDisabled,
						]}
						onPress={onSubmit}
						disabled={submitting}
					>
						<Text style={REGISTER_STYLES.buttonText}>
							{submitting ? "Creando cuenta…" : "Crear cuenta"}
						</Text>
					</Pressable>
				</View>

				<View style={REGISTER_STYLES.linkContainer}>
					<Text style={REGISTER_STYLES.linkText}>¿Ya tenés cuenta?</Text>
					<Text style={REGISTER_STYLES.linkAction}>Iniciá sesión</Text>
				</View>
			</View>

			<StatusBar style="light" />
		</View>
	);
}

export default function App() {
	return (
		<AuthProvider>
			<RegisterScreen />
		</AuthProvider>
	);
}
