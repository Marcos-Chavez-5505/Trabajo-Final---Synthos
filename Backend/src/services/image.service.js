const ImageKit = require("@imagekit/nodejs");
const { toFile } = require("@imagekit/nodejs");

// Carpeta de ImageKit donde viven los avatares.
const AVATAR_FOLDER = "/avatars";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const EXTENSION_BY_TYPE = {
	"image/jpeg": "jpg",
	"image/png": "png",
	"image/webp": "webp",
};

let cached = { key: null, client: null };

function httpError(code, message) {
	const error = new Error(message);
	error.code = code;
	return error;
}

function getClient() {
	const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;

	if (!privateKey) {
		throw httpError(
			500,
			"La subida de fotos no está disponible: falta IMAGEKIT_PRIVATE_KEY en el servidor.",
		);
	}

	if (cached.key !== privateKey) {
		cached = { key: privateKey, client: new ImageKit({ privateKey }) };
	}

	return cached.client;
}

function isBase64DataUrl(value) {
	return typeof value === "string" && value.startsWith("data:image/");
}

function isAllowedImageType(mimetype) {
	return ALLOWED_IMAGE_TYPES.includes(mimetype);
}

async function uploadAvatar(buffer, { userId, mimetype }) {
	const extension = EXTENSION_BY_TYPE[mimetype];

	if (!extension) {
		throw httpError(400, "Formato de imagen no permitido.");
	}

	const fileName = `avatar-${userId}.${extension}`;

	const client = getClient();

	try {
		const uploaded = await client.files.upload({
			file: await toFile(buffer, fileName, { type: mimetype }),
			fileName,
			folder: AVATAR_FOLDER,
			useUniqueFileName: false,
			overwrite: true,
		});

		return `${uploaded.url}${uploaded.url.includes("?") ? "&" : "?"}v=${Date.now()}`;
		
	} catch (error) {
		console.error("[image.service] Falló la subida del avatar:", error);
		throw httpError(500, "No se pudo guardar la foto. Intentá de nuevo en un momento.");
	}
}

module.exports = {
	ALLOWED_IMAGE_TYPES,
	isAllowedImageType,
	isBase64DataUrl,
	uploadAvatar,
};