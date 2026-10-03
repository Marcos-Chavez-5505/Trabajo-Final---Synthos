const router = require("express").Router();
const userController = require("../controller/user.controller");
const followController = require("../controller/follow.controller");
const { authenticate } = require("../middlewares/auth.middleware");

router.get("/search", userController.searchUsers);

router.get("/:id/followers", followController.getFollowers);
router.get("/:id/following", followController.getFollowing);

router.use(authenticate);

router.post("/:id/follow", followController.follow);
router.delete("/:id/follow", followController.unfollow);

module.exports = router;