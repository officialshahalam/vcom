import { Router, RequestHandler } from "express";
import { conversation, readMessage, send } from "./chat.controller";
import { authenticate } from "../auth/auth.middleware";

const router = Router();

router.post("/send", authenticate, send as RequestHandler);
router.get("/conversation/:peerId", authenticate, conversation as RequestHandler);
router.patch("/read/:messageId", authenticate, readMessage as RequestHandler);

export default router;
