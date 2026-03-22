import { Router } from "express";
import {
  getConversation,
  sendMessage,
} from "../controllers/messageController";
import { apiLimiter, writeLimiter } from "../middleware/rateLimiter";

const router = Router();

router.get("/:userId/:peerId", apiLimiter, getConversation);
router.post("/", writeLimiter, sendMessage);

export default router;
