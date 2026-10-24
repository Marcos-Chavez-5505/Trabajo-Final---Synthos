const recommendationService = require("../services/recommendation.service");
const notificationService = require("../services/notification.service");
const { httpError } = require("../utils/errors");

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
			throw httpError(400, "Id inválido.", "INVALID_ID");
		}

		if (authorId === targetId) {
			throw httpError(
				400,
				"No podés recomendarte a vos mismo.",
				"RECOMMENDATION_SELF",
			);
		}

		const { songId, text } = req.body || {};

		if (!Number.isInteger(songId) || songId <= 0) {
			throw httpError(
				400,
				"El songId es obligatorio.",
				"RECOMMENDATION_SONG_REQUIRED",
			);
		}

		if (typeof text !== "string" || text.trim().length === 0) {
			throw httpError(
				400,
				"El texto es obligatorio.",
				"RECOMMENDATION_TEXT_REQUIRED",
			);
		}

		if (text.length > MAX_TEXT_LENGTH) {
			throw httpError(
				400,
				`El texto no puede superar los ${MAX_TEXT_LENGTH} caracteres.`,
				"RECOMMENDATION_TEXT_TOO_LONG",
			);
		}

		const targetExists = await recommendationService.userExists(targetId);
		if (!targetExists) {
			throw httpError(
				404,
				"El usuario destino no existe.",
				"USER_NOT_FOUND",
			);
		}

		const songExists = await recommendationService.songExists(songId);
		if (!songExists) {
			throw httpError(404, "La canción no existe.", "SONG_NOT_FOUND");
		}

		const mutual = await recommendationService.hasMutualFollow(
			authorId,
			targetId,
		);
		if (!mutual) {
			throw httpError(
				403,
				"Necesitan seguirse mutuamente para recomendar.",
				"FOLLOW_REQUIRED",
			);
		}

		const recommendation = await recommendationService.createRecommendation({
			idAuthor: authorId,
			idUser: targetId,
			songId,
			text: text.trim(),
		});

		await notificationService.notifyUser(req.app.get("io"), {
			idUser: targetId,
			idActor: authorId,
			type: "recommendation",
			idSong: songId,
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
			throw httpError(400, "Id inválido.", "INVALID_ID");
		}

		const exists = await recommendationService.userExists(profileId);
		if (!exists) {
			throw httpError(404, "El usuario no existe.", "USER_NOT_FOUND");
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
			throw httpError(400, "Id inválido.", "INVALID_ID");
		}

		const exists = await recommendationService.userExists(targetId);
		if (!exists) {
			throw httpError(404, "El usuario no existe.", "USER_NOT_FOUND");
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