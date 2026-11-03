import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { colors, fontSize, fontWeight, spacing, radius } from "../../theme";

export default function ArtistsScreen() {
	const navigation = useNavigation();

	return (
		<SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
			<View
				style={{
					flex: 1,
					justifyContent: "center",
					alignItems: "center",
					paddingHorizontal: spacing.lg,
					gap: spacing.md,
				}}
			>
				<Text
					style={{
						color: colors.textPrimary,
						fontSize: fontSize.xl,
						fontWeight: fontWeight.bold,
						textAlign: "center",
					}}
				>
					Página en construcción
				</Text>
				<Pressable
					onPress={() => navigation.goBack()}
					style={{
						backgroundColor: colors.primary,
						paddingVertical: spacing.sm,
						paddingHorizontal: spacing.lg,
						borderRadius: radius.full,
					}}
				>
					<Text style={{ color: colors.textPrimary, fontWeight: fontWeight.medium }}>
						Volver atrás
					</Text>
				</Pressable>
			</View>
		</SafeAreaView>
	);
}
