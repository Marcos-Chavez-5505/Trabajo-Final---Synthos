const router = require("express").Router();
const songController = require("../controller/song.controller.js");

router.get("/search", songController.searchSongs);
router.get("/recommendations", songController.getRecommendations);
router.get("/", songController.getSongs);
router.get("/:id", songController.getSongById);

module.exports = router;
