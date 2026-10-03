const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getId(req) {
	const id = req.params.id;
	if (isNaN(Number(id)) || Number(id) < 0) {
		const error = new Error(
			`INVALID ID, MUST BE AN INTEGER GREATER THAN 0, RECEIVED ${id} OF TYPE ${typeof id}`,
		);
		error.code = 400;
		throw error;
	} else {
		return Number(id);
	}
}

function validateQuery(query) {
	if (typeof query === "string" && query.trim() !== "") {
		return query.trim();
	} else {
		const error = new Error(
			`EXPECTED NON-EMPTY QUERY STRING RECEIVED ${query.trim()} OF TYPE ${typeof query}`,
		);
		error.code = 400;
		throw error;
	}
}

function validateSortType(sortType) {
	const validTypes = ["alphabetical", "rating"];
	if (
		typeof sortType !== "string" ||
		sortType.trim() === "" ||
		!validTypes.includes(sortType.trim())
	) {
		const error = new Error(
			"Unknown sort type, only supported types: alphabetical (default) | rating",
		);
		error.code = 400;
		throw error;
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
