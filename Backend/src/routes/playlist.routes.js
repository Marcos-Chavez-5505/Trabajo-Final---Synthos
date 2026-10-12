const router = require("express").Router();
const playlistController = require("../controller/playlist.controller");
const { authenticate } = require("../middlewares/auth.middleware");

router.get("/:id", playlistController.getPlaylistById);

router.use(authenticate);

router.post("/", playlistController.createPlaylist);
router.get("/", playlistController.getUserPlaylists);
router.put("/:id", playlistController.updatePlaylist);
router.delete("/:id", playlistController.deletePlaylist);

router.post("/:id/invitation", playlistController.generateInvitation);
router.get("/join/:token", playlistController.previewInvitation);
router.post("/join/:token", playlistController.joinPlaylist);

module.exports = router;