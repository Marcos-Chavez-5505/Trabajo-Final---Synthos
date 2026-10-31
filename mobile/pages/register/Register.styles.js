import { AUTH_STYLES, AUTH_COLORS } from "../auth/Auth.styles";

// Register no tiene estilos propios: era idéntico al bloque común de Login.
// Si más adelante necesita algo exclusivo, agregarlo con StyleSheet.create
// y mezclarlo acá, igual que en Login.styles.js.
export const REGISTER_STYLES = {
	...AUTH_STYLES,
	placeholderTextColor: AUTH_COLORS.placeholderTextColor,
};