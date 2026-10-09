const router = require("express").Router();
const userController = require("../controller/user.controller");
const followController = require("../controller/follow.controller");
const { authenticate, optionalAuthenticate } = require("../middlewares/auth.middleware");
const recommendationController = require("../controller/recommendation.controller");

router.get("/search", optionalAuthenticate, userController.searchUsers);
router.get("/me", authenticate, userController.getMe);
router.patch("/me", authenticate, userController.updateMe);
router.get("/:id", userController.getUserById);

router.get("/:id/followers", followController.getFollowers);
router.get("/:id/following", followController.getFollowing);

router.use(authenticate);

router.post("/:id/follow", followController.follow);
router.delete("/:id/follow", followController.unfollow);

router.get("/:id/follow-status", recommendationController.getFollowStatus);
router.post("/:id/recommendations", recommendationController.createRecommendation);
router.get("/:id/recommendations", recommendationController.getRecommendations);

module.exports = router;