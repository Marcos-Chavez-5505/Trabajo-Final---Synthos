/**
 * Errores con status HTTP y código de negocio estable.
 *
 * El `code` es el contrato con el frontend: una cadena estable que no depende
 * del idioma del mensaje. El frontend lo usa para decidir qué texto mostrar
 * (`utils/mapError.js`) y solo cae al `message` del servidor como último
 * recurso. Antes los errores de validación solo llevaban `{ status, message }`
 * y el texto en español era el único que podía usar la UI, así que cualquier
 * cambio de redacción rompía la pantalla.
 *
 * @param {number} httpStatus 400, 403, 404…
 * @param {string} message Texto para el humano, siempre en español.
 * @param {string} code Código estable, ej. `USERNAME_TAKEN`.
 * @param {object} [extra] Campos extra para el cuerpo (ej. `{ errors: [] }`).
 * @returns {Error} Error listo para `throw`.
 */
function httpError(httpStatus, message, code, extra = {}) {
	const error = new Error(message);

	error.httpStatus = httpStatus;
	error.code = code;
	error.extra = extra;

	return error;
}

module.exports = { httpError };