export function mapApiError(
	cause,
	fallback = "Algo salió mal. Probá de nuevo.",
) {
	if (cause?.status === 401) return "Necesitás iniciar sesión.";
	if (cause?.status === 403)
		return "Solo podés recomendar a personas con las que tenés follow mutuo (vos los seguís y ellos te siguen).";
	if (cause?.status === 404) return "No encontramos lo que buscabas.";
	if (cause?.status === 400)
		return cause?.message || "Faltan datos: revisá el texto y la canción.";
	return cause?.message || fallback;
}
