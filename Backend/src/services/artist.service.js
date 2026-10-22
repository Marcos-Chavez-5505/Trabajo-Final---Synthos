const prisma = require("../prisma/prismaClient");
const { paginatedSearch } = require("../utils/pagination");

const ARTIST_LIST_INCLUDE = {
	_count: { select: { albums: true, songs: true } },
};

const ARTIST_DETAIL_INCLUDE = {
	_count: { select: { albums: true, songs: true } },
	albums: {
		orderBy: { name: "asc" },
		include: {
			artist: true,
			_count: { select: { songs: true } },
		},
	},
};

async function searchArtists(query, pagination = {}) {
	const term = typeof query === "string" ? query.trim() : "";

	const where = term ? { name: { contains: term, mode: "insensitive" } } : {};

	return paginatedSearch({
		delegate: prisma.artist,
		where,
		include: ARTIST_LIST_INCLUDE,
		orderBy: { name: "asc" },
		pagination,
	});
}

/** Artista con sus álbumes, ordenados alfabéticamente. */
async function getArtistById(id) {
	return prisma.artist.findUnique({
		where: { id },
		include: ARTIST_DETAIL_INCLUDE,
	});
}

module.exports = { searchArtists, getArtistById };
