const multer = require("multer");
const { httpError } = require("../utils/errors");
const { isAllowedImageType } = require("../services/image.service");

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

const ERRORS_BY_MULTER_CODE = {
	LIMIT_FILE_SIZE: {
		status: 400,
		message: "La imagen supera el tamaño máximo de 2 MB.",
		code: "IMAGE_TOO_LARGE",
	},
	LIMIT_UNEXPECTED_FILE: {
		status: 400,
		message: "El archivo debe enviarse en el campo 'picture'.",
		code: "PICTURE_FIELD_INVALID",
	},
	LIMIT_UNEXPECTED_FILE_COUNT: {
		status: 400,
		message: "Solo se acepta una imagen por request.",
		code: "PICTURE_COUNT_INVALID",
	},
};

const avatarUpload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: MAX_AVATAR_BYTES,
		files: 1,
	},
	fileFilter(req, file, callback) {
		if (!isAllowedImageType(file.mimetype)) {
			return callback(
				httpError(
					400,
					"Formato no permitido: la foto debe ser JPG, PNG o WEBP.",
					"INVALID_IMAGE_TYPE",
				),
			);
		}

		callback(null, true);
	},
}).single("picture");

function uploadAvatar(req, res, next) {
	avatarUpload(req, res, (error) => {
		if (!error) return next();

		const translated = ERRORS_BY_MULTER_CODE[error.code];

		if (translated) {
			return next(
				httpError(translated.status, translated.message, translated.code),
			);
		}

		if (!Number.isInteger(error.httpStatus)) {
			return next(
				httpError(
					400,
					error.message || "No se pudo procesar el archivo enviado.",
					"PICTURE_PARSE_ERROR",
				),
			);
		}

		next(error);
	});
}

module.exports = { MAX_AVATAR_BYTES, uploadAvatar };