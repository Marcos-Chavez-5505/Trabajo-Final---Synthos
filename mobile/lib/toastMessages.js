import { mapApiError, TOAST_COPY, TOAST_TITLES } from "@synthos/shared";
import { toast } from "../components/ui/Toast";

// Catálogo de toasts de acciones. Sumá acá los mensajes nuevos en vez de
// repetir títulos en cada pantalla. La clave identifica la acción: el `id` del
// toast es `error:<clave>`, así reintentar la misma acción no apila copias.
//
// Los errores de API van por toast, incluso los de carga: el estado vacío de
// la región queda neutral y el toast lleva "Reintentar" cuando corresponde.
// Solo las validaciones de campo siguen inline. Los textos viven en @synthos/shared.

const NETWORK_ERROR =
	/failed to fetch|network ?error|network request failed|load failed|timeout|timed out/i;

// Texto que no debe llegar nunca al usuario: vendría de un stack o de Prisma.
const TECHNICAL_ERROR =
	/prisma|sql|stack|undefined|\bnull\b|TypeError|Cannot read|is not a function|at .+\(.+:\d+:\d+\)/i;

const GENERIC_FALLBACK = "Intentá de nuevo en un momento.";

const CATALOG = {
	// Playlists
	"playlist:load": { title: TOAST_TITLES.playlistLoad },
	"playlist:songs:load": { title: TOAST_TITLES.playlistSongsLoad },
	"playlist:create": {
		title: TOAST_TITLES.playlistCreate,
		success: "Playlist creada",
	},
	"playlist:update": {
		title: TOAST_TITLES.playlistUpdate,
		success: "Playlist actualizada",
	},
	"playlist:delete": {
		title: TOAST_TITLES.playlistDelete,
		success: "Playlist eliminada",
	},
	"playlist:cover:upload": {
		title: TOAST_TITLES.playlistCoverUpload,
		success: "Portada actualizada",
		loading: "Actualizando portada…",
	},
	"playlist:cover:remove": {
		title: TOAST_TITLES.playlistCoverRemove,
		success: "Portada quitada",
		loading: "Quitando portada…",
	},
	"playlist:invitations:load": {
		title: TOAST_TITLES.playlistInvitationsLoad,
	},
	"playlist:invite": {
		title: TOAST_TITLES.playlistInvite,
		success: "Invitación enviada",
	},
	"playlist:invitation:accept": {
		title: TOAST_TITLES.playlistInvitationAccept,
		success: "Te uniste a la playlist",
	},
	"playlist:invitation:reject": {
		title: TOAST_TITLES.playlistInvitationReject,
		success: "Invitación rechazada",
	},
	"playlist:member:remove": {
		title: TOAST_TITLES.playlistMemberRemove,
		success: "Participante eliminado",
	},
	"playlist:order": { title: TOAST_TITLES.playlistOrder },
	"playlist:song:remove": {
		title: TOAST_TITLES.songRemove,
		success: "Canción quitada",
	},
	"song:playlist:add": {
		title: TOAST_TITLES.songPlaylistAdd,
		success: "Canción agregada",
	},
	"song:playlist:remove": {
		title: TOAST_TITLES.songRemove,
		success: "Canción quitada",
	},
	"favorite:toggle": { title: TOAST_TITLES.favoriteToggle },

	// Salas
	"room:join": { title: TOAST_TITLES.roomJoin },
	"room:create": {
		title: TOAST_TITLES.roomCreate,
		success: "Sala creada",
	},
	"room:control": { title: TOAST_TITLES.roomControl },
	"room:vote": { title: TOAST_TITLES.roomVote },
	"room:leave": { title: TOAST_TITLES.roomLeave },
	"room:close": {
		title: TOAST_TITLES.roomClose,
		success: "Sala cerrada",
	},
	"room:kick": { title: TOAST_TITLES.roomKick },

	// Perfil
	"profile:save": {
		title: TOAST_TITLES.profileSave,
		success: "Perfil actualizado",
	},
	"profile:picture": {
		title: TOAST_TITLES.profilePicture,
		success: "Foto actualizada",
	},

	// Entradas nuevas de la auditoría de errores inline
	"albums:load": { title: TOAST_TITLES.albumsLoad },
	"artists:load": { title: TOAST_TITLES.artistsLoad },
	"album:load": { title: TOAST_TITLES.albumDetail },
	"artist:load": { title: TOAST_TITLES.artistDetail },
	"home:songs:load": { title: TOAST_TITLES.homeSongsLoad },
	"playlists:load": { title: TOAST_TITLES.playlistsLoad },
	"room:load": { title: TOAST_TITLES.roomLoad },
	"room:play-song": { title: TOAST_TITLES.roomPlaySong },
	"room:rate": { title: TOAST_TITLES.roomRate },
	"rooms:load": { title: TOAST_TITLES.roomsLoad },
	"profile:load": { title: TOAST_TITLES.profilePublicLoad },
	"follow:toggle": { title: TOAST_TITLES.followToggle },
	"follow:list:load": { title: TOAST_TITLES.followListLoad },
	"search:songs": { title: TOAST_TITLES.searchSongs },
	"search:people": { title: TOAST_TITLES.searchPeople },
	"search:albums": { title: TOAST_TITLES.searchAlbums },
	"notifications:load": { title: TOAST_TITLES.notificationsLoad },
	"login:error": { title: TOAST_TITLES.login },
	"register:error": { title: TOAST_TITLES.register },
};

function describeError(cause, fallback = GENERIC_FALLBACK) {
	if (typeof cause === "string") {
		return NETWORK_ERROR.test(cause) ? TOAST_COPY.networkError : cause;
	}

	const message = cause?.message ?? "";

	if (NETWORK_ERROR.test(message)) {
		return TOAST_COPY.networkError;
	}

	const mapped = mapApiError(cause, fallback);

	if (TECHNICAL_ERROR.test(mapped)) return fallback;

	return mapped;
}

/**
 * Muestra el error de una acción con el título del catálogo.
 *
 * @param {unknown} cause Error de un service (`ApiError`, fetch, etc.).
 * @param {string} key Clave del catálogo (`playlist:create`, `room:join`, …).
 * @param {{retry?: () => void}} [options] Acción para el botón "Reintentar".
 */
export function showActionError(cause, key, { retry } = {}) {
	const entry = CATALOG[key] ?? {};
	const title = entry.title ?? "Algo salió mal";

	return toast.error(title, {
		id: `error:${key}`,
		description: describeError(cause, entry.fallback ?? GENERIC_FALLBACK),
		duration: 5000,
		action: retry ? { label: "Reintentar", onPress: retry } : undefined,
	});
}

/** Confirmación breve de una acción que salió bien. */
export function showSuccess(key) {
	const entry = CATALOG[key] ?? {};
	return toast.success(entry.success ?? "Listo", { id: `success:${key}` });
}

/**
 * Aviso de que el usuario perdió el acceso a una sala (inactividad, kick o un
 * 403 al reabrirla). No es un error de una acción: la pantalla lo muestra antes
 * de volver al listado, así que no lleva botón de reintentar.
 *
 * @param {"inactivity"|"kicked"|"not_member"} [reason]
 */
export function showRoomAccessLost(reason) {
	const copy = TOAST_COPY.roomAccessLost[reason] ?? TOAST_COPY.roomAccessLost.other;

	return toast.info(copy.title, {
		id: "room:access-lost",
		description: copy.description,
		duration: 5000,
	});
}

/**
 * Toast de una operación larga: pasa de carga a éxito o error sin dejar
 * rechazos sin manejar. Devuelve la misma promesa para que quien llama decida
 * si además recarga datos.
 */
export function runWithToast(key, task, { loading } = {}) {
	const entry = CATALOG[key] ?? {};
	toast.promise(
		task,
		{
			loading: loading ?? entry.loading ?? "Procesando…",
			success: entry.success ?? "Listo",
			error: (cause) => describeError(cause, entry.fallback ?? GENERIC_FALLBACK),
		},
		{ id: key },
	);
	return task;
}

export { toast };
