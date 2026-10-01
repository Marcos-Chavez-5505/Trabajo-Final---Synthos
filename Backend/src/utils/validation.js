const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getId(req) {
	const id = req.params.id;
	if (isNaN(Number(id)) || Number(id) < 0) {
		throw new Error("ID INVALIDA, DEBE SER UN NUMERO ENTERO > 0");
	} else {
		return Number(id);
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

module.exports = { getId, validateRegisterInput };