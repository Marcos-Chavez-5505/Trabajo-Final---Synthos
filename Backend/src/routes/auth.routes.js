const router = require("express").Router();
const authController = require("../controller/auth.controller.js");

router.post("/register", authController.register);

module.exports = router;