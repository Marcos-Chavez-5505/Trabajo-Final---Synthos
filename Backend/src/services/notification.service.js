const prisma = require("../prisma/prismaClient");
const { httpError } = require("../utils/errors");
const { paginatedSearch } = require("../utils/pagination");

const NOTIFICATION_INCLUDE = {
	actor: {
		select: {
			id: true,
			username: true,
			pictureUrl: true,
		},
	},
	song: {
		select: {
			id: true,
			title: true,
			coverUrl: true,
			artist: { select: { name: true } },
		},
	},
	playlist: {
		select: {
			id: true,
			name: true,
		},
	},
};

function toNotificationDto(notification) {
	return {
		id: notification.id,
		type: notification.type,
		isRead: notification.isRead,
		createdAt: notification.createdAt,
		actor: notification.actor
			? {
					id: notification.actor.id,
					username: notification.actor.username,
					avatarUrl: notification.actor.pictureUrl,
				}
			: null,
		song: notification.song
			? {
					id: notification.song.id,
					title: notification.song.title,
					artist: notification.song.artist?.name ?? null,
					coverUrl: notification.song.coverUrl,
				}
			: null,
		playlist: notification.playlist
			? {
					id: notification.playlist.id,
					name: notification.playlist.name,
				}
			: null,
	};
}

function validateNotificationPayload({
	idUser,
	idActor,
	type,
	idSong = null,
	idPlaylist = null,
}) {
	if (!Number.isInteger(idUser) || idUser <= 0) {
		throw httpError(400, "El destinatario es inválido.", "INVALID_ID_USER");
	}

	if (!Number.isInteger(idActor) || idActor <= 0) {
		throw httpError(400, "El actor es inválido.", "INVALID_ID_ACTOR");
	}

	if (type === "recommendation") {
		if (!Number.isInteger(idSong) || idSong <= 0) {
			throw httpError(
				400,
				"Una recomendación requiere una canción.",
				"MISSING_SONG_ID",
			);
		}
		return { idUser, idActor, type, idSong, idPlaylist: null };
	}

	if (type === "playlist_invitation") {
		if (!Number.isInteger(idPlaylist) || idPlaylist <= 0) {
			throw httpError(
				400,
				"Una invitación requiere una playlist.",
				"MISSING_PLAYLIST_ID",
			);
		}
		return { idUser, idActor, type, idSong: null, idPlaylist };
	}

	if (type === "follow") {
		return { idUser, idActor, type, idSong: null, idPlaylist: null };
	}

	throw httpError(
		400,
		`Tipo de notificación desconocido: ${type}`,
		"UNKNOWN_NOTIFICATION_TYPE",
	);
}

async function createNotification(payload) {
	const data = validateNotificationPayload(payload);

	return prisma.notification.create({
		data,
		include: NOTIFICATION_INCLUDE,
	});
}

function emitNewNotification(io, notification) {
	if (!io) return;

	io.to(`user:${notification.idUser}`).emit(
		"notification:new",
		toNotificationDto(notification),
	);
}

async function notifyUser(io, payload) {
	try {
		const notification = await createNotification(payload);
		emitNewNotification(io, notification);
		return notification;
	} catch (error) {
		console.error("[Notification] No se pudo crear la notificación.", error);
		return null;
	}
}

async function countUnread(idUser) {
	return prisma.notification.count({
		where: { idUser, isRead: false },
	});
}

async function listNotifications(idUser, pagination = {}) {
	const [result, unreadCount] = await Promise.all([
		paginatedSearch({
			delegate: prisma.notification,
			where: { idUser },
			include: NOTIFICATION_INCLUDE,
			orderBy: [{ createdAt: "desc" }, { id: "desc" }],
			pagination: {
				page: pagination.page,
				pageSize: pagination.pageSize ?? 20,
			},
		}),
		countUnread(idUser),
	]);

	return {
		notifications: result.items.map(toNotificationDto),
		page: result.page,
		pageSize: result.pageSize,
		total: result.total,
		totalPages: result.totalPages,
		unreadCount,
	};
}

async function markAsRead(idUser, notificationId) {
	const existing = await prisma.notification.findFirst({
		where: { id: notificationId, idUser },
		select: { id: true, isRead: true },
	});

	if (!existing) return null;

	const notification = existing.isRead
		? existing
		: await prisma.notification.update({
				where: { id: existing.id },
				data: { isRead: true },
				select: { id: true, isRead: true },
			});

	return {
		notification,
		unreadCount: await countUnread(idUser),
	};
}

async function markAllAsRead(idUser) {
	await prisma.notification.updateMany({
		where: { idUser, isRead: false },
		data: { isRead: true },
	});

	return { unreadCount: 0 };
}

module.exports = {
	createNotification,
	notifyUser,
	listNotifications,
	markAsRead,
	markAllAsRead,
	toNotificationDto,
};
