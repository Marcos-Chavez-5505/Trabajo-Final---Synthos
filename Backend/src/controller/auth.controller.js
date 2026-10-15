const jwt = require("jsonwebtoken");
const authService = require("../services/auth.service");
const { validateRegisterInput } = require("../utils/validation");
const { httpError } = require("../utils/errors");

function signToken(user) {
	return jwt.sign(
		{ sub: user.id, email: user.email, username: user.username },
		process.env.JWT_SECRET,
		{ expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
	);
}

async function register(req, res, next) {
	try {
		const { email, username, password } = req.body || {};

		const validationErrors = validateRegisterInput({ email, username, password });
		if (validationErrors.length > 0) {
			throw httpError(400, "Datos inválidos.", "REGISTER_INVALID", {
				errors: validationErrors,
			});
		}

		const existing = await authService.findUserByEmailOrUsername(email, username);
		if (existing) {
			const field = existing.email === email ? "email" : "username";
			throw httpError(
				400,
				`El ${field} ya está registrado.`,
				field === "email" ? "EMAIL_TAKEN" : "USERNAME_TAKEN",
			);
		}

		const user = await authService.registerUser({ email, username, password });

		return res.status(201).json({
			status: "success",
			token: signToken(user),
			user,
		});
	} catch (error) {
		next(error);
	}
}

async function login(req, res, next) {
	try {
		const { email, password } = req.body || {};

		if (typeof email !== "string" || typeof password !== "string") {
			throw httpError(401, "Credenciales inválidas.", "INVALID_CREDENTIALS");
		}

		const user = await authService.loginUser(email, password);

		if (!user) {
			throw httpError(401, "Credenciales inválidas.", "INVALID_CREDENTIALS");
		}

		const token = signToken(user);

		return res.status(200).json({
			status: "success",
			token,
			user,
		});
	} catch (error) {
		next(error);
	}
}

async function logout(req, res, next) {
	try {
		return res.status(200).json({
			status: "success",
			message: "Sesión cerrada correctamente.",
		});
	} catch (error) {
		next(error);
	}
}

module.exports = { register, login, logout };