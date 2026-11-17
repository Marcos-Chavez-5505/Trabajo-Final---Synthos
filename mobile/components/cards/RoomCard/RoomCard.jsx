import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { getRoomCardModel } from "@synthos/shared";
import {
	Avatar,
	AvatarFallback,
	AvatarImage,
} from "../../ui/Avatar/Avatar";
import {
	CrownIcon,
	HeartIcon,
	HeartOutlineIcon,
	UserGroupIcon,
} from "../../icons";
import { colors, roomCard } from "../../../theme";
import {
	ROOM_CARD_STYLES as styles,
	ROOM_CARD_HEARTS as HEARTS,
} from "./RoomCard.styles";

/**
 * Tarjeta de una sala en la grilla de `/salas` (rediseño equivalente a la
 * versión web según Objetivo.png).
 *
 * Estructura:
 *   [LIVE] [géneros]                         [action]
 *   Nombre de la sala
 *   Descripción (2 líneas)
 *   [bandeja de asistentes]            anfitriona + corazones
 *
 * Es presentacional: la pantalla decide qué botón ofrecer (`action`) y qué
 * hacer al tocar a la anfitriona (`onHostPress`). Los datos calculados salen de
 * `getRoomCardModel`, compartido con web.
 */
export default function RoomCard({ room: rawRoom, action, onHostPress }) {
	const model = getRoomCardModel(rawRoom);
	const room = model.room;

	return (
		<View style={styles.container}>
			<View style={styles.topRow}>
				<View style={styles.chips}>
					<LiveChip isLive={model.isLive} />

					{model.genres.length > 0 && <GenresChip genres={model.genres} />}

					{room.isPrivate && (
						<View style={styles.chip}>
							<Text style={styles.privateText}>Privada</Text>
						</View>
					)}
				</View>

				{action ? <View style={styles.action}>{action}</View> : null}
			</View>

			<View style={styles.titleBlock}>
				<Text style={styles.title} numberOfLines={1}>
					{room.name}
				</Text>

				{/* Se renderiza siempre: el alto mínimo reserva las dos líneas. */}
				<Text style={styles.description} numberOfLines={2}>
					{room.description}
				</Text>
			</View>

			<View style={styles.footer}>
				<MembersTray
					guests={model.guests}
					emptySlots={model.emptySlots}
					label={model.membersLabel}
				/>

				{room.hostUsername ? (
					<HostBlock
						room={room}
						hostId={model.hostId}
						onHostPress={onHostPress}
						heartsFilled={model.heartsFilled}
						ratingLabel={model.ratingLabel}
					/>
				) : null}
			</View>
		</View>
	);
}

function LiveChip({ isLive }) {
	return (
		<View style={styles.chip}>
			<View
				accessibilityElementsHidden
				importantForAccessibility="no-hide-descendants"
				style={[styles.liveDot, isLive && styles.liveDotOn]}
			/>
			<Text style={styles.chipText}>{isLive ? "LIVE" : "OFF"}</Text>
		</View>
	);
}

function GenresChip({ genres }) {
	return (
		<View style={[styles.chip, styles.genresChip]}>
			<UserGroupIcon size={roomCard.chipIcon} color={colors.fucsia} />
			<Text
				style={styles.genresText}
				numberOfLines={1}
				ellipsizeMode="tail"
			>
				{genres.join(" · ")}
			</Text>
		</View>
	);
}

function MembersTray({ guests, emptySlots, label }) {
	const slots = guests.length + emptySlots;

	if (slots === 0) return null;

	return (
		<View style={styles.tray} accessible accessibilityLabel={label}>
			{guests.map((member, index) => (
				<View
					key={member.id ?? member.username}
					style={[index > 0 && styles.overlap, { zIndex: slots - index }]}
				>
					<Avatar size={roomCard.guest} style={styles.guestAvatar}>
						<AvatarImage uri={member.avatarUrl} name={member.username} />
						<AvatarFallback name={member.username} />
					</Avatar>
				</View>
			))}

			{Array.from({ length: emptySlots }, (_, index) => (
				<View
					key={`empty-${index}`}
					accessibilityElementsHidden
					importantForAccessibility="no-hide-descendants"
					style={[
						styles.emptySlot,
						index === 0 && guests.length > 0
							? styles.emptyFirstGap
							: index > 0 && styles.overlap,
						{ zIndex: emptySlots - index },
					]}
				/>
			))}
		</View>
	);
}

function HostBlock({ room, hostId, onHostPress, heartsFilled, ratingLabel }) {
	const canOpenProfile = Boolean(hostId && onHostPress);

	const avatar = (
		<>
			<Avatar size={roomCard.host}>
				<AvatarImage uri={room.hostAvatarUrl} name={room.hostUsername} />
				<AvatarFallback name={room.hostUsername} />
			</Avatar>

			<View
				accessibilityElementsHidden
				importantForAccessibility="no-hide-descendants"
				style={styles.badge}
			>
				<CrownIcon size={roomCard.crown} color={colors.lighter} />
			</View>
		</>
	);

	return (
		<View style={styles.host}>
			{canOpenProfile ? (
				<Pressable
					onPress={onHostPress}
					accessibilityRole="button"
					accessibilityLabel={`Ver perfil de ${room.hostUsername}`}
					style={styles.hostAvatar}
				>
					{avatar}
				</Pressable>
			) : (
				<View style={styles.hostAvatar}>{avatar}</View>
			)}

			<View style={styles.hostText}>
				{canOpenProfile ? (
					<Pressable
						onPress={onHostPress}
						accessibilityRole="button"
						accessibilityLabel={`Ver perfil de ${room.hostUsername}`}
					>
						<Text style={styles.hostName} numberOfLines={1}>
							{room.hostUsername}
						</Text>
					</Pressable>
				) : (
					<Text style={styles.hostName} numberOfLines={1}>
						{room.hostUsername}
					</Text>
				)}

				<Hearts filled={heartsFilled} label={ratingLabel} />
			</View>
		</View>
	);
}

function Hearts({ filled, label }) {
	const [measuredWidth, setMeasuredWidth] = useState(
		roomCard.heart * HEARTS + roomCard.heartGap * (HEARTS - 1),
	);

	// Reproduce las container queries de web midiendo el ancho real de la fila.
	const gaps = roomCard.heartGap * (HEARTS - 1);
	const size = Math.min(
		roomCard.heart,
		Math.max(roomCard.heartMin, (measuredWidth - gaps) / HEARTS),
	);
	const overlap =
		Math.max(0, HEARTS * size + gaps - measuredWidth) / (HEARTS - 1);

	function handleLayout(event) {
		const width = event.nativeEvent.layout.width;

		if (Math.abs(width - measuredWidth) > 0.5) setMeasuredWidth(width);
	}

	return (
		<View
			accessible
			accessibilityRole="image"
			accessibilityLabel={label}
			style={styles.hearts}
			onLayout={handleLayout}
		>
			{Array.from({ length: HEARTS }, (_, index) => {
				const Icon = index < filled ? HeartIcon : HeartOutlineIcon;

				return (
					<View
						key={index}
						style={{
							width: size,
							height: size,
							marginLeft: index === 0 ? 0 : roomCard.heartGap - overlap,
						}}
					>
						<Icon size={size} color={colors.salmon} />
					</View>
				);
			})}
		</View>
	);
}
