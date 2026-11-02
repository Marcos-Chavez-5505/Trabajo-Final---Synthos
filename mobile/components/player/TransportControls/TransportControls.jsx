import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, View } from "react-native";
import { usePlayer } from "@synthos/shared";
import { colors } from "../../../theme";
import { NextIcon, PauseIcon, PlayIcon, PreviousIcon } from "../../icons";
import { TRANSPORT_STYLES as styles } from "./TransportControls.styles";

// Valores de expansión originales (iguales a la versión web).
const SPRING = { stiffness: 300, damping: 20, mass: 0.6, useNativeDriver: false };
const RELEASE_DELAY = 220;
const RADIUS_PAUSED = 26;
const RADIUS_PLAYING = 60;

/**
 * Transporte del reproductor expandido: anterior / play-pause / siguiente.
 * Port de TransportControls web: al pulsar un botón crece (1.1) y los otros se
 * encogen (0.65) con un spring, y se suelta a los 220ms. El play cambia su radio
 * según `isPlaying` y cruza los íconos con un fade. Consume el PlayerContext.
 *
 * Los tres flexGrow salen de un ÚNICO `Animated.Value` (`progress`) interpolado:
 * así los tres slots se expanden/contraen en el mismo frame, en vez de que cada
 * spring se aplique por separado desde el hilo JS.
 */
export default function TransportControls() {
	const { isPlaying, hasQueue, roomMode, playBlocked, togglePlay, next, previous, playPulse } =
		usePlayer();

	const skipDisabled = !hasQueue || roomMode;
	const playDisabled = !hasQueue || (roomMode && playBlocked);

	const [press, setPress] = useState({ type: "play", down: false });
	const timer = useRef();
	const lastPulse = useRef(playPulse);

	const progress = useRef(new Animated.Value(0)).current;
	const radius = useRef(new Animated.Value(isPlaying ? RADIUS_PLAYING : RADIUS_PAUSED)).current;
	const iconFade = useRef(new Animated.Value(isPlaying ? 1 : 0)).current;

	useEffect(() => () => clearTimeout(timer.current), []);

	const release = () => {
		clearTimeout(timer.current);
		timer.current = setTimeout(
			() => setPress((current) => ({ ...current, down: false })),
			RELEASE_DELAY,
		);
	};

	// El play también anima con atajos externos: el contexto emite un pulso.
	useEffect(() => {
		if (playPulse === lastPulse.current) return;

		lastPulse.current = playPulse;
		setPress({ type: "play", down: true });
		release();
	}, [playPulse]);

	// Un solo spring para los tres slots: 0 = reposo, 1 = pulsado.
	useEffect(() => {
		Animated.spring(progress, {
			toValue: press.down ? 1 : 0,
			stiffness: 300,
			damping: 20,
			mass: 0.6,
			useNativeDriver: false,
		}).start();
	}, [press.down, progress]);

	useEffect(() => {
		Animated.parallel([
			Animated.spring(radius, {
				toValue: isPlaying ? RADIUS_PLAYING : RADIUS_PAUSED,
				...SPRING,
			}),
			Animated.timing(iconFade, {
				toValue: isPlaying ? 1 : 0,
				duration: RELEASE_DELAY,
				useNativeDriver: false,
			}),
		]).start();
	}, [isPlaying, radius, iconFade]);

	const growOf = (type) =>
		progress.interpolate({
			inputRange: [0, 1],
			outputRange: [1, press.type === type ? 1.1 : 0.65],
		});

	const trigger = (type, callback) => {
		setPress({ type, down: true });
		callback?.();
		release();
	};

	return (
		<View style={styles.row}>
			<Animated.View
				style={[
					styles.slot,
					styles.skipSlot,
					{ flexGrow: growOf("prev") },
					skipDisabled && styles.disabled,
				]}
			>
				<Pressable
					style={styles.hit}
					onPress={() => trigger("prev", previous)}
					disabled={skipDisabled}
					accessibilityRole="button"
					accessibilityLabel="Anterior"
					accessibilityState={{ disabled: skipDisabled }}
				>
					<PreviousIcon size={28} color={colors.lighter} />
				</Pressable>
			</Animated.View>

			<Animated.View
				style={[
					styles.slot,
					styles.playSlot,
					{ flexGrow: growOf("play"), borderRadius: radius },
					playDisabled && styles.disabled,
				]}
			>
				<Pressable
					style={styles.hit}
					onPress={() => trigger("play", togglePlay)}
					disabled={playDisabled}
					accessibilityRole="button"
					accessibilityLabel={isPlaying ? "Pausar" : "Reproducir"}
					accessibilityState={{ disabled: playDisabled }}
				>
					<View style={styles.playIcons}>
						<Animated.View
							style={[
								styles.playIcon,
								{ opacity: iconFade.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) },
							]}
						>
							<PlayIcon size={36} color={colors.lighter} />
						</Animated.View>
						<Animated.View style={[styles.playIcon, { opacity: iconFade }]}>
							<PauseIcon size={36} color={colors.lighter} />
						</Animated.View>
					</View>
				</Pressable>
			</Animated.View>

			<Animated.View
				style={[
					styles.slot,
					styles.skipSlot,
					{ flexGrow: growOf("next") },
					skipDisabled && styles.disabled,
				]}
			>
				<Pressable
					style={styles.hit}
					onPress={() => trigger("next", next)}
					disabled={skipDisabled}
					accessibilityRole="button"
					accessibilityLabel="Siguiente"
					accessibilityState={{ disabled: skipDisabled }}
				>
					<NextIcon size={28} color={colors.lighter} />
				</Pressable>
			</Animated.View>
		</View>
	);
}
