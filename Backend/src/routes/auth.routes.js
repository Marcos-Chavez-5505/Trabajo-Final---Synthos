const router = require("express").Router();
const authController = require("../controller/auth.controller.js");
const { authenticate } = require("../middlewares/auth.middleware");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authenticate, authController.logout);

module.exports = router;