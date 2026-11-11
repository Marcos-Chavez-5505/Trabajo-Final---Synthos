import { useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	Pressable,
	Text,
	View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePlaylistList, usePlaylistsPage } from "@synthos/shared";
import PlaylistCard from "../../components/cards/PlaylistCard/PlaylistCard";
import TopBar from "../../components/layout/TopBar/TopBar";
import { PlaylistIcon } from "../../components/icons";
import { colors, spacing } from "../../theme";
import { showSuccess } from "../../lib/toastMessages";
import CreatePlaylistForm from "./CreatePlaylistForm";
import PlaylistInvitations from "./PlaylistInvitations";
import { PLAYLISTS_STYLES as styles } from "./Playlists.styles";

const TABS = [
	{ key: "mis", label: "Mis playlists" },
	{ key: "colaborativas", label: "Colaborativas" },
	{ key: "invitaciones", label: "Invitaciones" },
];

export default function PlaylistsScreen() {
	const navigation = useNavigation();
	const insets = useSafeAreaInsets();
	const { playlists, error, loading } = usePlaylistList();
	const { creating, setCreating, handleCreate } = usePlaylistsPage();
	const [tab, setTab] = useState("mis");

	const mine = playlists.filter((playlist) => playlist.role === "creator");
	const collaborative = playlists.filter(
		(playlist) => playlist.isCollaborative && playlist.role !== "creator",
	);
	const shown = tab === "colaborativas" ? collaborative : mine;

	async function onSubmitCreate(values) {
		const created = await handleCreate(values);
		showSuccess("playlist:create");
		navigation.navigate("PlaylistDetail", { id: created.id });
	}

	return (
		<View style={[styles.container, { paddingTop: insets.top + spacing.md }]}>
			<TopBar style={styles.topBar} />

			<View style={styles.header}>
				<View style={styles.titleRow}>
					<Text style={styles.title}>Playlists</Text>

					{tab === "mis" ? (
						<Pressable
							onPress={() => setCreating((prev) => !prev)}
							style={({ pressed }) => [
								styles.createButton,
								pressed && styles.pressed,
							]}
							accessibilityRole="button"
						>
							<Text style={styles.createButtonText}>
								{creating ? "Cancelar" : "Crear playlist"}
							</Text>
						</Pressable>
					) : null}
				</View>

				<View style={styles.tabs}>
					{TABS.map((item) => (
						<Pressable
							key={item.key}
							onPress={() => setTab(item.key)}
							style={[styles.tab, tab === item.key && styles.tabActive]}
							accessibilityRole="button"
							accessibilityState={{ selected: tab === item.key }}
						>
							<Text style={styles.tabText}>{item.label}</Text>
						</Pressable>
					))}
				</View>

				{creating && tab === "mis" ? (
					<View style={styles.formWrapper}>
						<CreatePlaylistForm
							onCreate={onSubmitCreate}
							onCancel={() => setCreating(false)}
						/>
					</View>
				) : null}

				{error ? <Text style={styles.error}>{error}</Text> : null}
			</View>

			{tab === "invitaciones" ? (
				<PlaylistInvitations />
			) : loading ? (
				<View style={styles.state}>
					<ActivityIndicator color={colors.textMuted} />
					<Text style={styles.message}>Cargando tus playlists…</Text>
				</View>
			) : shown.length === 0 ? (
				<EmptyState tab={tab} />
			) : (
				<FlatList
					key={tab}
					data={shown}
					style={styles.listFlex}
					keyExtractor={(item) => String(item.id)}
					numColumns={2}
					columnWrapperStyle={styles.gridRow}
					contentContainerStyle={styles.list}
					showsVerticalScrollIndicator={false}
					renderItem={({ item }) => (
						<View style={styles.cardCell}>
							<PlaylistCard
								playlist={item}
								onPress={() =>
									navigation.navigate("PlaylistDetail", { id: item.id })
								}
							/>
						</View>
					)}
				/>
			)}

			<StatusBar style="light" />
		</View>
	);
}

function EmptyState({ tab }) {
	const copy =
		tab === "colaborativas"
			? {
					title: "No te compartieron ninguna playlist",
					body: "Cuando alguien te invite a una colaborativa, aparece acá.",
				}
			: {
					title: "Todavía no tenés playlists",
					body: "Creá la primera y empezá a guardar canciones.",
				};

	return (
		<View style={styles.state}>
			<PlaylistIcon size={40} color={colors.textMuted} />
			<Text style={styles.emptyTitle}>{copy.title}</Text>
			<Text style={styles.message}>{copy.body}</Text>
		</View>
	);
}
