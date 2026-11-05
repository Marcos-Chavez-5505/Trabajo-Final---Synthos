const prisma = require("../prisma/prismaClient");
const { paginatedSearch } = require("../utils/pagination");

const NEW_ARTISTS_DEFAULT_LIMIT = 6;
const NEW_ARTISTS_MAX_LIMIT = 20;

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

const NEW_ARTIST_SELECT = {
	id: true,
	name: true,
	pictureUrl: true,
	joindate: true,
	_count: { select: { albums: true, songs: true } },
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

async function getNewArtists(limit = NEW_ARTISTS_DEFAULT_LIMIT) {
	const safeLimit = Math.min(
		Math.max(Number(limit) || NEW_ARTISTS_DEFAULT_LIMIT, 1),
		NEW_ARTISTS_MAX_LIMIT,
	);

	return prisma.artist.findMany({
		where: { joindate: { not: null } },
		select: NEW_ARTIST_SELECT,
		orderBy: { joindate: "desc" },
		take: safeLimit,
	});
}

module.exports = { searchArtists, getArtistById, getNewArtists };
