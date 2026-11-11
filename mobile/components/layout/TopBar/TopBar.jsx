import { Pressable, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "@synthos/shared";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/Avatar/Avatar";
import { BellIcon, CameraAIIcon } from "../../icons";
import { colors } from "../../../theme";
import HomePills from "./HomePills";
import { TOP_BAR_STYLES as styles } from "./TopBar.styles";

/**
 * Barra superior del shell: perfil, accesos a catálogos y acciones rápidas.
 *
 * Se monta por página (no en el layout de tabs) para que respete el scroll y
 * los headers propios de cada pantalla. Las páginas que ya aplican padding
 * horizontal no necesitan pasar `style`; el resto puede sumarlo.
 */
export default function TopBar({ style }) {
	const navigation = useNavigation();
	const { user } = useAuth();

	return (
		<View style={[styles.container, style]}>
			<View style={styles.identity}>
				<Avatar
					size={40}
					onPress={() => navigation.navigate("Profile")}
					accessibilityLabel="Ir a mi perfil"
				>
					<AvatarImage uri={user?.avatarUrl} name={user?.username} />
					<AvatarFallback name={user?.username} />
				</Avatar>
				<HomePills />
			</View>

			<View style={styles.actions}>
				<Pressable
					onPress={() => navigation.navigate("Notifications")}
					style={styles.actionButton}
				>
					<BellIcon size={22} color={colors.textPrimary} />
				</Pressable>
				<Pressable
					onPress={() => navigation.navigate("Mood")}
					style={styles.actionButton}
				>
					<CameraAIIcon size={22} color={colors.textPrimary} />
				</Pressable>
			</View>
		</View>
	);
}
