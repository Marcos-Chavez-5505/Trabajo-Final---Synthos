import { createContext, useContext } from "react";
import useRecommendation from "../hooks/useRecommendation";

const RecommendationsContext = createContext(null);

/**
 * Provider local de recomendaciones. Se monta una vez por perfil (público o
 * propio) y comparte el estado del hook con todos los hijos que lo consuman:
 * la sección que lista y el modal que envía.
 *
 * No es global a propósito: las recomendaciones son de un `userId` en
 * particular, y un provider global obligaría a invalidar el estado cada vez
 * que se cambia de perfil. Montado por perfil, cambiar de perfil desmonta y
 * remonta limpio.
 */
export function RecommendationProvider({ userId, children }) {
	const value = useRecommendation(userId);
	return (
		<RecommendationsContext.Provider value={value}>
			{children}
		</RecommendationsContext.Provider>
	);
}

export function useRecommendationContext() {
	const ctx = useContext(RecommendationsContext);
	if (!ctx) {
		throw new Error(
			"useRecommendationsContext debe usarse dentro de <RecommendationsProvider>",
		);
	}
	return ctx;
}
