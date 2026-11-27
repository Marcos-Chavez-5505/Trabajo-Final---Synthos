import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useNavigation } from "@react-navigation/native";
import { useRoomsList, useDebounce, joinRoom, useMyRooms, useAuth } from "@synthos/shared";
import RoomCard from "../../components/cards/RoomCard/RoomCard";
import TopBar from "../../components/layout/TopBar/TopBar";
import { HeadphonesIcon } from "../../components/icons";
import { ROOMS_STYLES as styles } from "./Rooms.styles";
import { colors } from "../../theme";
import { showActionError } from "../../lib/toastMessages";

const DEBOUNCE_MS = 300;

export default function RoomsScreen() {
	const [input, setInput] = useState("");
	const [retryKey, setRetryKey] = useState(0);
	const retry = useCallback(() => setRetryKey((value) => value + 1), []);

	return (
		<RoomsContent key={retryKey} input={input} setInput={setInput} retry={retry} />
	);
}

function RoomsContent({ input, setInput, retry }) {
	const navigation = useNavigation();
	const debounced = useDebounce(input, DEBOUNCE_MS);
	const [page, setPage] = useState(1);
	const listRef = useRef(null);

	const {
		isCurrent,
		rooms,
		page: currentPage,
		totalPages,
		error,
	} = useRoomsList(debounced, "name", "asc", page);

	useEffect(() => {
		if (error) showActionError(error, "rooms:load", { retry });
	}, [error, retry]);

	const { user } = useAuth();
	const { currentRoom } = useMyRooms();
	const isCurrentHost = currentRoom
		? String(currentRoom.hostId) === String(user?.id)
		: false;

	function handleSearchChange(text) {
		setInput(text);
		setPage(1);
	}

	function goToPage(target) {
		if (target < 1 || target > totalPages) return;

		setPage(target);
		listRef.current?.scrollToOffset({ offset: 0, animated: true });
	}

	function renderItem({ item }) {
		return (
			<View style={styles.cardWrapper}>
				<RoomCard
					room={item}
					onHostPress={
						item.hostId
							? () =>
									navigation.navigate("ProfilePublic", {
										userId: item.hostId,
									})
							: undefined
					}
					action={
						<JoinButton
							room={item}
							navigation={navigation}
							currentRoom={currentRoom}
							isCurrentHost={isCurrentHost}
						/>
					}
				/>
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<TopBar style={styles.topBar} />

			<FlatList
				ref={listRef}
				data={rooms}
				keyExtractor={(item) => String(item.id)}
				renderItem={renderItem}
				contentContainerStyle={styles.listContainer}
				ListFooterComponent={
					totalPages > 1 ? (
						<View style={styles.pagination}>
							<Pressable
								style={[
									styles.pageButton,
									currentPage <= 1 && styles.pageButtonDisabled,
								]}
								onPress={() => goToPage(currentPage - 1)}
								disabled={currentPage <= 1}
								accessibilityRole="button"
								accessibilityLabel="Ir a la página anterior"
							>
								<Text style={styles.pageButtonText}>Anterior</Text>
							</Pressable>

							<Text style={styles.pageLabel}>
								Página {currentPage} de {totalPages}
							</Text>

							<Pressable
								style={[
									styles.pageButton,
									currentPage >= totalPages && styles.pageButtonDisabled,
								]}
								onPress={() => goToPage(currentPage + 1)}
								disabled={currentPage >= totalPages}
								accessibilityRole="button"
								accessibilityLabel="Ir a la página siguiente"
							>
								<Text style={styles.pageButtonText}>Siguiente</Text>
							</Pressable>
						</View>
					) : null
				}
				ListHeaderComponent={
					<>
						<View style={styles.header}>
							<Text style={styles.title}>Salas</Text>
							<Text style={styles.subtitle}>
								Salas de escucha compartida. Buscá por nombre de sala o por el
								nombre de quien la anfitriona.
							</Text>
						</View>

						<Pressable
							style={styles.createButton}
							onPress={() => navigation.navigate("CreateRoom")}
						>
							<Text style={styles.createButtonText}>Crear sala</Text>
						</Pressable>

						<View style={styles.searchWrapper}>
							<TextInput
								style={styles.searchInput}
								value={input}
								onChangeText={handleSearchChange}
								placeholder="Buscar sala o anfitriona"
								placeholderTextColor={colors.textMuted}
								autoCapitalize="none"
							/>
						</View>
					</>
				}
				ListEmptyComponent={
					!isCurrent ? (
						<Text style={styles.loadingText}>Buscando salas…</Text>
					) : (
						<EmptyState hasQuery={Boolean(debounced.trim())} />
					)
				}
			/>

			<StatusBar style="light" />
		</View>
	);
}

function JoinButton({ room, navigation, currentRoom, isCurrentHost }) {
	const [pending, setPending] = useState(false);

	const isCurrent = Boolean(currentRoom) && String(currentRoom.id) === String(room.id);
	const blockedByHost = Boolean(currentRoom) && isCurrentHost && !isCurrent;
	const full =
		!isCurrent &&
		room.maxCapacity !== null &&
		room.membersCount >= room.maxCapacity;
	const disabled = pending || full || blockedByHost;

	async function handleJoin() {
		if (disabled) return;

		if (isCurrent) {
			navigation.navigate("RoomDetail", { id: room.id });
			return;
		}

		setPending(true);

		try {
			const joined = await joinRoom(room.code);

			navigation.navigate("RoomDetail", { id: joined.id });
		} catch (cause) {
			showActionError(cause, "room:join");
		} finally {
			setPending(false);
		}
	}

	const label = isCurrent
		? "Ir"
		: blockedByHost
			? "Cerrá tu sala"
			: full
				? "Llena"
				: pending
					? "Uniéndote…"
					: currentRoom
						? "Cambiar"
						: "Unirme";

	return (
		<Pressable
			style={[styles.joinButton, disabled && styles.joinButtonDisabled]}
			onPress={handleJoin}
			disabled={disabled}
			accessibilityRole="button"
			accessibilityState={{ disabled }}
			accessibilityLabel={
				blockedByHost
					? "Cerrá tu sala para entrar a otra"
					: full
						? "Sala llena"
						: undefined
			}
		>
			<Text style={styles.joinButtonText}>{label}</Text>
		</Pressable>
	);
}

function EmptyState({ hasQuery }) {
	return (
		<View style={styles.emptyContainer}>
			<HeadphonesIcon size={40} color={colors.textMuted} />
			{hasQuery ? (
				<>
					<Text style={styles.emptyTitle}>No encontramos salas con ese criterio</Text>
					<Text style={styles.emptyText}>
						Probá con otro nombre de sala o de anfitriona.
					</Text>
				</>
			) : (
				<>
					<Text style={styles.emptyTitle}>Todavía no hay salas</Text>
					<Text style={styles.emptyText}>
						Cuando alguien abra una sala, aparece acá.
					</Text>
				</>
			)}
		</View>
	);
}