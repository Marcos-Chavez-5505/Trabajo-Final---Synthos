import * as SecureStore from "expo-secure-store";
import { configureApi } from "@synthos/shared";

// Adaptador de storage para React Native: expo-secure-store (contrato async).
const secureStorage = {
	getItem: (key) => SecureStore.getItemAsync(key),
	setItem: (key, value) => SecureStore.setItemAsync(key, value),
	removeItem: (key) => SecureStore.deleteItemAsync(key),
};

export function initApi() {
	configureApi({
		baseUrl: process.env.EXPO_PUBLIC_API_URL || "http://localhost:3000/api",
		storage: secureStorage,
	});
}
