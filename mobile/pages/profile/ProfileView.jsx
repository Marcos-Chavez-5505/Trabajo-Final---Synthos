import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useNavigation } from "@react-navigation/native";
import { useAuth, useFollow } from "@synthos/shared";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/Avatar/Avatar";
import { PROFILE_STYLES } from "./ProfileView.styles";

export default function ProfileScreen() {
	const navigation = useNavigation();
	const { user, loading, logout } = useAuth();
	const follow = useFollow(user?.id ?? null);

	if (loading) {
		return (
			<View style={PROFILE_STYLES.loadingContainer}>
				<ActivityIndicator color="#ef2f62" />
				<StatusBar style="light" />
			</View>
		);
	}

	if (!user) {
		return (
			<View style={PROFILE_STYLES.container}>
				<Text style={PROFILE_STYLES.bio}>
					Iniciá sesión para ver tu perfil.
				</Text>
				<StatusBar style="light" />
			</View>
		);
	}

	const handleLogout = async () => {
		await logout();
		navigation.replace("Landing");
	};

	return (
		<View style={PROFILE_STYLES.container}>
			<ScrollView showsVerticalScrollIndicator={false}>
				<View style={PROFILE_STYLES.card}>
					<View style={PROFILE_STYLES.header}>
						<Avatar size={96}>
							<AvatarImage uri={user?.avatarUrl} name={user?.username} />
							<AvatarFallback name={user?.username} />
						</Avatar>
						<View style={PROFILE_STYLES.headerText}>
							<Text style={PROFILE_STYLES.username} numberOfLines={1}>
								{user.username}
							</Text>
							<Text style={PROFILE_STYLES.email} numberOfLines={1}>
								{user.email}
							</Text>
						</View>
					</View>

					<Text style={PROFILE_STYLES.bio}>
						{user.bio || "Sin bio todavía."}
					</Text>

					<Text style={PROFILE_STYLES.bio}>
						Seguidores: {follow?.followerCount ?? 0} · Siguiendo:{" "}
						{follow?.followingCount ?? 0}
					</Text>

					<Pressable
						style={PROFILE_STYLES.editButton}
						onPress={() => navigation.navigate("ProfileEdit")}
					>
						<Text style={PROFILE_STYLES.editButtonText}>Editar perfil</Text>
					</Pressable>

					<Pressable
						style={[PROFILE_STYLES.editButton, { backgroundColor: "#373038", marginTop: 8 }]}
						onPress={handleLogout}
					>
						<Text style={PROFILE_STYLES.editButtonText}>Cerrar sesión</Text>
					</Pressable>
				</View>

				<Text style={PROFILE_STYLES.recommendationsTitle}>
					Recomendaciones
				</Text>
				<Text style={PROFILE_STYLES.emptyText}>
					Todavía no te recomendaron ninguna canción.
				</Text>
			</ScrollView>

			<StatusBar style="light" />
		</View>
	);
}