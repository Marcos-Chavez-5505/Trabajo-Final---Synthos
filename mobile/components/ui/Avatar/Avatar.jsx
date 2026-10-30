import { useState } from "react";
import { Image, Text, View } from "react-native";
import { blobatarUri } from "blobatar/uri";
import { SvgXml } from "react-native-svg";
import { AVATAR_STYLES } from "./Avatar.styles";

function getInitials(name = "") {
	if (!name) return "?";
	const parts = name.trim().split(/\s+/);
	if (parts.length === 1) return parts[0].slice(0, 2);
	return (parts[0][0] + parts[1][0]).slice(0, 2);
}

export function Avatar({ size = 32, style, children }) {
	const containerStyle = [
		AVATAR_STYLES.container,
		{ width: size, height: size, borderRadius: size / 2 },
		style,
	];

	return <View style={containerStyle}>{children}</View>;
}

export function AvatarImage({ uri, name, style }) {
	const [failed, setFailed] = useState(false);

	// foto subida
	if (uri && !failed) {
		return (
			<Image
				source={{ uri }}
				style={[AVATAR_STYLES.image, AVATAR_STYLES.absoluteFill, style]}
				onError={() => setFailed(true)}
				resizeMode="cover"
			/>
		);
	}

	// blobatar deterministico
	const normalized = String(name ?? "")
		.trim()
		.toLowerCase();
	if (normalized && !failed) {
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
			setFailed(true);
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
