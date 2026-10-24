import { useCallback, useEffect, useState } from "react";
import useAuth from "../../hooks/useAuth.js";
import {
	followUser,
	followStatus,
	getFollowCounts,
	subscribeToFollow,
	unfollowUser,
} from "../../services/usersService.js";

/**
 * Estado de "seguir" entre la sesión y una persona, con los contadores de esa
 * persona (TS-10).
 *
 * Vive en la feature y no en un Context porque su alcance es una pantalla: el
 * `PlayerContext` es el único estado realmente global de la app y este no calza.
 *
 * Se usa una sola vez por pantalla y se pasa por props a `FollowButton` y
 * `FollowStats`, en vez de que cada uno llame al service por su cuenta: si el
 * botón y el contador tuvieran cada uno su estado, al seguir a alguien el
 * número de seguidores tardaría en moverse o se movería dos veces.
 *
 * Los contadores se piden siempre, incluso sin sesión o sobre el propio
 * perfil: son datos públicos. El botón solo se habilita cuando hay sesión y
 * la persona mirada es otra (`canFollow`).
 *
 * @param {string} personId Persona cuyo perfil se está mirando.
 * @returns {{canFollow: boolean, isFollowing: boolean, isFollowedBy: boolean,
 *   isMutual: boolean, followerCount: number, followingCount: number,
 *   loading: boolean, pending: boolean, error: string|null,
 *   toggle: () => Promise<void>}}
 */
export default function useFollow(personId) {
	const { user } = useAuth();
	const viewerId = user?.id ?? null;

	// Sin sesión no hay botón, pero los contadores igual se piden. La key
	// incluye al viewer para que cambiar de cuenta recargue la relación.
	const canFollow = Boolean(viewerId) && viewerId !== personId;
	const requestKey = personId ? `${viewerId ?? "anon"}->${personId}` : null;

	const [response, setResponse] = useState({
		key: null,
		isFollowing: false,
		isFollowedBy: false,
		followerCount: 0,
		followingCount: 0,
		pending: false,
		error: null,
	});
	const [version, setVersion] = useState(0);

	// Otra vista (o el Sidebar) puede seguir/dejar de seguir a esta misma persona:
	// al avisar el service, se vuelve a pedir la relación y los contadores. Un
	// `version` en las deps dispara el fetch y deja que el cleanup corte el
	// anterior.
	useEffect(() => subscribeToFollow(() => setVersion((prev) => prev + 1)), []);

	// Contadores: solo dependen de la persona mirada. Se piden aunque no haya
	// sesión. Separado del efecto de relación para que un cambio de viewer
	// (login/logout) no vuelva a pedir un dato que no cambió.
	useEffect(() => {
		if (!personId) return undefined;

		const controller = new AbortController();
		let active = true;

		getFollowCounts(personId, { signal: controller.signal })
			.then((counts) => {
				if (!active) return;
				setResponse((prev) => ({
					...prev,
					followerCount: counts.followers,
					followingCount: counts.following,
				}));
			})
			.catch(() => {
				// Silencioso: si fallan los contadores no rompemos el perfil.
				// El estado queda en 0 y el usuario no ve un error por esto.
			});

		return () => {
			active = false;
			controller.abort();
		};
	}, [personId, version]);

	// Relación: depende del viewer. Sin sesión no se pide nada y se resuelve
	// en false. Al desloguearse (viewerId -> null) este efecto corre y no
	// dispara request, que es lo que evita el 401 en medio del logout.
	//
	// Un solo request: `follow-status` devuelve los dos sentidos y `isMutual`.
	// Antes eran dos llamadas a `isFollowing`, y cada una bajaba la lista
	// completa de seguidores de un lado para mirar un id.
	useEffect(() => {
		if (!requestKey) return undefined;
		if (!canFollow) {
			setResponse((prev) => ({
				...prev,
				key: requestKey,
				isFollowing: false,
				isFollowedBy: false,
			}));
			return undefined;
		}

		const controller = new AbortController();
		let active = true;

		followStatus(viewerId, personId, { signal: controller.signal })
			.then((relation) => {
				if (!active) return;
				setResponse((prev) => ({
					...prev,
					key: requestKey,
					isFollowing: relation.isFollowing,
					isFollowedBy: relation.isFollowedBy,
					error: null,
				}));
			})
			.catch((cause) => {
				if (!active || cause.name === "AbortError") return;
				setResponse((prev) => ({
					...prev,
					key: requestKey,
					isFollowing: false,
					isFollowedBy: false,
					error: cause.message,
				}));
			});

		return () => {
			active = false;
			controller.abort();
		};
	}, [requestKey, canFollow, viewerId, personId, version]);

	const isCurrent = response.key === requestKey;
	const loading = requestKey !== null && !isCurrent;

	const toggle = useCallback(async () => {
		if (!canFollow || response.pending) return;

		// Optimista: el botón cambia al instante y se revierte solo si el service
		// falla. Un click esperando un round trip se siente como una app rota.
		const previous = response;
		const optimistic = !previous.isFollowing;

		setResponse({
			...previous,
			isFollowing: optimistic,
			followerCount: previous.followerCount + (optimistic ? 1 : -1),
			pending: true,
			error: null,
		});

		try {
			const action = optimistic ? followUser : unfollowUser;
			const next = await action(viewerId, personId);

			setResponse({
				key: requestKey,
				isFollowing: next.isFollowing,
				isFollowedBy: previous.isFollowedBy,
				followerCount: next.followerCount,
				followingCount: next.followingCount,
				pending: false,
				error: null,
			});
		} catch (cause) {
			setResponse({
				...previous,
				pending: false,
				error: cause.message,
			});
		}
	}, [canFollow, response, requestKey, viewerId, personId]);

	const isFollowingResolved = loading ? false : response.isFollowing;
	const isFollowedByResolved = loading ? false : response.isFollowedBy;

	return {
		canFollow,
		isFollowing: isFollowingResolved,
		isFollowedBy: isFollowedByResolved,
		isMutual: isFollowingResolved && isFollowedByResolved,
		followerCount: loading ? 0 : response.followerCount,
		followingCount: loading ? 0 : response.followingCount,
		loading,
		pending: response.pending,
		error: response.error,
		toggle,
	};
}
