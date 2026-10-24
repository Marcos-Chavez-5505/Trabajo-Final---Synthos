const router = require("express").Router();
const notificationController = require("../controller/notification.controller");
const { authenticate } = require("../middlewares/auth.middleware");

router.use(authenticate);

router.patch("/read-all", notificationController.markAllAsRead);
router.get("/", notificationController.listNotifications);
router.patch("/:id/read", notificationController.markAsRead);

module.exports = router;
