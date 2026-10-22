const router = require("express").Router();
const artistController = require("../controller/artist.controller");

router.get("/", artistController.searchArtists);
router.get("/:id", artistController.getArtistById);

module.exports = router;
