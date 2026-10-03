const router = require("express").Router();
const playlistController = require("../controller/playlist.controller");
const { authenticate } = require("../middlewares/auth.middleware");

router.get("/:id", playlistController.getPlaylistById);

router.use(authenticate);

router.post("/", playlistController.createPlaylist);
router.get("/", playlistController.getUserPlaylists);
router.put("/:id", playlistController.updatePlaylist);
router.delete("/:id", playlistController.deletePlaylist);

module.exports = router;