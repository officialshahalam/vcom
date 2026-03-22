const { Router } = require("express");
const messageController = require("./message.controller");

const router = Router();

router.get("/:chatId", messageController.getMessages);

module.exports = router;
