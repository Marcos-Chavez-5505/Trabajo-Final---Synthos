import { del, get, post } from "./api.js";
import { toSong } from "./songsService.js";
import { mapGenreLabels } from "../utils/genreLabels.js";

const listeners = new Set();

export function subscribeToRooms(listener) {
	listeners.add(listener);

	return () => listeners.delete(listener);
}

export function notifyRoomsChanged() {
	listeners.forEach((listener) => listener());
}

export const ROOM_SORTS = [
	{ value: "name", label: "Nombre" },
	{ value: "rating", label: "Mejor calificado" },
];

export const DEFAULT_ROOM_SORT = "name";

export const ROOM_ORDERS = [
	{ value: "asc", label: "Ascendente" },
	{ value: "desc", label: "Descendente" },
];

export const DEFAULT_ROOM_ORDER = "asc";

const PLAYBACK_ACTIONS = ["play", "pause", "next", "stop", "play-song"];

export async function searchRooms({
	query = "",
	sort,
	order,
	page = 1,
	signal,
} = {}) {
	const data = await get("/rooms", {
		params: {
			query: String(query ?? "").trim(),
			sort: normaliseSort(sort),
			order: normaliseOrder(order),
			page: Math.max(Number(page) || 1, 1),
		},
		signal,
	});

	return {
		items: (data?.items ?? []).map(toRoom),
		total: Number(data?.total ?? 0),
		page: Number(data?.page ?? 1),
		pageSize: Number(data?.pageSize ?? 12),
		totalPages: Number(data?.totalPages ?? 1),
	};
}

export async function listMyRooms({ signal } = {}) {
	const data = await get("/rooms/mine", { signal });

	return (data ?? []).map(toRoom);
}

export async function createRoom({
	name,
	description,
	playlistId,
	isPrivate,
}) {
	const data = await post("/rooms", {
		name,
		description: description || "",
		playlistId: Number(playlistId),
		isPrivate: Boolean(isPrivate),
	});

	notifyRoomsChanged();

	return toRoomDetail(data?.room);
}

export async function joinRoom(code) {
	const data = await post("/rooms/join", {
		code: String(code ?? "")
			.trim()
			.toUpperCase(),
	});

	notifyRoomsChanged();

	return toRoomDetail(data?.room);
}

export async function leaveRoom(roomId) {
	try {
		await post(`/rooms/${roomId}/leave`);
	} catch (cause) {
		if (cause?.status === 404) return false;
		throw cause;
	}

	notifyRoomsChanged();

	return true;
}

export async function getRoomById(roomId) {
	try {
		const data = await get(`/rooms/${roomId}`);

		return toRoomDetail(data?.room);
	} catch (cause) {
		if (cause?.status === 404) return null;
		throw cause;
	}
}

export async function closeRoom(roomId) {
	await del(`/rooms/${roomId}`);

	notifyRoomsChanged();

	return true;
}

export async function kickMember(roomId, userId) {
	await del(`/rooms/${roomId}/members/${userId}`);

	return true;
}

export async function getPlayback(roomId) {
	const data = await get(`/rooms/${roomId}/playback`);

	return {
		playback: toPlayback(data?.playback),
		skipVotes: toSkipVotes(data?.skipVotes),
	};
}

export async function controlPlayback(roomId, action, songId) {
	if (!PLAYBACK_ACTIONS.includes(action)) {
		throw new Error(`Acción de reproducción desconocida: ${action}`);
	}

	const body =
		action === "play-song" ? { action, songId: Number(songId) } : { action };

	const data = await post(`/rooms/${roomId}/playback`, body);

	return toPlayback(data?.playback);
}

export async function voteSkip(roomId) {
	const data = await post(`/rooms/${roomId}/skip-votes`);

	return {
		skipVotes: toSkipVotes(data?.skipVotes),
		approved: Boolean(data?.approved),
	};
}

export async function rateHost(roomId, rating) {
	try {
		await post(`/rooms/${roomId}/rating`, { rating: Number(rating) });
	} catch (cause) {
		if (cause?.status === 403 || cause?.status === 409) return false;
		throw cause;
	}

	return true;
}

function normaliseSort(sort) {
	const value = String(sort ?? "").trim();

	return ROOM_SORTS.some((c) => c.value === value) ? value : DEFAULT_ROOM_SORT;
}

function normaliseOrder(order) {
	const value = String(order ?? "")
		.trim()
		.toLowerCase();

	return ROOM_ORDERS.some((c) => c.value === value)
		? value
		: DEFAULT_ROOM_ORDER;
}

function toRoom(raw) {
	if (!raw) return null;

	const avg = raw.avg_rating ?? raw.avgRating ?? raw.hostRating ?? null;
	const rating = avg === null ? null : Number(avg);

	return {
		id: String(raw.id),
		code: raw.code,
		name: raw.name,
		description: raw.description ?? "",
		hostId: raw.host_id ?? raw.hostId ?? null,
		hostUsername: raw.host_username ?? raw.hostUsername ?? null,
		hostAvatarUrl: raw.host_picture_url ?? raw.hostAvatarUrl ?? null,
		hostRating: rating === 0 ? null : rating,
		ratingsCount: Number(raw.ratings_count ?? raw.ratingsCount ?? 0),
		...toRoomCardFields(raw),
		songsCount: Number(raw.songs_count ?? raw.songsCount ?? 0),
		isPrivate: Boolean(raw.is_private ?? raw.isPrivate),
		maxCapacity: raw.max_capacity ?? raw.maxCapacity ?? null,
		status: raw.status ?? "activa",
	};
}

/**
 * Campos de la tarjeta que comparten el listado (`is_live`, `members_count`) y
 * el evento `room:card-updated` (`isLive`, `membersCount`). Se mapea una sola
 * vez para no aplicar `mapGenreLabels` dos veces.
 */
export function toRoomCardFields(raw) {
	if (!raw) {
		return { isLive: false, membersCount: 0, members: [], genres: [] };
	}

	return {
		isLive: Boolean(raw.is_live ?? raw.isLive),
		membersCount: Number(raw.members_count ?? raw.membersCount ?? 0),
		members: Array.isArray(raw.members) ? raw.members.map(toRoomCardMember) : [],
		genres: mapGenreLabels(raw.genres),
	};
}

function toRoomDetail(raw) {
	if (!raw) return null;

	const playlist = raw.playlistSource ?? raw.playlist_source ?? null;
	const avg = raw.hostAvgRating ?? raw.host_avg_rating ?? null;

	return {
		...toRoom({
			...raw,
			avg_rating: avg,
			ratings_count: raw.hostRatingsCount ?? raw.host_ratings_count ?? 0,
			members_count: (raw.members ?? []).length,
			songs_count: (playlist?.songs ?? []).length,
		}),
		members: (raw.members ?? []).map(toRoomMember),
		songs: (playlist?.songs ?? []).map((row) => toSong(row.song)),
		playlistName: playlist?.name ?? "",
		viewerHasRated: Boolean(raw.viewerHasRated ?? raw.viewer_has_rated),
	};
}

function toRoomMember(raw) {
	return {
		userId: String(raw.idUser ?? raw.id_user ?? raw.user?.id),
		username: raw.user?.username ?? "",
		avatarUrl: raw.user?.pictureUrl ?? null,
		role: raw.role,
	};
}

/**
 * Invitado de la tarjeta: solo lo que se pinta. Viene del listado y ya está
 * filtrado por presencia en el backend.
 */
function toRoomCardMember(raw) {
	return {
		id: String(raw.id),
		username: raw.username ?? "",
		avatarUrl: raw.avatarUrl ?? null,
	};
}

function toPlayback(raw) {
	return {
		songId: raw?.songId ?? null,
		status: raw?.status ?? "stopped",
		positionMs: Number(raw?.positionMs ?? 0),
		updatedAt: Number(raw?.updatedAt ?? 0),
		serverTime: Number(raw?.serverTime ?? 0),
	};
}

function toSkipVotes(raw) {
	return {
		voters: (raw?.voters ?? []).map(String),
		required: Number(raw?.required ?? 0),
		hasVoted: Boolean(raw?.hasVoted),
	};
}