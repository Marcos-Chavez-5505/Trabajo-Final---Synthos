const multer = require("multer");
const { isAllowedImageType } = require("../services/image.service");

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

const MESSAGES_BY_MULTER_CODE = {
	LIMIT_FILE_SIZE: "La imagen supera el tamaño máximo de 2 MB.",
	LIMIT_UNEXPECTED_FILE: "El archivo debe enviarse en el campo 'picture'.",
	LIMIT_UNEXPECTED_FILE_COUNT: "Solo se acepta una imagen por request.",
};

const avatarUpload = multer({
	storage: multer.memoryStorage(),
	limits: {
		fileSize: MAX_AVATAR_BYTES,
		files: 1,
	},
	fileFilter(req, file, callback) {
		if (!isAllowedImageType(file.mimetype)) {
			const error = new Error("Formato no permitido: la foto debe ser JPG, PNG o WEBP.");
			error.code = 400;
			return callback(error);
		}

		callback(null, true);
	},
}).single("picture");

function uploadAvatar(req, res, next) {
	avatarUpload(req, res, (error) => {
		if (!error) return next();

		const message = MESSAGES_BY_MULTER_CODE[error.code];

		if (message) {
			const error400 = new Error(message);
			error400.code = 400;
			return next(error400);
		}

		if (typeof error.code !== "number") {
			error.code = 400;

			if (!error.message) {
				error.message = "No se pudo procesar el archivo enviado.";
			}
		}

		next(error);
	});
}

module.exports = { MAX_AVATAR_BYTES, uploadAvatar };