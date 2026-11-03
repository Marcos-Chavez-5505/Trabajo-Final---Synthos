import { useState } from "react";
import { FlatList, Pressable, Text, TextInput, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useNavigation } from "@react-navigation/native";
import { useRoomsList, useDebounce, joinRoom, mapApiError } from "@synthos/shared";
import RoomCard from "../../components/cards/RoomCard/RoomCard";
import { HeadphonesIcon } from "../../components/icons";
import { ROOMS_STYLES as styles } from "./Rooms.styles";
import { colors } from "../../theme";

const DEBOUNCE_MS = 300;

export default function RoomsScreen() {
	const navigation = useNavigation();
	const [input, setInput] = useState("");
	const debounced = useDebounce(input, DEBOUNCE_MS);

	const { isCurrent, rooms, error } = useRoomsList(debounced, "name", "asc");

	function renderItem({ item }) {
		return (
			<View style={styles.cardWrapper}>
				<RoomCard room={item} action={<JoinButton room={item} navigation={navigation} />} />
			</View>
		);
	}

	return (
		<View style={styles.container}>
			<FlatList
				data={rooms}
				keyExtractor={(item) => String(item.id)}
				renderItem={renderItem}
				contentContainerStyle={styles.listContainer}
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
								onChangeText={setInput}
								placeholder="Buscar sala o anfitriona"
								placeholderTextColor={colors.textMuted}
								autoCapitalize="none"
							/>
						</View>

						{error ? <Text style={styles.errorText}>{error}</Text> : null}
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

function JoinButton({ room, navigation }) {
	const [pending, setPending] = useState(false);
	const [error, setError] = useState("");

	const full = room.maxCapacity !== null && room.membersCount >= room.maxCapacity;

	if (full) {
		return (
			<Text style={styles.joinError}>
				Sala llena ({room.membersCount}/{room.maxCapacity})
			</Text>
		);
	}

	async function handleJoin() {
		if (pending) return;
		setPending(true);
		setError("");
		try {
			const joined = await joinRoom(room.code);
			navigation.navigate("RoomDetail", { id: joined.id });
		} catch (cause) {
			setError(mapApiError(cause));
		} finally {
			setPending(false);
		}
	}

	return (
		<>
			<Pressable
				style={[styles.joinButton, pending && styles.joinButtonDisabled]}
				onPress={handleJoin}
				disabled={pending}
			>
				<Text style={styles.joinButtonText}>
					{pending ? "Uniéndote…" : "Unirme"}
				</Text>
			</Pressable>
			{error ? <Text style={styles.joinError}>{error}</Text> : null}
		</>
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