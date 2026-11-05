const router = require("express").Router();
const artistController = require("../controller/artist.controller");

router.get("/new", artistController.getNewArtists);
router.get("/", artistController.searchArtists);
router.get("/:id", artistController.getArtistById);

module.exports = router;
