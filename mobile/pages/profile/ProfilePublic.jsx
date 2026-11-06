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
import FollowButton from "../../components/social/FollowButton/FollowButton";
import FollowStats from "../../components/social/FollowStats/FollowStats";
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

					<FollowStats
						followerCount={follow.followerCount}
						followingCount={follow.followingCount}
						onSelect={(relation) =>
							navigation.navigate("FollowList", {
								userId: person.id,
								relation,
							})
						}
					/>

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
					) : (
						<FollowButton
							canFollow={follow.canFollow}
							isFollowing={follow.isFollowing}
							onToggle={follow.toggle}
							pending={follow.pending}
							loading={follow.loading}
							style={styles.followButton}
						/>
					)}

					{follow.error ? (
						<Text style={styles.error}>{follow.error}</Text>
					) : null}
				</View>
			</ScrollView>

			<StatusBar style="light" />
		</View>
	);
}
