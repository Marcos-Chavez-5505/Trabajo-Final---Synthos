const authService = require("../services/auth.service");
const { validateRegisterInput } = require("../utils/validation");

async function register(req, res, next) {
	try {
		const { email, username, password } = req.body || {};

		const validationErrors = validateRegisterInput({ email, username, password });
		if (validationErrors.length > 0) {
			return res.status(400).json({
				status: "error",
				message: "Datos inválidos.",
				errors: validationErrors,
			});
		}

		const existing = await authService.findUserByEmailOrUsername(email, username);
		if (existing) {
			const field = existing.email === email ? "email" : "username";
			return res.status(400).json({
				status: "error",
				message: `El ${field} ya está registrado.`,
			});
		}

		const user = await authService.registerUser({ email, username, password });

		return res.status(201).json({
			status: "success",
			user,
		});
	} catch (error) {
		next(error);
	}
}

module.exports = { register };