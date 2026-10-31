import { ScrollView, Text, View, Pressable } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useNavigation } from "@react-navigation/native";
import { LANDING_STYLES } from "./Landing.styles";

const HOW_IT_WORKS = [
	{
		step: "1",
		title: "Armá tu playlist",
		text: "Subí o elegí las canciones que querés compartir.",
	},
	{
		step: "2",
		title: "Abrí una sala",
		text: "Invitá a quien quieras, pública o con contraseña.",
	},
	{
		step: "3",
		title: "Escuchen juntos",
		text: "Todos ven la misma canción, en el mismo momento.",
	},
];

const FEATURES = [
	{
		title: "Seguí a tu gente",
		text: "Encontrá personas con tu mismo gusto musical y seguí su actividad.",
	},
	{
		title: "Dejá recomendaciones",
		text: "Compartile una canción a quien sigas, con unas palabras.",
	},
	{
		title: "Votá qué suena",
		text: "En cada sala, la mayoría puede saltar la canción actual.",
	},
];

export default function LandingScreen() {
	const navigation = useNavigation();

	return (
		<View style={LANDING_STYLES.main}>
			<ScrollView contentContainerStyle={LANDING_STYLES.scroll}>
				{/* Header */}
				<View style={LANDING_STYLES.header}>
					<Text style={LANDING_STYLES.logo}>Synthos</Text>
					<Pressable onPress={() => navigation.navigate("Login")}>
						<Text style={LANDING_STYLES.buttonText}>Ya tengo cuenta</Text>
					</Pressable>
				</View>

				{/* Hero */}
				<View style={LANDING_STYLES.hero}>
					<Text style={LANDING_STYLES.heroTitle}>
						Escuchá música con tu gente, en tiempo real.
					</Text>
					<Text style={LANDING_STYLES.heroText}>
						Armá salas de escucha compartida, seguí a quienes tienen tu mismo
						gusto musical y dejales una recomendación.
					</Text>

					<View style={LANDING_STYLES.heroButtons}>
						<Pressable
							style={LANDING_STYLES.buttonPrimary}
							onPress={() => navigation.navigate("Register")}
						>
							<Text style={LANDING_STYLES.buttonText}>Crear cuenta gratis</Text>
						</Pressable>
						<Pressable
							style={LANDING_STYLES.buttonSecondary}
							onPress={() => navigation.navigate("Login")}
						>
							<Text style={LANDING_STYLES.buttonText}>Iniciar sesión</Text>
						</Pressable>
					</View>
				</View>

				{/* Cómo funciona */}
				<View style={LANDING_STYLES.section}>
					<Text style={LANDING_STYLES.sectionTitle}>Cómo funciona</Text>
					{HOW_IT_WORKS.map((item) => (
						<View key={item.step} style={LANDING_STYLES.stepItem}>
							<Text style={LANDING_STYLES.stepNumber}>{item.step}</Text>
							<Text style={LANDING_STYLES.stepTitle}>{item.title}</Text>
							<Text style={LANDING_STYLES.stepText}>{item.text}</Text>
						</View>
					))}
				</View>

				{/* Features */}
				<View style={LANDING_STYLES.section}>
					<Text style={LANDING_STYLES.sectionTitle}>Más que un reproductor</Text>
					{FEATURES.map((feature) => (
						<View key={feature.title} style={LANDING_STYLES.featureCard}>
							<Text style={LANDING_STYLES.featureTitle}>{feature.title}</Text>
							<Text style={LANDING_STYLES.featureText}>{feature.text}</Text>
						</View>
					))}
				</View>

				{/* Footer */}
				<View style={LANDING_STYLES.footer}>
					<Text style={LANDING_STYLES.footerText}>
						© {new Date().getFullYear()} Synthos
					</Text>
				</View>
			</ScrollView>

			<StatusBar style="light" />
		</View>
	);
}