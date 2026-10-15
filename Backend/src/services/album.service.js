const prisma = require("../prisma/prismaClient");
const { paginatedSearch } = require("../utils/pagination");

async function searchAlbums(query, pagination = {}) {
	const term = typeof query === "string" ? query.trim() : "";

	const where = term
		? {
				OR: [
					{ name: { contains: term, mode: "insensitive" } },
					{ artist: { name: { contains: term, mode: "insensitive" } } },
				],
			}
		: {};

	return paginatedSearch({
		delegate: prisma.album,
		where,
		include: ALBUM_INCLUDE,
		pagination,
	});
}

module.exports = searchAlbums;
