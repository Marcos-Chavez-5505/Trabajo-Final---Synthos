const router = require("express").Router();
const playlistController = require("../controller/playlist.controller");
const { authenticate } = require("../middlewares/auth.middleware");

router.use(authenticate);

router.get("/invitations", playlistController.listReceivedInvitations);
router.post("/invitations/:idPlaylist/accept", playlistController.acceptInvitation);
router.post("/invitations/:idPlaylist/reject", playlistController.rejectInvitation);

router.get("/:id", playlistController.getPlaylistById);
router.post("/", playlistController.createPlaylist);
router.get("/", playlistController.getUserPlaylists);
router.put("/:id", playlistController.updatePlaylist);
router.delete("/:id", playlistController.deletePlaylist);

router.post("/:id/songs", playlistController.addSong);
router.delete("/:id/songs/:songId", playlistController.removeSong);

router.post("/:id/invitation", playlistController.createInvitation);
router.get("/:id/invitations", playlistController.listPlaylistInvitations);
router.delete("/:id/members/:userId", playlistController.removeMember);

module.exports = router;