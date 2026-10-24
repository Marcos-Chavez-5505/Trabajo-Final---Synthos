const notificationService = require("../services/notification.service");
const { httpError } = require("../utils/errors");

function parseId(raw) {
	const id = Number(raw);
	return Number.isInteger(id) && id > 0 ? id : null;
}

function emitRead(io, userId, notification) {
	if (!io) return;

	io.to(`user:${userId}`).emit("notification:read", {
		id: notification.id,
		unreadCount: notification.unreadCount,
	});
}

function emitReadAll(io, userId, unreadCount) {
	if (!io) return;

	io.to(`user:${userId}`).emit("notification:read-all", { unreadCount });
}

async function listNotifications(req, res, next) {
	try {
		const userId = req.user.sub;
		const result = await notificationService.listNotifications(userId, {
			page: req.query.page,
			pageSize: req.query.pageSize,
		});

		return res.status(200).json({
			status: "success",
			...result,
		});
	} catch (error) {
		next(error);
	}
}

async function markAsRead(req, res, next) {
	try {
		const userId = req.user.sub;
		const notificationId = parseId(req.params.id);

		if (!notificationId) {
			throw httpError(400, "Id inválido.", "INVALID_ID");
		}

		const result = await notificationService.markAsRead(
			userId,
			notificationId,
		);

		if (!result) {
			throw httpError(
				404,
				"La notificación no existe.",
				"NOTIFICATION_NOT_FOUND",
			);
		}

		emitRead(req.app.get("io"), userId, {
			...result.notification,
			unreadCount: result.unreadCount,
		});

		return res.status(200).json({
			status: "success",
			notification: result.notification,
			unreadCount: result.unreadCount,
		});
	} catch (error) {
		next(error);
	}
}

async function markAllAsRead(req, res, next) {
	try {
		const userId = req.user.sub;
		const result = await notificationService.markAllAsRead(userId);

		emitReadAll(req.app.get("io"), userId, result.unreadCount);

		return res.status(200).json({
			status: "success",
			unreadCount: result.unreadCount,
		});
	} catch (error) {
		next(error);
	}
}

module.exports = {
	listNotifications,
	markAsRead,
	markAllAsRead,
};
