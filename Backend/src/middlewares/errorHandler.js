const prisma = require("../prisma/prismaClient");

function prismaErrorHandler(err, req, res, next) {
	const isPrismaError =
		err?.name === "PrismaClientKnownRequestError" ||
		(typeof err?.code === "string" && /^P\d{4}$/.test(err.code));

	if (!isPrismaError) {
		return next(err);
	}

	const { code, meta } = err;

	const errorMap = {
		// --- Errores de datos y validación (400) ---
		P2000: {
			status: 400,
			message: "El valor proporcionado es demasiado largo para este campo.",
		},
		P2005: {
			status: 400,
			message:
				"El valor proporcionado no es válido para el tipo de dato esperado.",
		},
		P2006: { status: 400, message: "El valor proporcionado no es válido." },
		P2007: {
			status: 400,
			message: "Error de validación de datos. Revisa los campos enviados.",
		},
		P2009: {
			status: 400,
			message: "La consulta no es válida. Revisa la estructura de la petición.",
		},
		P2011: { status: 400, message: "Un campo obligatorio no puede ser nulo." },
		P2012: {
			status: 400,
			message: "Falta un valor requerido para completar la operación.",
		},
		P2013: {
			status: 400,
			message: "Falta un argumento requerido en la petición.",
		},

		// --- Errores de conflicto y relaciones (409) ---
		P2002: {
			status: 409,
			message: (meta) => {
				const fields = meta?.target
					? meta.target.join(", ")
					: "campo(s) desconocido(s)";
				return `Ya existe un registro con el mismo valor para: ${fields}. Por favor, usa un valor diferente.`;
			},
		},
		P2003: {
			status: 409,
			message:
				"No se puede completar la operación porque referencia un registro que no existe o está en uso.",
		},
		P2014: {
			status: 409,
			message: "La operación viola una relación requerida entre registros.",
		},

		// --- Errores de recurso no encontrado (404) ---
		P2001: { status: 404, message: "El registro que buscas no existe." },
		P2015: { status: 404, message: "No se encontró el registro relacionado." },
		P2025: {
			status: 404,
			message:
				"El registro que intentas actualizar o eliminar no fue encontrado.",
		},

		// --- Errores internos de consulta (500) ---
		P2008: { status: 500, message: "Error interno al procesar la consulta." },
		P2010: {
			status: 500,
			message: "Error interno al ejecutar una consulta raw.",
		},
	};

	const errorInfo = errorMap[code];

	if (errorInfo) {
		const status = errorInfo.status;
		const message =
			typeof errorInfo.message === "function"
				? errorInfo.message(meta)
				: errorInfo.message;

		return res.status(status).json({
			status: "error",
			code,
			message,
			...(process.env.NODE_ENV === "development" && meta && { meta }),
		});
	}

	console.error(`[Prisma Error Handler] Código no mapeado: ${code}`, {
		message: err.message,
		meta: err.meta,
		clientVersion: err.clientVersion,
	});

	return res.status(500).json({
		status: "error",
		code,
		message:
			"Ha ocurrido un error inesperado al procesar la solicitud en la base de datos.",
		...(process.env.NODE_ENV === "development" && {
			details: {
				originalMessage: err.message,
				meta: err.meta,
				clientVersion: err.clientVersion,
			},
		}),
	});
}

module.exports = prismaErrorHandler;
