const recommendationService = require("../services/recommendation.service");

const MAX_TEXT_LENGTH = 280;

function parseId(raw) {
	const id = Number(raw);
	return Number.isInteger(id) && id > 0 ? id : null;
}

async function createRecommendation(req, res, next) {
	try {
		const authorId = req.user.sub;
		const targetId = parseId(req.params.id);

		if (!targetId) {
			return res.status(400).json({
				status: "error",
				message: "Id inválido.",
			});
		}

		if (authorId === targetId) {
			return res.status(400).json({
				status: "error",
				message: "No podés recomendarte a vos mismo.",
			});
		}

		const { songId, text } = req.body || {};

		if (!Number.isInteger(songId) || songId <= 0) {
			return res.status(400).json({
				status: "error",
				message: "El songId es obligatorio.",
			});
		}

		if (typeof text !== "string" || text.trim().length === 0) {
			return res.status(400).json({
				status: "error",
				message: "El texto es obligatorio.",
			});
		}

		if (text.length > MAX_TEXT_LENGTH) {
			return res.status(400).json({
				status: "error",
				message: `El texto no puede superar los ${MAX_TEXT_LENGTH} caracteres.`,
			});
		}

		const targetExists = await recommendationService.userExists(targetId);
		if (!targetExists) {
			return res.status(404).json({
				status: "error",
				message: "El usuario destino no existe.",
			});
		}

		const songExists = await recommendationService.songExists(songId);
		if (!songExists) {
			return res.status(404).json({
				status: "error",
				message: "La canción no existe.",
			});
		}

		const mutual = await recommendationService.hasMutualFollow(
			authorId,
			targetId,
		);
		if (!mutual) {
			return res.status(403).json({
				status: "error",
				message: "Necesitan seguirse mutuamente para recomendar.",
			});
		}

		const recommendation = await recommendationService.createRecommendation({
			idAuthor: authorId,
			idUser: targetId,
			songId,
			text: text.trim(),
		});

		return res.status(201).json({
			status: "success",
			recommendation,
		});
	} catch (error) {
		next(error);
	}
}

async function getRecommendations(req, res, next) {
	try {
		const viewerId = req.user.sub;
		const profileId = parseId(req.params.id);

		if (!profileId) {
			return res.status(400).json({
				status: "error",
				message: "Id inválido.",
			});
		}

		const exists = await recommendationService.userExists(profileId);
		if (!exists) {
			return res.status(404).json({
				status: "error",
				message: "El usuario no existe.",
			});
		}

		const recommendations =
			await recommendationService.getRecommendationsForProfile(
				profileId,
				viewerId,
			);

		return res.status(200).json({
			status: "success",
			recommendations,
		});
	} catch (error) {
		next(error);
	}
}

async function getFollowStatus(req, res, next) {
	try {
		const viewerId = req.user.sub;
		const targetId = parseId(req.params.id);

		if (!targetId) {
			return res.status(400).json({
				status: "error",
				message: "Id inválido.",
			});
		}

		const exists = await recommendationService.userExists(targetId);
		if (!exists) {
			return res.status(404).json({
				status: "error",
				message: "El usuario no existe.",
			});
		}

		const status = await recommendationService.getFollowStatus(
			viewerId,
			targetId,
		);

		return res.status(200).json({
			status: "success",
			...status,
		});
	} catch (error) {
		next(error);
	}
}

module.exports = {
	createRecommendation,
	getRecommendations,
	getFollowStatus,
};