const router = require("express").Router();
const songController = require("../controller/song.controller.js");

router.get("/", songController.getSongs);
router.get("/search", songController.searchSongs);
router.get("/:id", songController.getSongById);

module.exports = router;
