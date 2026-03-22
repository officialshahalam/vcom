const { Router } = require("express");
const messageController = require("./message.controller");
const { protect } = require("../../middleware/auth.middleware");

const router = Router();

// POST /api/messages
router.post("/", protect, messageController.sendMessage);

// GET /api/messages/conversations
router.get("/conversations", protect, messageController.getConversationList);

// GET /api/messages/:partnerId
router.get("/:partnerId", protect, messageController.getConversation);

// PATCH /api/messages/read/:senderId
router.patch("/read/:senderId", protect, messageController.markAsRead);

module.exports = router;
