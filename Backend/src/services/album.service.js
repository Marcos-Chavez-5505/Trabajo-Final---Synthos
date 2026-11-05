const prisma = require("../prisma/prismaClient");
const { paginatedSearch } = require("../utils/pagination");

const LATEST_ALBUMS_DEFAULT_LIMIT = 6;
const LATEST_ALBUMS_MAX_LIMIT = 20;

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

const LATEST_ALBUM_INCLUDE = {
	artist: { select: { id: true, name: true } },
	_count: { select: { songs: true } },
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

async function getLatestAlbums(limit) {
	const safeLimit = Math.min(
		Math.max(Number(limit) || LATEST_ALBUMS_DEFAULT_LIMIT, 1),
		LATEST_ALBUMS_MAX_LIMIT,
	);

	return prisma.album.findMany({
		where: { releaseDate: { not: null } },
		include: LATEST_ALBUM_INCLUDE,
		orderBy: { releaseDate: "desc" },
		take: safeLimit,
	});
}

module.exports = { searchAlbums, getAlbumById, getLatestAlbums };
