import { useState } from "react";
import {
	ActivityIndicator,
	Pressable,
	Text,
	TextInput,
	View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { AuthProvider, configureApi, useAuth } from "@synthos/shared";
import * as SecureStore from "expo-secure-store";

import { LOGIN_STYLES } from "./Login.styles";

// Adaptador de storage para React Native: expo-secure-store (contrato async).
const secureStorage = {
	getItem: (key) => SecureStore.getItemAsync(key),
	setItem: (key, value) => SecureStore.setItemAsync(key, value),
	removeItem: (key) => SecureStore.deleteItemAsync(key),
};

configureApi({
	baseUrl: process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api",
	storage: secureStorage,
});

function LoginScreen() {
	const { login, user, loading, logout } = useAuth();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [submitting, setSubmitting] = useState(false);

	const onSubmit = async () => {
		setError("");
		if (!email || !password) {
			setError("Completá todos los campos.");
			return;
		}
		setSubmitting(true);
		const result = await login(email, password);
		setSubmitting(false);
		if (!result.success) {
			setError(result.message);
		}
	};

	if (loading) {
		return (
			<View style={LOGIN_STYLES.loadingContainer}>
				<ActivityIndicator color={LOGIN_STYLES.indicatorColor} />
				<StatusBar style="light" />
			</View>
		);
	}

	if (user) {
		return (
			<View style={LOGIN_STYLES.loggedContainer}>
				<View style={LOGIN_STYLES.loggedCard}>
					<Text style={LOGIN_STYLES.loggedTitle}>Hola, {user.username}</Text>
					<Text style={LOGIN_STYLES.loggedSubtitle}>
						Sesión iniciada correctamente.
					</Text>

					<Pressable
						style={[LOGIN_STYLES.button, LOGIN_STYLES.logoutButton]}
						onPress={logout}
					>
						<Text style={LOGIN_STYLES.buttonText}>Cerrar sesión</Text>
					</Pressable>
				</View>
				<StatusBar style="light" />
			</View>
		);
	}

	return (
		<View style={LOGIN_STYLES.main}>
			<View style={LOGIN_STYLES.card}>
				<Text style={LOGIN_STYLES.header}>Iniciar sesión</Text>
				<Text style={LOGIN_STYLES.subtitle}>
					Ingresá a tu cuenta de Synthos.
				</Text>

				<View style={LOGIN_STYLES.form}>
					<View style={LOGIN_STYLES.field}>
						<Text style={LOGIN_STYLES.labelText}>Email</Text>
						<TextInput
							style={LOGIN_STYLES.input}
							placeholder="correo@ejemplo.com"
							placeholderTextColor={LOGIN_STYLES.placeholderTextColor}
							autoCapitalize="none"
							keyboardType="email-address"
							value={email}
							onChangeText={setEmail}
							autoComplete="email"
						/>
					</View>

					<View style={LOGIN_STYLES.field}>
						<Text style={LOGIN_STYLES.labelText}>Contraseña</Text>
						<TextInput
							style={LOGIN_STYLES.input}
							placeholder="••••••••"
							placeholderTextColor={LOGIN_STYLES.placeholderTextColor}
							secureTextEntry
							value={password}
							onChangeText={setPassword}
							autoComplete="password"
						/>
					</View>

					{error ? (
						<View style={LOGIN_STYLES.errorContainer}>
							<Text style={LOGIN_STYLES.errorText}>{error}</Text>
						</View>
					) : null}

					<Pressable
						style={[
							LOGIN_STYLES.button,
							submitting && LOGIN_STYLES.buttonDisabled,
						]}
						onPress={onSubmit}
						disabled={submitting}
					>
						<Text style={LOGIN_STYLES.buttonText}>
							{submitting ? "Ingresando…" : "Ingresar"}
						</Text>
					</Pressable>
				</View>

				<View style={LOGIN_STYLES.linkContainer}>
					<Text style={LOGIN_STYLES.linkText}>¿No tenés cuenta?</Text>
					<Text style={LOGIN_STYLES.linkAction}>Creá una</Text>
				</View>
			</View>

			<StatusBar style="light" />
		</View>
	);
}

export default function App() {
	return (
		<AuthProvider>
			<LoginScreen />
		</AuthProvider>
	);
}
