import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useNavigation } from "@react-navigation/native";
import { useAuth, useFollowList } from "@synthos/shared";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "../../components/ui/Avatar/Avatar";
import UserRow from "../../components/cards/UserRow/UserRow";
import { FOLLOW_LIST_STYLES as styles } from "./FollowList.styles";
import { colors } from "../../theme";

const RELATIONS = ["seguidores", "siguiendo"];

/**
 * Lista de seguidores o seguidos de una persona.
 *
 * Para el perfil propio se puede omitir `userId`; la pantalla resuelve la
 * sesión. Para el perfil público, `ProfilePublic` pasa el id de la persona.
 */
export default function FollowListScreen({ route }) {
	const navigation = useNavigation();
	const { user } = useAuth();

	const requestedRelation = route.params?.relation;
	const relation = RELATIONS.includes(requestedRelation)
		? requestedRelation
		: "seguidores";
	const routeUserId = route.params?.userId;
	const personId = routeUserId ?? user?.id ?? null;
	const isOwn =
		Boolean(user?.id) && String(personId) === String(user?.id);

	const { isCurrent, people, person, error } = useFollowList(
		personId,
		relation,
	);

	const title = relation === "seguidores" ? "Seguidores" : "Seguidos";

	const goToProfile = () => {
		if (!personId) return;

		if (isOwn) {
			navigation.navigate("Profile");
			return;
		}

		navigation.navigate("ProfilePublic", { userId: personId });
	};

	const goBack = () => {
		if (navigation.canGoBack()) {
			navigation.goBack();
			return;
		}

		goToProfile();
	};

	const openPerson = (id) => {
		if (String(id) === String(user?.id)) {
			navigation.navigate("Profile");
			return;
		}

		navigation.navigate("ProfilePublic", { userId: id });
	};

	if (!personId) {
		return (
			<View style={styles.container}>
				<Text style={styles.error}>
					Iniciá sesión para ver tu lista.
				</Text>
				<Pressable onPress={goBack} style={styles.backButton}>
					<Text style={styles.backButtonText}>← Volver</Text>
				</Pressable>
				<StatusBar style="light" />
			</View>
		);
	}

	const empty = (() => {
		if (relation === "seguidores") {
			return isOwn
				? "Tu lista de seguidores está vacía."
				: "Esta persona todavía no tiene seguidores.";
		}

		return isOwn
			? "No seguís a nadie todavía."
			: "Esta persona no sigue a nadie.";
	})();

	return (
		<View style={styles.container}>
			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={styles.scroll}
			>
				<Pressable onPress={goBack} style={styles.backButton}>
					<Text style={styles.backButtonText}>← Volver</Text>
				</Pressable>

				<View style={styles.header}>
					{person ? (
						<Avatar
							size={56}
							onPress={goToProfile}
							accessibilityLabel={`Ver perfil de ${person.username}`}
						>
							<AvatarImage uri={person.avatarUrl} name={person.username} />
							<AvatarFallback name={person.username} />
						</Avatar>
					) : null}

					<View style={styles.headerText}>
						<Text style={styles.title}>{title}</Text>
						<Text style={styles.personName} numberOfLines={1}>
							{person?.username ?? "Persona"}
						</Text>
					</View>
				</View>

				{!isCurrent ? (
					<View style={styles.state}>
						<ActivityIndicator color={colors.fucsia} />
					</View>
				) : error ? (
					<Text style={styles.error}>{error}</Text>
				) : people.length === 0 ? (
					<View style={styles.state}>
						<Text style={styles.emptyTitle}>
							{isOwn ? "Todavía no hay nadie" : "Sin nadie por ahora"}
						</Text>
						<Text style={styles.emptyText}>{empty}</Text>
					</View>
				) : (
					<View style={styles.list}>
						{people.map((entry) => (
							<UserRow
								key={entry.id}
								person={entry}
								onPress={() => openPerson(entry.id)}
							/>
						))}
					</View>
				)}

				<Pressable
					onPress={goToProfile}
					style={styles.backToProfileButton}
				>
					<Text style={styles.backToProfileText}>Volver al perfil</Text>
				</Pressable>
			</ScrollView>

			<StatusBar style="light" />
		</View>
	);
}
