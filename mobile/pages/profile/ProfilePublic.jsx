import {
	ActivityIndicator,
	Pressable,
	ScrollView,
	Text,
	View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useNavigation } from "@react-navigation/native";
import { useAuth, useFollow, useProfilePublic } from "@synthos/shared";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "../../components/ui/Avatar/Avatar";
import { PROFILE_STYLES } from "./ProfileView.styles";
import { PROFILE_PUBLIC_STYLES as styles } from "./ProfilePublic.styles";
import { colors } from "../../theme";

/**
 * Perfil público de otra persona.
 *
 * Es la pantalla a la que deben apuntar los avatares y nombres de usuario.
 * `Profile` sigue siendo el perfil propio (con edición y cierre de sesión).
 */
export default function ProfilePublicScreen({ route }) {
	const navigation = useNavigation();
	const { user } = useAuth();
	const userId = route.params?.userId;
	const { isCurrent, person, hasError } = useProfilePublic(userId);
	const follow = useFollow(person?.id ?? null);

	const isSelf =
		Boolean(person) && String(person.id) === String(user?.id ?? "");

	if (!userId) {
		return (
			<View style={PROFILE_STYLES.container}>
				<Text style={styles.message}>No encontramos esa persona.</Text>
				<Pressable
					onPress={() => navigation.goBack()}
					style={styles.backButton}
				>
					<Text style={styles.backButtonText}>← Volver</Text>
				</Pressable>
				<StatusBar style="light" />
			</View>
		);
	}

	if (!isCurrent) {
		return (
			<View style={PROFILE_STYLES.loadingContainer}>
				<ActivityIndicator color={colors.fucsia} />
				<StatusBar style="light" />
			</View>
		);
	}

	if (hasError || !person) {
		return (
			<View style={PROFILE_STYLES.container}>
				<Text style={styles.message}>
					No pudimos cargar el perfil de esta persona.
				</Text>
				<Pressable
					onPress={() => navigation.goBack()}
					style={styles.backButton}
				>
					<Text style={styles.backButtonText}>← Volver</Text>
				</Pressable>
				<StatusBar style="light" />
			</View>
		);
	}

	const hostRatingsCount = Number(person.hostRatingsCount ?? 0);

	return (
		<View style={PROFILE_STYLES.container}>
			<ScrollView
				showsVerticalScrollIndicator={false}
				contentContainerStyle={styles.scroll}
			>
				<Pressable
					onPress={() => navigation.goBack()}
					style={styles.backButton}
				>
					<Text style={styles.backButtonText}>← Volver</Text>
				</Pressable>

				<View style={PROFILE_STYLES.card}>
					<View style={PROFILE_STYLES.header}>
						<Avatar size={96}>
							<AvatarImage uri={person.avatarUrl} name={person.username} />
							<AvatarFallback name={person.username} />
						</Avatar>
						<View style={PROFILE_STYLES.headerText}>
							<Text style={PROFILE_STYLES.username} numberOfLines={1}>
								{person.username}
							</Text>
							{isSelf ? (
								<Text style={styles.selfLabel}>Este es tu perfil</Text>
							) : null}
						</View>
					</View>

					<Text style={PROFILE_STYLES.bio}>
						{person.bio || "Sin bio todavía."}
					</Text>

					<View style={styles.statsRow}>
						<View>
							<Text style={styles.statValue}>{follow.followerCount}</Text>
							<Text style={styles.statLabel}>
								{follow.followerCount === 1 ? "Seguidor" : "Seguidores"}
							</Text>
						</View>
						<View>
							<Text style={styles.statValue}>{follow.followingCount}</Text>
							<Text style={styles.statLabel}>
								{follow.followingCount === 1 ? "Seguido" : "Seguidos"}
							</Text>
						</View>
					</View>

					{person.hostRating != null ? (
						<Text style={styles.rating}>
							Anfitrión: {Number(person.hostRating).toFixed(2)} / 5
							{hostRatingsCount > 0
								? ` · ${hostRatingsCount} ${
										hostRatingsCount === 1 ? "calificación" : "calificaciones"
									}`
								: ""}
						</Text>
					) : null}

					{isSelf ? (
						<Pressable
							style={PROFILE_STYLES.editButton}
							onPress={() => navigation.navigate("ProfileEdit")}
						>
							<Text style={PROFILE_STYLES.editButtonText}>Editar perfil</Text>
						</Pressable>
					) : follow.canFollow ? (
						<Pressable
							onPress={follow.toggle}
							disabled={follow.pending}
							style={({ pressed }) => [
								styles.followButton,
								follow.isFollowing && styles.followingButton,
								pressed && styles.pressed,
								follow.pending && styles.disabled,
							]}
							accessibilityRole="button"
							accessibilityState={{
								selected: follow.isFollowing,
								disabled: follow.pending,
							}}
						>
							<Text style={styles.followButtonText}>
								{follow.isFollowing ? "Siguiendo" : "Seguir"}
							</Text>
						</Pressable>
					) : null}

					{follow.error ? (
						<Text style={styles.error}>{follow.error}</Text>
					) : null}
				</View>
			</ScrollView>

			<StatusBar style="light" />
		</View>
	);
}
