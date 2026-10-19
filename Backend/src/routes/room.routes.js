const router = require("express").Router();
const roomController = require("../controller/room.controller");
const { authenticate } = require("../middlewares/auth.middleware");

router.get("/", roomController.getSortedRoom);

router.use(authenticate);

router.post("/", roomController.createRoom);
router.post("/join", roomController.joinRoom);
router.get("/mine", roomController.getMyRooms);

router.get("/:id", roomController.getRoomById);
router.delete("/:id", roomController.closeRoom);
router.post("/:id/leave", roomController.leaveRoom);
router.delete("/:id/members/:userId", roomController.kickMember);

router.post("/:id/playback", roomController.postPlayback);
router.get("/:id/playback", roomController.getPlayback);
router.post("/:id/skip-votes", roomController.postSkipVote);
router.post("/:id/rating", roomController.rateHost);

module.exports = router;
