const { Router } = require("express");
const authController = require("./auth.controller");
const { protect } = require("../../middleware/auth.middleware");

const router = Router();

// POST /api/auth/register
router.post("/register", authController.register);

// POST /api/auth/login
router.post("/login", authController.login);

// GET /api/auth/me
router.get("/me", protect, authController.getMe);

module.exports = router;
