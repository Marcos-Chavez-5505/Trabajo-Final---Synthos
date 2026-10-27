const prisma = require("../prisma/prismaClient");

/**
 * Registra un evento de reordenamiento.
 *
 * Solo debe llamarse después de que el endpoint de orden respondió 200. Si la
 * inserción falla, se loguea y no se propaga: no altera la respuesta al cliente.
 *
 * @param {number} userId
 * @param {"personal" | "colab" | "favorites"} listType
 */
async function record(userId, listType) {
	try {
		await prisma.reorderEvent.create({
			data: { idUser: userId, listType },
		});
	} catch (error) {
		console.error("No se pudo registrar reorder_event:", error);
	}
}

module.exports = { record };
