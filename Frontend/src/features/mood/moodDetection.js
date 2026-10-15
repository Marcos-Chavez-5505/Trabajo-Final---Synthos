/**
 * Detección de estado de ánimo en el navegador (TS-20 / F9, decisión D4).
 *
 * **face-api.js 0.22.2 desde CDN, sin dependencia npm.** Se carga bajo demanda:
 * el bundle son ~664 KB y la pantalla de ánimo es una de pocas, así que
 * cargarlo en `index.html` pagaría ese peso en cada visita a la app. Cuando el
 * CDN no responde (sin red, APK sin internet) la promesa se rechaza y la
 * pantalla cae al selector manual: la app nunca queda sin hacer.
 *
 * **Modelo `tiny`:** `tiny_face_detector` + `face_expression_net`. El detector
 * solo localiza el rostro (~190 KB) y la red de expresiones devuelve las 7
 * emociones con su confianza (~310 KB); no se carga el landmarker de 468 puntos
 * porque acá no se necesita geometría.
 *
 * **Privacidad:** los frames se quedan en el dispositivo. No se sube ninguna
 * imagen a ningún servidor, ni ours ni de terceros.
 */

const FACE_API_SRC =
	'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';

const WEIGHTS_PATH =
	'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights';

/** Modelo de detección usado. Ver la nota de arriba sobre por qué el tiny. */
export const currentModel = 'tiny';

/** Estados de ánimo del catálogo: lo único que el backend acepta. */
export const MOODS = ['happy', 'neutral', 'sad'];

export const MOOD_LABELS = {
	happy: 'Feliz',
	neutral: 'Neutral',
	sad: 'Triste',
};

/**
 * Las 7 expresiones de face-api reducidas a los 3 estados del catálogo. Lo que
 * no tiene estado propio se reparte por lo que expresa: enojo, miedo y asco son
 * los más cercanos a "triste", y sorpresa a "feliz".
 */
const EXPRESSION_TO_MOOD = {
	happy: 'happy',
	surprised: 'happy',
	sad: 'sad',
	angry: 'sad',
	fearful: 'sad',
	disgusted: 'sad',
	neutral: 'neutral',
};

/** Confianza mínima para dar por buena una expresión; si no, `neutral`. */
const CONFIDENCE_THRESHOLD = 0.55;

let scriptPromise = null;
let modelsPromise = null;

function loadScript() {
	if (window.faceapi) return Promise.resolve(window.faceapi);

	if (scriptPromise) return scriptPromise;

	scriptPromise = new Promise((resolve, reject) => {
		const script = document.createElement('script');

		script.src = FACE_API_SRC;
		script.async = true;
		script.crossOrigin = 'anonymous';
		script.onload = () =>
			window.faceapi
				? resolve(window.faceapi)
				: reject(new Error('face-api cargó pero no quedó disponible.'));
		script.onerror = () => {
			scriptPromise = null;
			reject(new Error('No se pudo cargar el detector de estado de ánimo.'));
		};

		document.head.appendChild(script);
	});

	return scriptPromise;
}

async function loadModels() {
	if (modelsPromise) return modelsPromise;

	modelsPromise = loadScript()
		.then((faceapi) =>
			Promise.all([
				faceapi.nets.tinyFaceDetector.loadFromUri(WEIGHTS_PATH),
				faceapi.nets.faceExpressionNet.loadFromUri(WEIGHTS_PATH),
			]),
		)
		.then(() => window.faceapi)
		.catch((cause) => {
			// Que un intento fallido no condene la pantalla: se reintenta la
			// próxima vez que se entra.
			modelsPromise = null;
			throw cause;
		});

	return modelsPromise;
}

/**
 * Prepara el detector. Es idempotente: la segunda llamada devuelve la misma
 * promesa (y no vuelve a bajar script ni pesos).
 *
 * @returns {Promise<boolean>} `true` si el detector quedó listo.
 */
export function prepareDetector() {
	return loadModels()
		.then(() => true)
		.catch(() => false);
}

/**
 * Traduce el objeto de expresiones de face-api al estado de ánimo del catálogo.
 *
 * Sale la de mayor confianza; si no llega al umbral se devuelve `neutral` en
 * lugar de arriesgar una canción equivocada. Es una función pura a propósito:
 * es la parte con reglas y se puede probar sin cámara.
 *
 * @param {Record<string, number>} expressions Expresiones con su confianza.
 * @returns {{mood: string, expression: string, confidence: number}}
 */
export function moodFromExpressions(expressions) {
	const [expression, confidence] = Object.entries(expressions ?? {})
		.filter(([name]) => EXPRESSION_TO_MOOD[name])
		.reduce((best, current) => (current[1] > best[1] ? current : best), [
			'neutral',
			0,
		])

	return {
		mood: confidence >= CONFIDENCE_THRESHOLD ? EXPRESSION_TO_MOOD[expression] : 'neutral',
		expression,
		confidence,
	}
}

/**
 * Analiza un frame de video y devuelve el estado de ánimo.
 *
 * @param {HTMLVideoElement} video Video ya reproduciendo.
 * @param {number} [inputSize] Tamaño de entrada del detector. El default
 *   (320) es lo que face-api espera para el tiny y mantiene el análisis barato.
 * @returns {Promise<{mood: string|null, expression: string|null,
 *   confidence: number, hasFace: boolean}>} `mood` es `null` cuando no hay rostro;
 *   `hasFace` distingue ese caso del de "rostro pero sin confianza".
 */
export async function detectMood(video, inputSize = 320) {
	const faceapi = await loadModels();

	const detection = await faceapi
		.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize }))
		.withFaceExpressions();

	if (!detection) {
		return { mood: null, expression: null, confidence: 0, hasFace: false };
	}

	const { mood, expression, confidence } = moodFromExpressions(detection.expressions)

	return { mood, expression, confidence, hasFace: true };
}