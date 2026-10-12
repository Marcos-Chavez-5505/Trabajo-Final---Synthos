const ImageKit = require("@imagekit/nodejs");

const key = process.env.IMAGEKIT_PRIVATE_KEY;
const imagekit = new ImageKit({
	privateKey: key,
});

// Detecta si el string es una data URL base64 ej: data:image/png;base64...
function isBase64DataUrl(value) {
	return typeof value === "string" && value.startsWith("data:image/");
}

async function uploadBase64(dataUrl, fileName) {
	// ImageKit acepta la data URL completa tal cual, con el prefijo incluido
	return imagekit.files.upload({
		file: dataUrl,
		fileName,
		folder: "/avatars",
	});
}

module.exports = { isBase64DataUrl, uploadBase64 };
