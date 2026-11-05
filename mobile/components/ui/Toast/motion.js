import { Easing, ReduceMotion } from "react-native-reanimated";

// Port de `styles/motion.ts` de beUI Native: espeja las curvas de beUI web.

export const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
export const EASE_IN_OUT = Easing.bezier(0.77, 0, 0.175, 1);

/** Feedback de presión en botones y superficies tocables. */
export const SPRING_PRESS = {
	stiffness: 500,
	damping: 30,
	mass: 0.6,
	reduceMotion: ReduceMotion.System,
};

/** Cambios de contenido: dos slots que se intercambian dentro de un control. */
export const SPRING_SWAP = {
	stiffness: 460,
	damping: 30,
	mass: 0.55,
	reduceMotion: ReduceMotion.System,
};

/** Glides de layout compartido: pills, indicadores y paneles. */
export const SPRING_LAYOUT = {
	stiffness: 360,
	damping: 32,
	mass: 0.6,
	reduceMotion: ReduceMotion.System,
};

/** Manijas y rellenos arrastrados; críticamente amortiguado. */
export const SPRING_GLIDE = {
	stiffness: 700,
	damping: 50,
	mass: 0.5,
	reduceMotion: ReduceMotion.System,
};

export const motion = {
	press: SPRING_PRESS,
	swap: SPRING_SWAP,
	layout: SPRING_LAYOUT,
	glide: SPRING_GLIDE,
	exit: { duration: 160, easing: EASE_OUT, reduceMotion: ReduceMotion.System },
	fade: { duration: 150, reduceMotion: ReduceMotion.System },
};
