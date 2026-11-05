import { mapApiError } from "@synthos/shared";
import { toast } from "../components/ui/Toast";

// Catálogo de toasts de acciones. Sumá acá los mensajes nuevos en vez de
// repetir títulos en cada pantalla. La clave identifica la acción: el `id` del
// toast es `error:<clave>`, así reintentar la misma acción no apila copias.
//
// Los errores de carga que bloquean una pantalla se muestran inline (no acá);
// los de validación de campos también. Esto es solo para acciones puntuales.

const NETWORK_ERROR =
	/failed to fetch|network ?error|network request failed|load failed|timeout|timed out/i;

// Texto que no debe llegar nunca al usuario: vendría de un stack o de Prisma.
const TECHNICAL_ERROR =
	/prisma|sql|stack|undefined|\bnull\b|TypeError|Cannot read|is not a function|at .+\(.+:\d+:\d+\)/i;

const GENERIC_FALLBACK = "Intentá de nuevo en un momento.";

const CATALOG = {
	// Playlists
	"playlist:load": { title: "No se pudo cargar la playlist" },
	"playlist:songs:load": { title: "No se pudieron cargar las canciones" },
	"playlist:create": {
		title: "No se pudo crear la playlist",
		success: "Playlist creada",
	},
	"playlist:update": {
		title: "No se pudo actualizar la playlist",
		success: "Playlist actualizada",
	},
	"playlist:delete": {
		title: "No se pudo eliminar la playlist",
		success: "Playlist eliminada",
	},
	"playlist:cover:upload": {
		title: "No se pudo actualizar la portada",
		success: "Portada actualizada",
		loading: "Actualizando portada…",
	},
	"playlist:cover:remove": {
		title: "No se pudo quitar la portada",
		success: "Portada quitada",
		loading: "Quitando portada…",
	},
	"playlist:invitations:load": {
		title: "No se pudieron cargar las invitaciones",
	},
	"playlist:invite": {
		title: "No se pudo enviar la invitación",
		success: "Invitación enviada",
	},
	"playlist:invitation:accept": {
		title: "No se pudo aceptar la invitación",
		success: "Te uniste a la playlist",
	},
	"playlist:invitation:reject": {
		title: "No se pudo rechazar la invitación",
		success: "Invitación rechazada",
	},
	"playlist:member:remove": {
		title: "No se pudo sacar al participante",
		success: "Participante eliminado",
	},
	"playlist:order": { title: "No se pudo guardar el orden" },
	"playlist:song:remove": {
		title: "No se pudo quitar la canción",
		success: "Canción quitada",
	},
	"song:playlist:add": {
		title: "No se pudo agregar la canción",
		success: "Canción agregada",
	},
	"song:playlist:remove": {
		title: "No se pudo quitar la canción",
		success: "Canción quitada",
	},
	"favorite:toggle": { title: "No se pudo actualizar el favorito" },

	// Salas
	"room:join": { title: "No se pudo entrar a la sala" },
	"room:create": {
		title: "No se pudo crear la sala",
		success: "Sala creada",
	},
	"room:control": { title: "No se pudo cambiar la reproducción" },
	"room:vote": { title: "No se pudo registrar tu voto" },
	"room:leave": { title: "No se pudo salir de la sala" },
	"room:close": {
		title: "No se pudo cerrar la sala",
		success: "Sala cerrada",
	},
	"room:kick": { title: "No se pudo sacar a la persona" },

	// Perfil
	"profile:save": {
		title: "No se pudo guardar el perfil",
		success: "Perfil actualizado",
	},
	"profile:picture": {
		title: "No se pudo subir la foto",
		success: "Foto actualizada",
	},
};

function describeError(cause, fallback = GENERIC_FALLBACK) {
	const message = cause?.message ?? "";

	if (NETWORK_ERROR.test(message)) {
		return "No pudimos conectar con el servidor. Revisá tu conexión e intentá de nuevo.";
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
