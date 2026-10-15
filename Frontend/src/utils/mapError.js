/**
 * Traducción de errores de la API a texto que se muestra en la pantalla.
 *
 * El backend responde `{ status, message, code }`: `code` es un identificador
 * estable (ver `utils/errors.js` en el backend) y `message` es el texto en
 * español de ese momento. Se mapea **por `code`** y el `message` queda como
 * último recurso: si el backend cambia la redacción, la pantalla no se rompe.
 * Un `code` desconocido cae en el mensaje del servidor, que siempre es más
 * útil que un texto genérico.
 */

const BY_CODE = {
	// Sesión y registro
	INVALID_CREDENTIALS: "Revisá tu email y tu contraseña.",
	REGISTER_INVALID: "Revisá los datos del formulario.",
	EMAIL_TAKEN: "Ese email ya está registrado.",
	USERNAME_TAKEN: "Ese nombre de usuario ya está en uso.",
	USERNAME_LENGTH: "El nombre de usuario tiene que tener entre 3 y 50 caracteres.",

	// Perfil y foto
	USER_NOT_FOUND: "No encontramos ese usuario.",
	PICTURE_URL_NOT_ALLOWED: "La foto no se manda como texto: se sube como archivo.",
	PICTURE_URL_INVALID: "La dirección de la foto no es válida.",
	MISSING_PICTURE: "No se recibió ninguna imagen.",
	INVALID_IMAGE_TYPE: "La foto tiene que ser JPG, PNG o WEBP.",
	IMAGE_TOO_LARGE: "La foto es demasiado grande (máximo 2 MB).",
	PICTURE_FIELD_INVALID: "No se pudo leer el archivo de la foto.",
	PICTURE_COUNT_INVALID: "Solo se puede subir una imagen a la vez.",
	PICTURE_PARSE_ERROR: "No se pudo procesar el archivo enviado.",
	IMAGEKIT_NOT_CONFIGURED: "Las fotos no están disponibles en este momento.",
	IMAGE_UPLOAD_FAILED: "No se pudo guardar la foto. Probá de nuevo.",

	// Canciones
	SONG_NOT_FOUND: "Esa canción no existe.",
	INVALID_SONG_ID: "La canción no es válida.",
	INVALID_EXPRESSION: "Ese estado de ánimo no existe.",
	EXPRESSION_REQUIRED: "Falta el estado de ánimo.",

	// Seguimiento y recomendaciones
	FOLLOW_REQUIRED:
		"Solo podés recomendar a personas con las que tenés follow mutuo (vos los seguís y ellos te siguen).",
	FOLLOW_SELF: "No podés seguirte a vos mismo.",
	NOT_FOLLOWING: "No seguías a esa persona.",
	RECOMMENDATION_SELF: "No podés recomendarte a vos mismo.",
	RECOMMENDATION_TEXT_REQUIRED: "Escribí por qué le recomendás esa canción.",
	RECOMMENDATION_SONG_REQUIRED: "Elegí una canción para recomendar.",
	RECOMMENDATION_TEXT_TOO_LONG: "El texto es demasiado largo.",

	// Favoritos
	FAVORITE_ALREADY_EXISTS: "Esa canción ya está en favoritos.",
	FAVORITE_NOT_FOUND: "Esa canción no estaba en favoritos.",

	// Playlists
	PLAYLIST_NOT_FOUND: "Esa playlist no existe.",
	PLAYLIST_NAME_REQUIRED: "Poné un nombre para la playlist.",
	PLAYLIST_NAME_TOO_LONG: "El nombre no puede superar los 50 caracteres.",
	PLAYLIST_TYPE_INVALID: "Ese tipo de playlist no existe.",
	NOT_PLAYLIST_OWNER: "Esa playlist no es tuya.",
	NOT_PLAYLIST_MEMBER: "No sos participante de esta playlist.",
	NOT_PLAYLIST_CREATOR: "Solo el creador puede hacer eso.",
	FAVORITES_LOCKED: "La playlist de favoritos no se puede modificar así.",
	FAVORITES_MANAGED_ELSEWHERE: "Los favoritos se gestionan desde su propia sección.",
	SONG_ALREADY_IN_PLAYLIST: "Esa canción ya estaba en la playlist.",
	SONG_NOT_IN_PLAYLIST: "Esa canción no estaba en la playlist.",
	SONG_ID_REQUIRED: "Falta la canción.",
	PLAYLIST_ALREADY_MEMBER: "Esa persona ya participa de la playlist.",
	PLAYLIST_MEMBER_NOT_FOUND: "Esa persona no participa de la playlist.",
	CANNOT_REMOVE_CREATOR: "No podés echarte de tu propia playlist.",

	// Invitaciones
	INVITATION_FAVORITES_LOCKED: "No podés invitar a la playlist de favoritos.",
	INVITATION_RECEIVER_REQUIRED: "Elegí a quién invitar.",
	INVITATION_USER_NOT_FOUND: "No encontramos a esa persona.",
	INVITATION_SELF: "No podés invitarte a vos mismo.",
	INVITATION_NOT_FOUND: "No tenés una invitación pendiente para esa playlist.",

	// Genéricos de validación
	INVALID_ID: "Ese identificador no es válido.",
	INVALID_QUERY: "La búsqueda no puede ir vacía.",
	INVALID_SORT: "Ese criterio de orden no existe.",
	REGISTRATION_INVITE_ONLY: "Necesitás una invitación para entrar.",
};

const BY_STATUS = {
	401: "Necesitás iniciar sesión.",
	403: "No tenés permiso para hacer eso.",
	404: "No encontramos lo que buscabas.",
	500: "El servidor tuvo un problema. Probá de nuevo en un momento.",
};

/**
 * @param {unknown} cause Error thrown por `services/api.js` (`ApiError`), o
 *   cualquier otro con `status`/`code`/`message`.
 * @param {string} [fallback] Texto cuando no hay nada mejor.
 * @returns {string} Mensaje para la UI.
 */
export function mapApiError(cause, fallback = "Algo salió mal. Probá de nuevo.") {
	const code = cause?.code;

	if (code && BY_CODE[code]) {
		return BY_CODE[code];
	}

	// Los 400 sin `code` conocido (por ejemplo un error de Prisma reenviado)
	// suelen traer el detalle en el mensaje, que es más útil que un genérico.
	if (cause?.status === 400) {
		return cause?.message || "Revisá los datos enviados.";
	}

	if (cause?.status && BY_STATUS[cause.status]) {
		return BY_STATUS[cause.status];
	}

	return cause?.message || fallback;
}