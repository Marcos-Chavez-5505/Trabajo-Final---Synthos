const router = require("express").Router();
const favoriteController = require("../controller/favorite.controller");
const { authenticate } = require("../middlewares/auth.middleware");

router.use(authenticate);

router.get("/", favoriteController.getFavorites);
router.get("/songs/ids", favoriteController.getFavoriteSongIds);
router.post("/songs", favoriteController.addFavorite);
router.delete("/songs/:songId", favoriteController.removeFavorite);

module.exports = router;