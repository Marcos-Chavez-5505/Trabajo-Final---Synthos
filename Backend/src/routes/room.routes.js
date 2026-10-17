const router = require("express").Router();
const roomController = require("../controller/room.controller");
const { authenticate } = require("../middlewares/auth.middleware");

router.get("/", roomController.getSortedRoom);

router.post("/:id/rating", authenticate, roomController.rateHost);

module.exports = router;
