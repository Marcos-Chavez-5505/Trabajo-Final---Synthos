import { useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { blobatarUri } from "blobatar/uri";
import { SvgXml } from "react-native-svg";
import { AVATAR_STYLES } from "./Avatar.styles";

//* Si no hay foto subida y no puede utilizar un blobatar, utiliza las iniciales de su nombre
function getInitials(name = "") {
	if (!name) return "?";
	const parts = name.trim().split(/\s+/);
	if (parts.length === 1) return parts[0].slice(0, 2);
	return (parts[0][0] + parts[1][0]).slice(0, 2);
}

export function Avatar({
	size = 32,
	style,
	children,
	onPress,
	accessibilityLabel,
}) {
	const containerStyle = [
		AVATAR_STYLES.container,
		{ width: size, height: size, borderRadius: size / 2 },
		style,
	];

	if (!onPress) {
		return <View style={containerStyle}>{children}</View>;
	}

	return (
		<Pressable
			onPress={onPress}
			accessibilityRole="button"
			accessibilityLabel={accessibilityLabel}
			style={({ pressed }) => [
				containerStyle,
				pressed && AVATAR_STYLES.pressed,
			]}
		>
			{children}
		</Pressable>
	);
}

export function AvatarImage({ uri, name, style }) {
	const [imageFailed, setImageFailed] = useState(false);
	const [blobatarFailed, setBlobatarFailed] = useState(false);

	if (uri && !imageFailed) {
		return (
			<Image
				source={{ uri }}
				style={[AVATAR_STYLES.image, AVATAR_STYLES.absoluteFill, style]}
				onError={(e) => {
					console.log("AvatarImage error:", uri, e.nativeEvent?.error);
					setImageFailed(true);
				}}
				resizeMode="cover"
			/>
		);
	}

	const normalized = String(name ?? "")
		.trim()
		.toLowerCase();
	if (normalized && !blobatarFailed) {
		try {
			const dataUri = blobatarUri(normalized);
			const commaIndex = dataUri.indexOf(",");
			const svgPart = commaIndex >= 0 ? dataUri.slice(commaIndex + 1) : dataUri;
			const decoded = decodeURIComponent(svgPart);

			return (
				<View style={AVATAR_STYLES.absoluteFill}>
					<SvgXml xml={decoded} width="100%" height="100%" />
				</View>
			);
		} catch (e) {
			console.log("Blobatar error:", e);
			setBlobatarFailed(true);
			return null;
		}
	}

	return null;
}

export function AvatarFallback({ name, text, style }) {
	const initials = text || getInitials(name);

	return (
		<View style={[AVATAR_STYLES.fallback, style]}>
			<Text style={AVATAR_STYLES.fallbackText}>{initials}</Text>
		</View>
	);
}
