import { Pressable, Text, View } from "react-native";
import { ROOM_CARD_STYLES as styles } from "./RoomCard.styles";
import { colors } from "../../../theme";
import { HeadphonesIcon } from "../../icons";

/**
 * Tarjeta de una sala en la grilla de `/salas`.
 *
 * Muestra el nombre, quién la anfitriona, su calificación promedio, cuántas
 * personas están y cuántas caben. El botón va en el slot `action`, fuera del
 * contenido clickeable, para que la tarjeta sea presentacional y la pantalla
 * decida qué acción ofrecer.
 *
 * `isPrivate` casi nunca se ve acá: el listado público no trae salas privadas,
 * pero la tarjeta también se usa en "Mis Salas", donde sí puede aparecer una
 * privada.
 */
export default function RoomCard({ room, action, onHostPress }) {
	const full = room.membersCount >= room.maxCapacity && room.maxCapacity !== null;

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<View style={styles.iconWrapper}>
					<HeadphonesIcon size={24} color={colors.textPrimary} />
				</View>

				<View style={styles.headerText}>
					<Text style={styles.name} numberOfLines={1}>
						{room.name}
					</Text>

					{room.hostUsername ? (
						<Pressable
							onPress={onHostPress}
							disabled={!onHostPress}
							accessibilityRole={onHostPress ? "button" : undefined}
							accessibilityLabel={
								onHostPress
									? `Ver perfil de ${room.hostUsername}`
									: undefined
							}
						>
							<Text style={styles.host} numberOfLines={1}>
								Anfitriona: {room.hostUsername}
							</Text>
						</Pressable>
					) : null}
				</View>
			</View>

			{room.description ? (
				<Text style={styles.description} numberOfLines={2}>
					{room.description}
				</Text>
			) : null}

			<View style={styles.ratingRow}>
				{room.hostRating === null ? (
					<Text style={[styles.ratingText, styles.ratingMuted]}>
						Sin calificaciones
					</Text>
				) : (
					<Text style={styles.ratingText}>
						{room.hostRating.toFixed(2)}
						<Text style={styles.ratingMuted}> / 5</Text>
					</Text>
				)}
			</View>

			<View style={styles.metaRow}>
				<Text style={styles.metaText}>
					{room.membersCount}
					{room.maxCapacity !== null ? `/${room.maxCapacity}` : ""}
					{room.membersCount === 1 ? " persona" : " personas"}
				</Text>
				<Text style={styles.metaText}>
					{room.songsCount} {room.songsCount === 1 ? "canción" : "canciones"}
				</Text>
				{room.isPrivate ? <Text style={styles.metaText}>Privada</Text> : null}
				{full ? <Text style={styles.metaText}>Llena</Text> : null}
			</View>

			{action ? <View style={styles.actionRow}>{action}</View> : null}
		</View>
	);
}