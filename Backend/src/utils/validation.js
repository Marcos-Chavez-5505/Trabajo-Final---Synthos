const { httpError } = require("./errors");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getId(req) {
	const id = req.params.id;
	if (isNaN(Number(id)) || Number(id) < 0) {
		throw httpError(
			400,
			"El id tiene que ser un número entero.",
			"INVALID_ID",
			{ received: String(id) },
		);
	} else {
		return Number(id);
	}
}

function validateQuery(query) {
	if (typeof query === "string" && query.trim() !== "") {
		return query.trim();
	} else {
		throw httpError(
			400,
			"La búsqueda no puede ir vacía.",
			"INVALID_QUERY",
			{ received: typeof query === "string" ? query : typeof query },
		);
	}
}

function validateSortType(sortType) {
	const validTypes = ["alphabetical", "name", "rating"];
	if (
		typeof sortType !== "string" ||
		sortType.trim() === "" ||
		!validTypes.includes(sortType.trim())
	) {
		throw httpError(
			400,
			`El orden tiene que ser uno de: ${validTypes.join(", ")}.`,
			"INVALID_SORT",
			{ allowed: validTypes },
		);
	} else {
		return sortType.trim();
	}
}

function validateCursor(cursor) {
	if (isNaN(parseInt(cursor))) {
		return null;
	} else {
		return parseInt(cursor);
	}
}

function validateRegisterInput({ email, username, password }) {
	const errors = [];

	if (typeof email !== "string" || !EMAIL_REGEX.test(email)) {
		errors.push("El email no tiene un formato válido.");
	}

	if (
		typeof username !== "string" ||
		username.trim().length < 3 ||
		username.trim().length > 50
	) {
		errors.push("El username debe tener entre 3 y 50 caracteres.");
	}

	if (typeof password !== "string" || password.length < 8) {
		errors.push("La contraseña debe tener al menos 8 caracteres.");
	} else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
		errors.push("La contraseña debe contener al menos una letra y un número.");
	}

	return errors;
}

module.exports = {
	getId,
	validateRegisterInput,
	validateCursor,
	validateQuery,
	validateSortType,
};