const { Router } = require("express");
const messageRoutes = require("../modules/messages/message.routes");

const router = Router();

router.get("/health", (req, res) => {
  res.json({ success: true, service: "vcom-backend", status: "ok" });
});

router.use("/messages", messageRoutes);

module.exports = router;
