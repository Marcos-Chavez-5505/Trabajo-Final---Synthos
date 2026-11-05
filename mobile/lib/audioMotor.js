import { isRunningInExpoGo } from "expo";
import { createAudioPlayer, setAudioModeAsync } from "expo-audio";

const UPDATE_INTERVAL_MS = 500;

const BACKGROUND_AUDIO_SUPPORTED = !isRunningInExpoGo();

function toLockScreenMetadata(song) {
	if (!song) return undefined;

	return {
		title: song.title ?? undefined,
		artist: song.artist ?? undefined,
		albumTitle: song.album ?? undefined,
		artworkUrl: song.coverUrl ?? undefined,
	};
}

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
	let pendingPlay = false;
	let duration = 0;
	let currentTime = 0;

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

		if (status.isLoaded && duration > 0 && !loaded) {
			loaded = true;
			metadataHandlers.forEach((handler) => handler());

			if (pendingSeek !== null) {
				player.seekTo(pendingSeek).catch(() => {});
				pendingSeek = null;
			}

			// Si había un play pendiente (se pidió antes de que el player
			// estuviera cargado), se ejecuta ahora que está listo.
			if (pendingPlay) {
				pendingPlay = false;
				try {
                    player.play();
                } catch {
                    // silencioso: si falla, el próximo status update lo refleja
                }
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
			pendingPlay = false;
			duration = 0;
			currentTime = 0;

			if (!source) {
				player.pause();
				setLockScreen(false);
				player.replace(null);
				return;
			}

			player.replace({ uri: source });

			if (lockScreenActive) setLockScreen(true);
		},
		play() {
			ended = false;
			setLockScreen(true);

			// Si el player todavía no cargó el track, se guarda el play y se
			// ejecuta cuando llegue `isLoaded` en el listener.
			if (!loaded) {
				pendingPlay = true;
				return Promise.resolve();
			}

			try {
				player.play();
			} catch (error) {
				return Promise.reject(error);
			}

			return Promise.resolve();
		},
		pause() {
			pendingPlay = false;
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