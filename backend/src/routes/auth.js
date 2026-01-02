const express = require("express");
const passport = require("passport");
const AuthController = require("../controllers/AuthController");
const { protect } = require("../middleware/authMiddleware");
const {
  validateRegistration,
  validateLogin,
} = require("../middleware/validation");

const router = express.Router();

// Strategy initialization (Passport config is loaded in server.js)
require("../services/strategies/LocalStrategy");

router.post("/register", validateRegistration, AuthController.register);
router.post(
  "/login",
  validateLogin,
  passport.authenticate("local", { session: false }),
  AuthController.login
);
router.get("/me", protect, AuthController.getMe);

module.exports = router;
