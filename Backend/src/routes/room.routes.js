const router = require("express").Router();
const roomController = require("../controller/room.controller");

router.get("/", roomController.getSortedRoom);

module.exports = router;
