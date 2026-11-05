import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import MaskedView from "@react-native-masked-view/masked-view";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";
import { colors } from "../../../theme";
import { CameraIcon, PlaylistIcon, TrashIcon } from "../../icons";
import { PLAYLIST_COVER_STYLES as styles } from "./PlaylistCover.styles";

const GLOW_BLEED = 60;

const GLOW_LAYERS = [
  {
    id: "glowOuter",
    blur: 80,
    stops: [
      { offset: 0, opacity: 0.9 },
      { offset: 0.5, opacity: 0.65 },
      { offset: 0.75, opacity: 0.25 },
      { offset: 1, opacity: 0 },
    ],
  },
	{
		id: "glowInner",
		blur: 25,
		stops: [
			{ offset: 0, opacity: 0.6 },
			{ offset: 0.6, opacity: 0.4 },
			{ offset: 0.85, opacity: 0.1 },
			{ offset: 1, opacity: 0 },
		],
	},
];

function GlowMask({ id, stops }) {
  return (
    <View style={StyleSheet.absoluteFill}>
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" rx="50%" ry="50%">
            {stops.map((s) => (
              <Stop
                key={s.offset}
                offset={s.offset}
                stopColor="#000"
                stopOpacity={s.opacity}
              />
            ))}
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </View>
  );
}

export default function PlaylistCover({
  uri,
  size = 160,
  canEdit = false,
  busy = false,
  hasUploadedCover = false,
  menuOpen = false,
  onMenuOpenChange,
  onUpload,
  onRemove,
}) {
  const canRemove = hasUploadedCover;

  return (
    <View style={[styles.wrapper, { width: size, height: size }]}>
      {uri
        ? GLOW_LAYERS.map((layer) => (
            <MaskedView
              key={layer.id}
              pointerEvents="none"
              style={[
                styles.glow,
                {
                  top: -GLOW_BLEED,
                  left: -GLOW_BLEED,
                  right: -GLOW_BLEED,
                  bottom: -GLOW_BLEED,
                },
              ]}
              maskElement={<GlowMask id={layer.id} stops={layer.stops} />}
            >
              <Image
                source={{ uri }}
                style={StyleSheet.absoluteFill}
                blurRadius={layer.blur}
                resizeMode="cover"
              />
            </MaskedView>
          ))
        : null}

      <Pressable
        onPress={() => {
          if (canEdit && !busy) onMenuOpenChange?.(!menuOpen);
        }}
        disabled={!canEdit || busy}
        accessibilityRole={canEdit ? "button" : "image"}
        accessibilityLabel={canEdit ? "Cambiar portada" : "Portada de la playlist"}
        style={styles.cover}
      >
        {uri ? (
          <Image
            source={{ uri }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : (
          <PlaylistIcon size={40} color={colors.textPrimary} />
        )}
      </Pressable>

      {canEdit && menuOpen && !busy ? (
        <Pressable
          onPress={() => onMenuOpenChange?.(false)}
          style={styles.menu}
          accessibilityRole="button"
          accessibilityLabel="Cerrar menú de la portada"
        >
          <Pressable
            onPress={() => {
              onMenuOpenChange?.(false);
              onUpload?.();
            }}
            style={({ pressed }) => [styles.menuButton, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Subir nueva portada"
          >
            <CameraIcon size={24} color={colors.textPrimary} />
          </Pressable>

          {canRemove ? (
            <Pressable
              onPress={() => {
                onMenuOpenChange?.(false);
                onRemove?.();
              }}
              style={({ pressed }) => [styles.menuButton, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Quitar portada"
            >
              <TrashIcon size={24} color={colors.textPrimary} />
            </Pressable>
          ) : null}
        </Pressable>
      ) : null}

      {busy ? (
        <View style={styles.busy} accessibilityLabel="Actualizando portada">
          <ActivityIndicator color={colors.textPrimary} />
        </View>
      ) : null}
    </View>
  );
}