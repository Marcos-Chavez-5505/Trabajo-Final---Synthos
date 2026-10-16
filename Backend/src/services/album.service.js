const prisma = require("../prisma/prismaClient");
const { paginatedSearch } = require("../utils/pagination");

const ALBUM_INCLUDE = {
	artist: true,
	_count: { select: { songs: true } },
};

const ALBUM_DETAIL_INCLUDE = {
	artist: true,
	songs: {
		orderBy: { id: "asc" },
		include: {
			songGenres: { include: { genre: true } },
			songMoods: { include: { mood: true } },
			artist: true,
		},
	},
};

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

async function getAlbumById(id) {
	return prisma.album.findUnique({
		where: { id },
		include: ALBUM_DETAIL_INCLUDE,
	});
}

module.exports = { searchAlbums, getAlbumById };
