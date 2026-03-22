import { Router, RequestHandler } from "express";
import { getMe, getUsers } from "./user.controller";
import { authenticate } from "../auth/auth.middleware";

const router = Router();

router.get("/me", authenticate, getMe as RequestHandler);
router.get("/", authenticate, getUsers as RequestHandler);

export default router;
