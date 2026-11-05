import { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Keyboard,
	KeyboardAvoidingView,
	Modal,
	Platform,
	Pressable,
	ScrollView,
	Text,
	TextInput,
	View,
} from "react-native";
import {
	Gesture,
	GestureDetector,
	GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
	Easing,
	useAnimatedStyle,
	useSharedValue,
	withSpring,
	withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { mapApiError, searchUsers, useDebounce } from "@synthos/shared";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "../../ui/Avatar/Avatar";
import { colors, spacing } from "../../../theme";
import { INVITE_USER_SHEET_STYLES as styles } from "./InviteUserSheet.styles";

const DEBOUNCE_MS = 300;
const MIN_QUERY = 2;
const PAGE_SIZE = 10;

// Empujar el asa más de esta distancia (o con esta velocidad) cierra el sheet.
const CLOSE_DISTANCE = 110;
const CLOSE_VELOCITY = 900;
const DRAG_SETTLE = { damping: 45, stiffness: 500 };
const DRAG_EXIT = { duration: 180, easing: Easing.out(Easing.cubic) };

const STATUS_LABEL = {
	pendiente: "Pendiente",
	aceptada: "Aceptó",
	rechazada: "Rechazó",
};

// Reanimated mueve los shared values en el hilo de UI; el linter de React los
// trata como valores inmutables del render y no distingue ese patrón.
/* eslint-disable react-hooks/immutability */

/**
 * Bottom sheet para invitar personas a una playlist (port de `UserSearch` web).
 *
 * Busca con la API (desde 2 letras, con debounce) y excluye a miembros e
 * invitados. `onInvite` devuelve una promesa: el sheet muestra el estado de
 * envío y el error inline sin cerrarse, para invitar a varias seguidas.
 */
export default function InviteUserSheet({
	open,
	onClose,
	userId,
	isCollaborative,
	excludeIds = [],
	invitations = [],
	onInvite,
}) {
	const insets = useSafeAreaInsets();
	const [query, setQuery] = useState("");
	const [response, setResponse] = useState({ key: null, items: [], error: null });
	const [pendingId, setPendingId] = useState(null);
	const [submitError, setSubmitError] = useState("");

	const dragY = useSharedValue(0);
	const sheetHeight = useSharedValue(0);

	const sheetDrag = useAnimatedStyle(() => ({
		transform: [{ translateY: dragY.value }],
	}));

	// El arrastre vive en el asa: así no compite con el scroll de resultados ni
	// con el teclado del buscador. Hacia arriba el sheet no se mueve.
	const dragGesture = Gesture.Pan()
		.activeOffsetY([-9999, 10])
		.onUpdate((event) => {
			dragY.value = Math.max(0, event.translationY);
		})
		.onEnd((event) => {
			const shouldClose =
				event.translationY > CLOSE_DISTANCE ||
				event.velocityY > CLOSE_VELOCITY;

			if (!shouldClose) {
				dragY.value = withSpring(0, DRAG_SETTLE);
				return;
			}

			dragY.value = withTiming(
				sheetHeight.value + 80,
				DRAG_EXIT,
				(finished) => {
					if (finished) scheduleOnRN(handleClose);
				},
			);
		});

	const trimmedQuery = query.trim();
	const hasMinChars = trimmedQuery.length >= MIN_QUERY;
	const debouncedQuery = useDebounce(trimmedQuery, DEBOUNCE_MS);
	const canSearch = debouncedQuery.length >= MIN_QUERY;
	const requestKey = canSearch ? debouncedQuery : null;

	useEffect(() => {
		if (!open || !canSearch) return undefined;

		const controller = new AbortController();
		let active = true;

		searchUsers(debouncedQuery, 1, PAGE_SIZE, { signal: controller.signal })
			.then((data) => {
				if (active) setResponse({ key: requestKey, items: data.items, error: null });
			})
			.catch((cause) => {
				if (!active || cause?.name === "AbortError") return;
				setResponse({ key: requestKey, items: [], error: mapApiError(cause) });
			});

		return () => {
			active = false;
			controller.abort();
		};
	}, [open, canSearch, debouncedQuery, requestKey]);

	function handleClose() {
		Keyboard.dismiss();
		dragY.value = 0;
		setQuery("");
		setResponse({ key: null, items: [], error: null });
		setPendingId(null);
		setSubmitError("");
		onClose?.();
	}

	const isSettled = trimmedQuery === debouncedQuery;
	const isCurrent = response.key === requestKey;
	const isLoading = open && hasMinChars && (!isSettled || (canSearch && !isCurrent));
	const searchError = isSettled && isCurrent ? response.error : null;

	const excluded = new Set(excludeIds);
	const people =
		isSettled && isCurrent
			? response.items.filter(
					(person) => person.id !== userId && !excluded.has(person.id),
				)
			: [];

	async function handleSelect(person) {
		if (pendingId) return;

		setPendingId(person.id);
		setSubmitError("");

		try {
			await onInvite?.(person);
			setQuery("");
		} catch (cause) {
			setSubmitError(mapApiError(cause));
		} finally {
			setPendingId(null);
		}
	}

	return (
		<Modal
			visible={open}
			transparent
			animationType="slide"
			statusBarTranslucent
			onRequestClose={handleClose}
		>
			<GestureHandlerRootView style={styles.overlay}>
				<KeyboardAvoidingView
					style={styles.overlay}
					behavior={Platform.OS === "ios" ? "padding" : undefined}
				>
					<Pressable
						style={styles.backdrop}
						onPressIn={handleClose}
						accessibilityRole="button"
						accessibilityLabel="Cerrar"
					/>

					<Animated.View
						style={[
							styles.sheet,
							{ paddingBottom: insets.bottom + spacing.lg },
							sheetDrag,
						]}
						onLayout={(event) => {
							sheetHeight.value = event.nativeEvent.layout.height;
						}}
					>
						<GestureDetector gesture={dragGesture}>
							<View style={styles.dragArea}>
								<View style={styles.grabber} />
								<Text style={styles.title}>Invitar a la playlist</Text>
							</View>
						</GestureDetector>

						<Text style={styles.description}>
							{isCollaborative
								? "Buscá a quien quieras sumar. Van a poder agregar y quitar canciones."
								: "Al invitar a alguien, la playlist deja de ser privada y pasa a ser colaborativa."}
						</Text>

						<View style={styles.searchWrapper}>
							<TextInput
								value={query}
								onChangeText={setQuery}
								placeholder="Buscar personas…"
								placeholderTextColor={colors.textMuted}
								autoCapitalize="none"
								autoCorrect={false}
								style={styles.searchInput}
								accessibilityLabel="Buscar personas"
							/>
							{isLoading ? <ActivityIndicator color={colors.textMuted} /> : null}
						</View>

						{submitError ? <Text style={styles.error}>{submitError}</Text> : null}

						<ScrollView
							style={styles.results}
							keyboardShouldPersistTaps="handled"
							showsVerticalScrollIndicator={false}
						>
							{searchError ? (
								<Text style={styles.message}>{searchError}</Text>
							) : !hasMinChars ? (
								<Text style={styles.message}>
									Escribí al menos {MIN_QUERY} letras para buscar personas.
								</Text>
							) : isLoading && people.length === 0 ? (
								<Text style={styles.message}>Buscando…</Text>
							) : people.length === 0 ? (
								<Text style={styles.message}>
									No encontramos personas para “{trimmedQuery}”.
								</Text>
							) : (
								people.map((person) => (
									<Pressable
										key={person.id}
										onPress={() => handleSelect(person)}
										disabled={pendingId !== null}
										style={({ pressed }) => [
											styles.personRow,
											pressed && styles.pressed,
											pendingId !== null && styles.disabled,
										]}
										accessibilityRole="button"
										accessibilityLabel={`Invitar a ${person.username}`}
									>
										<Avatar size={32}>
											<AvatarImage
												uri={person.avatarUrl}
												name={person.username}
											/>
											<AvatarFallback name={person.username} />
										</Avatar>

										<View style={styles.personText}>
											<Text style={styles.personName} numberOfLines={1}>
												{person.username}
											</Text>
											<Text style={styles.personEmail} numberOfLines={1}>
												{person.email || `@${person.username}`}
											</Text>
										</View>

										{pendingId === person.id ? (
											<Text style={styles.pending}>Enviando…</Text>
										) : null}
									</Pressable>
								))
							)}

							{invitations.length > 0 ? (
								<View style={styles.sentSection}>
									<Text style={styles.sentTitle}>Invitaciones enviadas</Text>
									{invitations.map((invitation) => (
										<View
											key={invitation.receiver.id}
											style={styles.sentRow}
											accessibilityLabel={`${invitation.receiver.username}: ${STATUS_LABEL[invitation.status] ?? "Pendiente"}`}
										>
											<Avatar size={28}>
												<AvatarImage
													uri={invitation.receiver.avatarUrl}
													name={invitation.receiver.username}
												/>
												<AvatarFallback name={invitation.receiver.username} />
											</Avatar>
											<Text style={styles.sentName} numberOfLines={1}>
												{invitation.receiver.username}
											</Text>
											<Text style={styles.sentStatus}>
												{STATUS_LABEL[invitation.status] ?? "Pendiente"}
											</Text>
										</View>
									))}
								</View>
							) : null}
						</ScrollView>
					</Animated.View>
				</KeyboardAvoidingView>
			</GestureHandlerRootView>
		</Modal>
	);
}
