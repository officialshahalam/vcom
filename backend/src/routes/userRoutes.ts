import { Router } from "express";
import { getUsers, getUserById } from "../controllers/userController";
import { apiLimiter } from "../middleware/rateLimiter";

const router = Router();

router.get("/", apiLimiter, getUsers);
router.get("/:id", apiLimiter, getUserById);

export default router;
