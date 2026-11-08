import { useNavigation } from "@react-navigation/native";
import { Pressable, Text, View } from "react-native";
import { ARTIST_CARD_STYLES as styles } from "./ArtistCard.styles";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/Avatar/Avatar";

export default function ArtistCard({ artist }) {
	const navigation = useNavigation();

	const albumsLabel = `${artist.albumsCount} ${
		artist.albumsCount === 1 ? "álbum" : "álbumes"
	}`;

	return (
		<View style={styles.card}>
			<Pressable
				onPress={() => navigation.navigate("ArtistDetail", { id: artist.id })}
				style={({ pressed }) => [styles.link, pressed && styles.pressed]}
			>
				<Avatar size={120} style={styles.avatar}>
					<AvatarImage uri={artist.pictureUrl} name={artist.name} />
					<AvatarFallback name={artist.name} />
				</Avatar>

				<Text style={styles.name} numberOfLines={1}>
					{artist.name}
				</Text>
				<Text style={styles.albums} numberOfLines={1}>
					{albumsLabel}
				</Text>
			</Pressable>
		</View>
	);
}
