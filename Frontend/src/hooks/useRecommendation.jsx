import { useCallback, useEffect, useState } from "react";
import { getUserRecommendations } from "../services/recommendationService.js";
import { post } from "../services/api.js";
import { mapApiError } from "../utils/mapError.js";

/**
 * Recomendaciones de un usuario: lectura y envío.
 *
 * Lectura: `items, loading, error, retry` — para la sección del perfil.
 * Envío: `send, submitting, sendError, reset` — para el modal.
 *
 * Un solo archivo porque las dos operaciones son sobre el mismo recurso y el
 * estado de cada lado es independiente (`error` de lectura vs `sendError` de
 * envío), así que no se pisan.
 */
export default function useRecommendation(userId) {
	const [state, setState] = useState({
		key: null,
		items: [],
		loading: false,
		error: null,
	});
	const [version, setVersion] = useState(0);

	const [submitting, setSubmitting] = useState(false);
	const [sendError, setSendError] = useState(null);

	useEffect(() => {
		if (!userId) return undefined;

		const controller = new AbortController();
		let active = true;
		setState({ key: null, items: [], loading: true, error: null });

		getUserRecommendations(userId, { signal: controller.signal })
			.then((items) => {
				if (!active) return;
				const sorted = [...items].sort(
					(a, b) => new Date(b.date ?? 0) - new Date(a.date ?? 0),
				);
				setState({ key: userId, items: sorted, loading: false, error: null });
			})
			.catch((cause) => {
				if (!active || cause.name === "AbortError") return;
				setState({
					key: userId,
					items: [],
					loading: false,
					error: mapApiError(cause),
				});
			});

		return () => {
			active = false;
			controller.abort();
		};
	}, [userId, version]);

	const isCurrent = state.key === userId;
	const retry = useCallback(() => setVersion((v) => v + 1), []);

	const send = useCallback(
		async ({ songId, text }) => {
			setSubmitting(true);
			setSendError(null);

			try {
				const data = await post(`/users/${userId}/recommendations`, {
					songId,
					text,
				});
				// Refresca la lista después de enviar, así aparece sin recargar.
				setVersion((v) => v + 1);
				return { ok: true, data };
			} catch (cause) {
				setSendError(mapApiError(cause));
				return { ok: false, cause };
			} finally {
				setSubmitting(false);
			}
		},
		[userId],
	);

	const reset = useCallback(() => setSendError(null), []);

	return {
		items: isCurrent ? state.items : [],
		loading: userId ? state.loading || !isCurrent : false,
		error: isCurrent ? state.error : null,
		retry,
		send,
		submitting,
		sendError,
		reset,
	};
}
