const { Router } = require("express");
const userController = require("./user.controller");
const { protect } = require("../../middleware/auth.middleware");

const router = Router();

// GET /api/users?search=
router.get("/", protect, userController.getUsers);

// GET /api/users/:id
router.get("/:id", protect, userController.getUserById);

module.exports = router;
