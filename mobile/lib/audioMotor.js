import { isRunningInExpoGo } from "expo";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";

// Mismo intervalo que el `timeupdate` del motor web: suficiente para la barra
// de progreso sin saturar el bridge.
const UPDATE_INTERVAL_MS = 500;

// El servicio en primer plano que habilita el segundo plano y el lock screen lo
// agrega el config plugin de expo-audio al compilar. Expo Go no lo tiene, así
// que intentar usar esas funciones ahí solo genera errores de binding en
// LogBox. En un development build/producción (isRunningInExpoGo() === false)
// quedan habilitadas.
const BACKGROUND_AUDIO_SUPPORTED = !isRunningInExpoGo();

/**
 * Metadata del lock screen a partir de la canción actual. `load` recibe el
 * objeto `song` como segundo argumento opcional (el contrato compartido solo
 * garantiza la URL; ver `shared/src/context/PlayerContext.jsx`).
 */
function toLockScreenMetadata(song) {
	if (!song) return undefined;

	return {
		title: song.title ?? undefined,
		artist: song.artist ?? undefined,
		albumTitle: song.album ?? undefined,
		artworkUrl: song.coverUrl ?? undefined,
	};
}

/**
 * Motor de audio para mobile, sobre `expo-audio`.
 *
 * Cumple la misma interfaz que el adaptador web (`frontend/src/lib/audioMotor.js`):
 * `load / play / pause / seek / onTimeUpdate / onLoadedMetadata / onEnded /
 * getCurrentTime / getDuration / setMuted / hasSource`. La cola, el shuffle y el
 * "siguiente" siguen en `PlayerContext`; este archivo solo controla la
 * reproducción del track actual.
 */
export function createAudioMotor() {
	const player = createAudioPlayer(null, { updateInterval: UPDATE_INTERVAL_MS });

	const timeHandlers = new Set();
	const metadataHandlers = new Set();
	const endedHandlers = new Set();

	let source = "";
	let song = null;
	let lockScreenActive = false;
	let loaded = false;
	let ended = false;
	let pendingSeek = null;
	let duration = 0;
	let currentTime = 0;

	// La sesión de audio se configura una sola vez por motor. Si falla, la
	// reproducción en primer plano sigue funcionando igual.
	setAudioModeAsync({
		playsInSilentMode: true,
		shouldPlayInBackground: BACKGROUND_AUDIO_SUPPORTED,
		interruptionMode: "doNotMix",
	}).catch(() => {});

	function setLockScreen(active) {
		if (!BACKGROUND_AUDIO_SUPPORTED) return;

		if (active) {
			player.setActiveForLockScreen(true, toLockScreenMetadata(song));
			lockScreenActive = true;
			return;
		}

		if (!lockScreenActive) return;

		player.setActiveForLockScreen(false);
		lockScreenActive = false;
	}

	const subscription = player.addListener("playbackStatusUpdate", (status) => {
		if (Number.isFinite(status.duration) && status.duration > 0) {
			duration = status.duration;
		}

		if (Number.isFinite(status.currentTime)) currentTime = status.currentTime;

		// `onLoadedMetadata` una sola vez por track, y recién cuando la duración
		// ya está disponible (el contexto pisa con este valor la duración que
		// vino en la metadata de la canción).
		if (status.isLoaded && duration > 0 && !loaded) {
			loaded = true;
			metadataHandlers.forEach((handler) => handler());

			// Si el seek llegó antes de que el track estuviera listo, se aplica acá.
			if (pendingSeek !== null) {
				player.seekTo(pendingSeek).catch(() => {});
				pendingSeek = null;
			}
		}

		if (status.didJustFinish && !ended) {
			ended = true;
			endedHandlers.forEach((handler) => handler());
		}

		timeHandlers.forEach((handler) => handler());
	});

	return {
		hasSource() {
			return Boolean(source);
		},
		load(src, nextSong = null) {
			source = src || "";
			song = nextSong;
			loaded = false;
			ended = false;
			pendingSeek = null;
			duration = 0;
			currentTime = 0;

			if (!source) {
				player.pause();
				setLockScreen(false);
				player.replace(null);
				return;
			}

			player.replace({ uri: source });

			// Cambiar de canción con el lock screen ya activo: se refresca la
			// metadata para que título/artista/carátula no queden viejos.
			if (lockScreenActive) setLockScreen(true);
		},
		play() {
			ended = false;
			setLockScreen(true);

			try {
				player.play();
			} catch (error) {
				return Promise.reject(error);
			}

			return Promise.resolve();
		},
		pause() {
			player.pause();
			setLockScreen(false);
		},
		seek(time) {
			ended = false;
			currentTime = time;

			if (!loaded) {
				pendingSeek = time;
				return;
			}

			player.seekTo(time).catch(() => {});
		},
		getCurrentTime() {
			return currentTime;
		},
		getDuration() {
			return duration;
		},
		setMuted(value) {
			player.muted = Boolean(value);
		},
		onTimeUpdate(handler) {
			timeHandlers.add(handler);
			return () => timeHandlers.delete(handler);
		},
		onLoadedMetadata(handler) {
			metadataHandlers.add(handler);
			return () => metadataHandlers.delete(handler);
		},
		onEnded(handler) {
			endedHandlers.add(handler);
			return () => endedHandlers.delete(handler);
		},
	};
}
