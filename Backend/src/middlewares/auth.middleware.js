const jwt = require("jsonwebtoken");

function authenticate(req, res, next) {
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		return res.status(401).json({
			status: "error",
			message: "Token no proporcionado.",
		});
	}

	const token = authHeader.split(" ")[1];

	try {
		const payload = jwt.verify(token, process.env.JWT_SECRET);
		req.user = payload;
		next();
	} catch (error) {
		return res.status(401).json({
			status: "error",
			message: "Token inválido o expirado.",
		});
	}
}

/**
 * Autenticación opcional para endpoints públicos que pueden enriquecer su
 * respuesta cuando hay sesión (ej. `GET /api/users/search` agrega `isFollowing`
 * por resultado). Sin `Authorization` la request sigue como anónima
 * (`req.user = null`); si el header viene pero el token no es válido, es un
 * error del cliente que declara tener sesión y se responde 401.
 */
function optionalAuthenticate(req, res, next) {
	const authHeader = req.headers.authorization;

	if (!authHeader || !authHeader.startsWith("Bearer ")) {
		req.user = null;
		return next();
	}

	const token = authHeader.split(" ")[1];

	try {
		const payload = jwt.verify(token, process.env.JWT_SECRET);
		req.user = payload;
		next();
	} catch (error) {
		return res.status(401).json({
			status: "error",
			message: "Token inválido o expirado.",
		});
	}
}

module.exports = { authenticate, optionalAuthenticate };