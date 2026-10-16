const router = require("express").Router();
const albumController = require("../controller/album.controller");

router.get("/:id", albumController.getAlbumById);

module.exports = router;
