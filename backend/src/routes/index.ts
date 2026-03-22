import { Router } from "express";
import messageRoutes from "../modules/messages/message.routes";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ success: true, service: "vcom-backend", status: "ok" });
});

router.use("/messages", messageRoutes);

export default router;
